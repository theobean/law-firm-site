import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { CHAT_QUOTA_POLICY, QuotaError, reserveChatQuota } from "../src/lib/chat/quota.mjs";
import { readBoundedJson } from "../src/lib/chat/protocol.mjs";

const digest = (value) => createHash("sha256").update(value).digest("hex");
const identity = (tier, subject = "subject", network = "network") => ({
  tier, subjectKey: digest(subject), networkKey: digest(network),
});
const denied = (status) => (error) => error instanceof QuotaError && error.status === status;

/**
 * Exercise the production Lua against a real, explicitly designated test Redis
 * database. No JavaScript implementation of the admission algorithm is used.
 * Credentials stay in memory; only random test-namespace keys are touched.
 * @param {Record<string, string | undefined>} env
 */
export async function runRedisQuotaIntegration(env) {
  if (env?.CHAT_REDIS_TEST_DATABASE !== "true" || env.VERCEL_ENV === "production" ||
      (typeof process !== "undefined" && process.env.VERCEL_ENV === "production")) {
    throw new Error("Redis integration requires an explicitly designated non-production test database");
  }
  let origin;
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim();
  try {
    const url = new URL(env.UPSTASH_REDIS_REST_URL || "");
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash ||
        !token || token.length > 8192 || /[\u0000-\u001F\u007F]/.test(token)) throw new Error("configuration");
    origin = url.origin;
  } catch {
    throw new Error("Redis integration requires valid HTTPS test configuration");
  }

  const actualFetch = globalThis.fetch;
  /** @type {Map<string, Set<string>>} */
  const ownedByNamespace = new Map();
  /** @type {Set<string>} */
  const ownedKeys = new Set();

  const assertOwned = (key) => assert.ok(ownedKeys.has(key), "Only keys captured from this test run may be accessed");
  const send = async (command) => {
    try {
      const response = await actualFetch(origin, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(command), signal: AbortSignal.timeout(5000), cache: "no-store", redirect: "error",
      });
      if (!response.ok) throw new Error("store");
      const payload = await readBoundedJson(response);
      if (!payload || typeof payload !== "object" || Array.isArray(payload) || "error" in payload || !("result" in payload)) throw new Error("store");
      return payload.result;
    } catch {
      throw new Error("Redis integration command failed");
    }
  };
  const readHash = async (key) => {
    assertOwned(key);
    const value = await send(["HGETALL", key]);
    assert.ok((Array.isArray(value) && value.length % 2 === 0) || (value && typeof value === "object" && !Array.isArray(value)), "Quota state must be a Redis hash result");
    const entries = Array.isArray(value)
      ? Array.from({ length: value.length / 2 }, (_, index) => [value[index * 2], value[index * 2 + 1]])
      : value && typeof value === "object" ? Object.entries(value) : [];
    const state = Object.fromEntries(entries.map(([field, entry]) => [String(field), String(entry)]).sort(([a], [b]) => a.localeCompare(b)));
    assert.deepEqual(Object.keys(state), ["day", "dayRequests", "dayTokens", "requestAt", "requests", "tokenAt", "tokens"]);
    return state;
  };
  const snapshots = (keys) => Promise.all(keys.slice(0, 3).map(readHash));
  const score = async (key, leaseId) => { assertOwned(key); return send(["ZSCORE", key, leaseId]); };
  const cardinality = async (key) => { assertOwned(key); return Number(await send(["ZCARD", key])); };

  const scenario = (label) => {
    const namespace = `chat-test-${randomUUID().replaceAll("-", "")}-${label}`;
    assert.match(namespace, /^[a-zA-Z0-9][a-zA-Z0-9-]{0,63}$/);
    const scenarioEnv = { ...env, VERCEL_ENV: env.VERCEL_ENV || "development", CHAT_QUOTA_NAMESPACE: namespace };
    const prefix = `${namespace}:{${namespace}-quota}:v1:${scenarioEnv.VERCEL_ENV}:`;
    const keys = new Set();
    ownedByNamespace.set(namespace, keys);
    const reservations = [];
    const fetcher = async (url, options) => {
      assert.equal(url, origin, "Quota storage must use the configured test endpoint");
      const command = JSON.parse(options.body);
      assert.equal(command[0], "EVAL");
      assert.ok(command[2] === 6 || command[2] === 3, "Only quota reservation/release scripts are expected");
      // Reservation declares six exact keys in command.slice(3, 9); release
      // declares only its three owned lease keys, never the UUID argument.
      const captured = command[2] === 6 ? command.slice(3, 9) : command.slice(3, 6);
      for (const key of captured) {
        assert.ok(typeof key === "string" && key.startsWith(prefix), "Quota keys must stay in the random test namespace");
        ownedKeys.add(key);
        keys.add(key);
      }
      if (command[2] === 6) reservations.push({ keys: captured, leaseId: command[9] });
      return actualFetch(url, options);
    };
    return {
      reservations,
      reserve: (who, charge = 1) => reserveChatQuota(who, charge, { env: scenarioEnv, fetcher }),
    };
  };
  const stats = {
    anonymousAdmitted: 0, authenticatedAdmitted: 0, sharedNetworkAdmitted: 0, globalAdmitted: 0,
    tokenSpikeBlocked: false, dailyRequestCapBlocked: false, dailyTokenCapBlocked: false,
    corruptStateFailedClosed: false, expiredLeasePruned: false, ownedReleasePreservedOtherLease: false,
    releaseDidNotRefundBudgets: false, cleanedKeys: 0,
  };

  const race = async (label, identities, expected) => {
    const current = scenario(label);
    const results = await Promise.allSettled(identities.map((who) => current.reserve(who)));
    const leases = results.filter(({ status }) => status === "fulfilled").map(({ value }) => value);
    try {
      assert.equal(leases.length, expected, "Concurrent admission count must match the real Redis concurrency policy");
      for (const result of results) if (result.status === "rejected") assert.ok(denied(429)(result.reason));
    } finally {
      await Promise.all(leases.map((lease) => lease.release()));
    }
    return leases.length;
  };
  const seedSubject = async (key, dailyRequests, dailyTokens) => {
    assertOwned(key);
    const clock = await send(["TIME"]);
    assert.ok(Array.isArray(clock) && clock.length === 2);
    const seconds = Number(clock[0]);
    const now = seconds * 1000 + Math.floor(Number(clock[1]) / 1000);
    assert.ok(Number.isSafeInteger(now) && now > 0);
    await send(["HSET", key,
      "requests", CHAT_QUOTA_POLICY.anonymous.requestsPerMinute, "requestAt", now,
      "tokens", CHAT_QUOTA_POLICY.anonymous.tokensPerMinute, "tokenAt", now,
      "day", Math.floor(seconds / 86400), "dayRequests", dailyRequests, "dayTokens", dailyTokens,
    ]);
  };

  try {
    stats.anonymousAdmitted = await race("anon", Array.from({ length: 8 }, () => identity("anonymous")), 1);
    stats.authenticatedAdmitted = await race("auth", Array.from({ length: 8 }, () => identity("authenticated")), 2);
    stats.sharedNetworkAdmitted = await race("network", Array.from({ length: 8 }, (_, index) => identity("authenticated", `user-${index}`)), 3);
    stats.globalAdmitted = await race("global", Array.from({ length: 12 }, (_, index) => identity("authenticated", `user-${index}`, `network-${index}`)), 8);

    const spike = scenario("spike");
    const first = await spike.reserve(identity("anonymous"), 64000);
    await first.release();
    const spikeKeys = spike.reservations[0].keys;
    const beforeSpike = await snapshots(spikeKeys);
    await assert.rejects(spike.reserve(identity("anonymous"), 64000), denied(429));
    assert.deepEqual(await snapshots(spikeKeys), beforeSpike, "A rejected token spike must not change any quota counters");
    stats.tokenSpikeBlocked = true;

    for (const [label, requests, tokens, stat] of [
      ["day-requests", CHAT_QUOTA_POLICY.anonymous.requestsPerDay, 0, "dailyRequestCapBlocked"],
      ["day-tokens", 0, CHAT_QUOTA_POLICY.anonymous.tokensPerDay, "dailyTokenCapBlocked"],
    ]) {
      const daily = scenario(label);
      const lease = await daily.reserve(identity("anonymous"));
      await lease.release();
      const keys = daily.reservations[0].keys;
      await seedSubject(keys[0], requests, tokens);
      const before = await snapshots(keys);
      await assert.rejects(daily.reserve(identity("anonymous")), denied(429));
      assert.deepEqual(await snapshots(keys), before, "Daily quota denial must leave every scope unchanged");
      stats[stat] = true;
    }

    const corrupt = scenario("corrupt");
    const corruptLease = await corrupt.reserve(identity("anonymous"));
    await corruptLease.release();
    const corruptKeys = corrupt.reservations[0].keys;
    assertOwned(corruptKeys[0]);
    await send(["HSET", corruptKeys[0], "requests", "invalid-state"]);
    const corruptBefore = await snapshots(corruptKeys);
    await assert.rejects(corrupt.reserve(identity("anonymous")), denied(503));
    assert.deepEqual(await snapshots(corruptKeys), corruptBefore, "Corrupt storage must fail closed without changing other scopes");
    stats.corruptStateFailedClosed = true;

    const expired = scenario("expired");
    const oldLease = await expired.reserve(identity("anonymous"));
    const oldReservation = expired.reservations[0];
    for (const key of oldReservation.keys.slice(3)) {
      assertOwned(key);
      await send(["ZADD", key, 0, oldReservation.leaseId]);
    }
    const freshLease = await expired.reserve(identity("anonymous"));
    const freshReservation = expired.reservations[1];
    for (const key of oldReservation.keys.slice(3)) {
      assert.equal(await score(key, oldReservation.leaseId), null, "Expired lease must be pruned on admission");
      assert.notEqual(await score(key, freshReservation.leaseId), null);
      assert.equal(await cardinality(key), 1);
    }
    await oldLease.release();
    for (const key of freshReservation.keys.slice(3)) assert.notEqual(await score(key, freshReservation.leaseId), null);
    await freshLease.release();
    stats.expiredLeasePruned = true;

    const owned = scenario("release");
    const one = await owned.reserve(identity("authenticated"), 100);
    const two = await owned.reserve(identity("authenticated"), 100);
    const ownedKeysForScope = owned.reservations[0].keys;
    const charged = await snapshots(ownedKeysForScope);
    await Promise.all([one.release(), one.release()]);
    assert.deepEqual(await snapshots(ownedKeysForScope), charged, "Releasing a lease must not refund charged request/token budgets");
    for (const key of ownedKeysForScope.slice(3)) {
      assert.equal(await score(key, owned.reservations[0].leaseId), null);
      assert.notEqual(await score(key, owned.reservations[1].leaseId), null);
      assert.equal(await cardinality(key), 1);
    }
    const three = await owned.reserve(identity("authenticated"), 100);
    const chargedAgain = await snapshots(ownedKeysForScope);
    await one.release();
    assert.deepEqual(await snapshots(ownedKeysForScope), chargedAgain);
    for (const key of ownedKeysForScope.slice(3)) {
      assert.notEqual(await score(key, owned.reservations[1].leaseId), null);
      assert.notEqual(await score(key, owned.reservations[2].leaseId), null);
      assert.equal(await cardinality(key), 2, "An older caller cannot release newer owned leases");
    }
    await Promise.all([two.release(), three.release()]);
    for (const key of ownedKeysForScope.slice(3)) assert.equal(await cardinality(key), 0);
    stats.ownedReleasePreservedOtherLease = true;
    stats.releaseDidNotRefundBudgets = true;
  } finally {
    // Each group shares one Redis cluster hash slot. Never SCAN/FLUSH or delete
    // by pattern, and never touch keys that this run did not capture explicitly.
    const cleanups = await Promise.allSettled([...ownedByNamespace.values()].map(async (keys) => {
      if (!keys.size) return;
      for (const key of keys) assertOwned(key);
      await send(["DEL", ...keys]);
    }));
    if (cleanups.some(({ status }) => status === "rejected")) throw new Error("Redis integration cleanup failed");
    stats.cleanedKeys = ownedKeys.size;
  }
  return Object.freeze(stats);
}

if (typeof process !== "undefined" && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(await runRedisQuotaIntegration(process.env)));
  } catch {
    console.error("Redis quota integration failed; confirm dedicated test configuration and inspect the checks without exposing credentials.");
    process.exitCode = 1;
  }
}
