import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAT_QUOTA_POLICY, QuotaError, RELEASE_CHAT_QUOTA_LUA, RESERVE_CHAT_QUOTA_LUA, reserveChatQuota } from "../src/lib/chat/quota.mjs";

const env = { UPSTASH_REDIS_REST_URL: "https://redis.example.test", UPSTASH_REDIS_REST_TOKEN: "test-only-redis-token", VERCEL_ENV: "preview" };
const anonymous = { tier: "anonymous", subjectKey: "a".repeat(64), networkKey: "b".repeat(64) };
const authenticated = { ...anonymous, tier: "authenticated", subjectKey: "c".repeat(64) };
const quotaError = (code, status) => (error) => error instanceof QuotaError && error.code === code && error.status === status;

// These are HTTP contract/failure tests. They do not emulate Lua or assert its
// atomicity; run the exported scripts against real Redis for concurrency checks.
test("shared Redis request declares all scoped keys in one cluster slot and sends one EVAL reservation", async () => {
  let command;
  const lease = await reserveChatQuota(anonymous, 25000, { env, fetcher: async (url, options) => {
    assert.equal(url, "https://redis.example.test");
    assert.equal(options.headers.Authorization, "Bearer test-only-redis-token");
    assert.equal(options.cache, "no-store");
    assert.equal(options.redirect, "error");
    command = JSON.parse(options.body);
    return Response.json({ result: [1, 0] });
  } });
  assert.equal(command[0], "EVAL");
  assert.equal(command[1], RESERVE_CHAT_QUOTA_LUA);
  assert.equal(command[2], 6);
  const keys = command.slice(3, 9);
  assert.equal(new Set(keys.map((key) => key.match(/\{([^}]+)\}/)[1])).size, 1);
  assert.ok(keys.every((key) => key.includes(":preview:")));
  assert.ok(!JSON.stringify(command).includes("127.0.0.1"));
  assert.equal(command[10], 25000);
  assert.deepEqual(JSON.parse(command[11]), [CHAT_QUOTA_POLICY.anonymous, CHAT_QUOTA_POLICY.network, CHAT_QUOTA_POLICY.global]);
  assert.equal(command[12], 60000);
  assert.ok(Object.isFrozen(lease));
});

test("authenticated and anonymous subjects get distinct policies but share network and global guards", async () => {
  const commands = [];
  const fetcher = async (_url, options) => { commands.push(JSON.parse(options.body)); return Response.json({ result: [1, 0] }); };
  await reserveChatQuota(anonymous, 20000, { env, fetcher });
  await reserveChatQuota(authenticated, 20000, { env, fetcher });
  assert.notEqual(commands[0][3], commands[1][3]);
  assert.equal(commands[0][4], commands[1][4]);
  assert.equal(commands[0][5], commands[1][5]);
  assert.deepEqual(JSON.parse(commands[1][11])[0], CHAT_QUOTA_POLICY.authenticated);
  assert.ok(CHAT_QUOTA_POLICY.authenticated.requestsPerMinute > CHAT_QUOTA_POLICY.anonymous.requestsPerMinute);
});

test("keys stay stable across reservations while lease IDs are unique", async () => {
  const commands = [];
  const fetcher = async (_url, options) => { commands.push(JSON.parse(options.body)); return Response.json({ result: [1, 0] }); };
  await reserveChatQuota(anonymous, 1, { env, fetcher });
  await reserveChatQuota(anonymous, 1, { env, fetcher });
  assert.deepEqual(commands[0].slice(3, 9), commands[1].slice(3, 9));
  assert.notEqual(commands[0][9], commands[1][9]);
});

test("trusted stable namespaces and environments isolate deployments without accepting key-slot injection", async () => {
  const commands = [];
  const fetcher = async (_url, options) => { commands.push(JSON.parse(options.body)); return Response.json({ result: [1, 0] }); };
  await reserveChatQuota(anonymous, 1, { env: { ...env, CHAT_QUOTA_NAMESPACE: "isolated-test-one" }, fetcher });
  await reserveChatQuota(anonymous, 1, { env: { ...env, CHAT_QUOTA_NAMESPACE: "isolated-test-two" }, fetcher });
  await reserveChatQuota(anonymous, 1, { env: { ...env, CHAT_QUOTA_NAMESPACE: "isolated-test-one", VERCEL_ENV: "production" }, fetcher });
  assert.notEqual(commands[0][3], commands[1][3]);
  assert.notEqual(commands[0][3], commands[2][3]);
  assert.ok(commands[0].slice(3, 9).every((key) => key.includes("{isolated-test-one-quota}")));
  await assert.rejects(reserveChatQuota(anonymous, 1, { env: { ...env, CHAT_QUOTA_NAMESPACE: "{different-slot}:x" }, fetcher }), quotaError("unavailable", 503));
});

test("lease release is idempotent and removes only its owned UUID without refunding token counters", async () => {
  const commands = [];
  const fetcher = async (_url, options) => {
    const command = JSON.parse(options.body); commands.push(command);
    return Response.json({ result: command[1] === RESERVE_CHAT_QUOTA_LUA ? [1, 0] : 1 });
  };
  const lease = await reserveChatQuota(anonymous, 32000, { env, fetcher });
  await Promise.all([lease.release(), lease.release()]);
  assert.equal(commands.length, 2);
  assert.deepEqual(commands[1], ["EVAL", RELEASE_CHAT_QUOTA_LUA, 3, ...commands[0].slice(6, 9), commands[0][9]]);
});

test("denials preserve actual Redis Retry-After and do not return a releasable lease", async () => {
  await assert.rejects(reserveChatQuota(anonymous, 32000, { env, fetcher: async () => Response.json({ result: [0, 7462] }) }),
    (error) => quotaError("rate_limit", 429)(error) && error.retryAfter === 7462);
});

test("missing or unsafe Redis configuration fails closed without a network call", async () => {
  let calls = 0;
  const fetcher = async () => { calls += 1; return Response.json({ result: [1, 0] }); };
  for (const override of [{}, { ...env, UPSTASH_REDIS_REST_TOKEN: "" }, { ...env, UPSTASH_REDIS_REST_URL: "http://redis.example.test" },
    { ...env, UPSTASH_REDIS_REST_URL: "https://user:pass@redis.example.test" }, { ...env, UPSTASH_REDIS_REST_URL: "https://redis.example.test/path?token=x" },
    { ...env, VERCEL_ENV: "arbitrary-deployment-id" }, { ...env, UPSTASH_REDIS_REST_URL: 42 }, { ...env, CHAT_QUOTA_NAMESPACE: [] }]) {
    await assert.rejects(reserveChatQuota(anonymous, 1, { env: override, fetcher }), quotaError("unavailable", 503));
  }
  assert.equal(calls, 0);
});

test("invalid identities or reservation costs cannot bypass limits or create arbitrary Redis keys", async () => {
  let calls = 0;
  const options = { env, fetcher: async () => { calls += 1; return Response.json({ result: [1, 0] }); } };
  for (const tokens of [0, -1, 64001, NaN, Infinity, 1.5]) {
    await assert.rejects(reserveChatQuota(anonymous, tokens, options), quotaError("request_too_large", 413));
  }
  for (const identity of [null, {}, { ...anonymous, tier: "admin" }, { ...anonymous, subjectKey: "raw-user-id" }, { ...anonymous, networkKey: "{other-slot}:attacker" }, { ...anonymous, subjectKey: [anonymous.subjectKey] }]) {
    await assert.rejects(reserveChatQuota(identity, 1, options), quotaError("unavailable", 503));
  }
  assert.equal(calls, 0);
});

test("Redis HTTP errors, malformed results and transport failures fail closed without upstream detail leakage", async () => {
  const payloads = [{ error: "SECRET_STORE_DETAIL" }, {}, { result: null }, { result: [1] }, { result: [2, 0] }, { result: [1, 2] }, { result: [0, 0] }, { result: [0, 86401] }];
  for (const payload of payloads) {
    await assert.rejects(reserveChatQuota(anonymous, 1, { env, fetcher: async () => Response.json(payload) }), quotaError("unavailable", 503));
  }
  for (const fetcher of [async () => Response.json({ error: "SECRET_STORE_DETAIL" }, { status: 401 }), async () => { throw new Error("SECRET_STORE_DETAIL"); },
    async () => new Response("x".repeat(65537), { headers: { "content-type": "application/json" } })]) {
    await assert.rejects(reserveChatQuota(anonymous, 1, { env, fetcher }), (error) => quotaError("unavailable", 503)(error) && !error.message.includes("SECRET_STORE_DETAIL"));
  }
});
