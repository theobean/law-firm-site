import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAT_QUOTA_POLICY, QuotaError, reserveChatQuota } from "../src/lib/chat/quota.mjs";

const databaseUrl = (role = "chat_quota_preview") => `postgresql://${role}:test-only-password@ep-test-123456.us-east-1.aws.neon.tech/chatbot?sslmode=require`;
const env = { CHAT_DATABASE_URL: databaseUrl(), VERCEL_ENV: "preview" };
const anonymous = { tier: "anonymous", subjectKey: "a".repeat(64), networkKey: "b".repeat(64) };
const authenticated = { ...anonymous, tier: "authenticated", subjectKey: "c".repeat(64) };
const allowed = () => [{ allowed: true, retry_after: 0, policy_version: 1 }];
const quotaError = (code, status) => (error) => error instanceof QuotaError && error.code === code && error.status === status;
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const reserveSql = /^SELECT allowed, retry_after, policy_version FROM chat_quota\.reserve\(\$1::text, \$2::text, \$3::text, \$4::text, \$5::bigint, \$6::uuid\)$/;
const releaseSql = /^SELECT chat_quota\.release\(\$1::text, \$2::uuid\) AS released$/;

// Real adapter boundary tests, not a JavaScript copy of SQL admission.
// scripts/test-chat-neon.mjs opts into actual database/concurrency checks.
test("the Neon adapter binds fixed SQL with pseudonyms and a unique lease", async () => {
  const calls = [];
  const lease = await reserveChatQuota({ ...anonymous, ip: "127.0.0.1", tenant: "PRIVATE_TENANT_SENTINEL" }, 25000, {
    env, query: async (sql, params) => { calls.push({ sql, params }); return allowed(); },
  });
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, reserveSql);
  assert.deepEqual(calls[0].params.slice(0, 5), ["preview", "anonymous", anonymous.subjectKey, anonymous.networkKey, 25000]);
  assert.equal(calls[0].params.length, 6);
  assert.match(calls[0].params[5], uuid);
  for (const text of ["127.0.0.1", "PRIVATE_TENANT_SENTINEL", "test-only-password", anonymous.subjectKey, anonymous.networkKey]) {
    assert.ok(!calls[0].sql.includes(text), "data and credentials never enter SQL text");
  }
  assert.ok(!JSON.stringify(calls).includes("PRIVATE_TENANT_SENTINEL"));
  assert.ok(!JSON.stringify(calls).includes("test-only-password"));
  assert.ok(Object.isFrozen(lease));
  assert.deepEqual(Object.keys(lease), ["release"]);
});

test("all anonymous, authenticated, network and global quota policies remain unchanged", async () => {
  assert.deepEqual(CHAT_QUOTA_POLICY, {
    anonymous: { requestsPerMinute: 6, tokensPerMinute: 100000, requestsPerDay: 30, tokensPerDay: 500000, concurrency: 1 },
    authenticated: { requestsPerMinute: 20, tokensPerMinute: 300000, requestsPerDay: 300, tokensPerDay: 5000000, concurrency: 2 },
    network: { requestsPerMinute: 30, tokensPerMinute: 500000, requestsPerDay: 0, tokensPerDay: 5000000, concurrency: 3 },
    global: { requestsPerMinute: 60, tokensPerMinute: 1000000, requestsPerDay: 1000, tokensPerDay: 10000000, concurrency: 8 },
    leaseMilliseconds: 60000, maxReservedTokens: 64000,
  });
  const calls = [];
  const query = async (sql, params) => { calls.push({ sql, params }); return allowed(); };
  await reserveChatQuota(anonymous, 20000, { env, query });
  await reserveChatQuota(authenticated, 20000, { env, query });
  assert.equal(calls[0].sql, calls[1].sql);
  assert.deepEqual(calls[0].params.slice(0, 5), ["preview", "anonymous", anonymous.subjectKey, anonymous.networkKey, 20000]);
  assert.deepEqual(calls[1].params.slice(0, 5), ["preview", "authenticated", authenticated.subjectKey, anonymous.networkKey, 20000]);
});

test("database roles own namespaces and clients cannot replace stable identity keys", async () => {
  const calls = [];
  const query = async (sql, params) => { calls.push({ sql, params }); return allowed(); };
  await reserveChatQuota({ ...anonymous, namespace: "attacker-namespace", environment: "production" }, 1, { env, query });
  await reserveChatQuota(anonymous, 1, { env: { ...env, CHAT_QUOTA_NAMESPACE: "attacker-namespace" }, query });
  await reserveChatQuota(anonymous, 1, { env: { CHAT_DATABASE_URL: databaseUrl("chat_quota_production"), VERCEL_ENV: "production" }, query });
  assert.deepEqual(calls[0].params.slice(0, 5), calls[1].params.slice(0, 5));
  assert.notEqual(calls[0].params[5], calls[1].params[5]);
  assert.equal(calls[2].params[0], "production");
  assert.deepEqual(calls[0].params.slice(1, 5), calls[2].params.slice(1, 5));
  assert.ok(!JSON.stringify(calls).includes("attacker-namespace"));
  await reserveChatQuota(anonymous, 1, { env: { ...env, CHAT_DATABASE_URL: databaseUrl("chat_quota_preview_test0123abcd") }, query });
  assert.equal(calls.at(-1).params[0], "preview");
});

test("release binds only its owned environment and UUID, is idempotent and exposes no refund statement", async () => {
  const calls = [];
  const query = async (sql, params) => { calls.push({ sql, params }); return sql.includes(".reserve(") ? allowed() : [{ released: 1 }]; };
  const one = await reserveChatQuota(anonymous, 32000, { env, query });
  const two = await reserveChatQuota(authenticated, 15000, { env, query });
  await Promise.all([one.release(), one.release()]);
  await one.release();
  assert.equal(calls.length, 3);
  assert.match(calls[2].sql, releaseSql);
  assert.deepEqual(calls[2].params, ["preview", calls[0].params[5]]);
  assert.notEqual(calls[2].params[1], calls[1].params[5]);
  assert.ok(!/UPDATE|INSERT|DELETE|refund/i.test(calls[2].sql));
  await two.release();
  assert.deepEqual(calls.at(-1).params, ["preview", calls[1].params[5]]);
});

test("database denials preserve Retry-After and cannot return a releasable lease", async () => {
  let calls = 0;
  await assert.rejects(reserveChatQuota(anonymous, 32000, {
    env, query: async () => { calls += 1; return [{ allowed: false, retry_after: 7462, policy_version: 1 }]; },
  }), (error) => quotaError("rate_limit", 429)(error) && error.retryAfter === 7462);
  assert.equal(calls, 1);
});

test("missing, owner, mismatched-role and unsafe Neon settings fail before SQL", async () => {
  let calls = 0;
  const query = async () => { calls += 1; return allowed(); };
  const invalid = [
    {}, { ...env, CHAT_DATABASE_URL: "" }, { ...env, CHAT_DATABASE_URL: 42 },
    { ...env, CHAT_DATABASE_URL: databaseUrl("neondb_owner") },
    { ...env, CHAT_DATABASE_URL: databaseUrl("chat_quota_production") },
    { ...env, CHAT_DATABASE_URL: databaseUrl("chat_quota_preview_testshort") },
    { ...env, CHAT_DATABASE_URL: databaseUrl().replace("postgresql:", "https:") },
    { ...env, CHAT_DATABASE_URL: databaseUrl().replace("sslmode=require", "sslmode=disable") },
    { ...env, CHAT_DATABASE_URL: databaseUrl().replace("?sslmode=require", "") },
    { ...env, CHAT_DATABASE_URL: databaseUrl().replace("neon.tech", "neon.tech.attacker.test") },
    { ...env, CHAT_DATABASE_URL: `${databaseUrl()}#credential-fragment` },
    { ...env, CHAT_DATABASE_URL: databaseUrl().replace("test-only-password", "") },
    { ...env, CHAT_DATABASE_URL: `${databaseUrl()}&options=-csearch_path%3Dpublic` },
    { ...env, CHAT_DATABASE_URL: `${databaseUrl()}&sslmode=require` },
    { ...env, VERCEL_ENV: "arbitrary-deployment-id" },
  ];
  for (const invalidEnv of invalid) await assert.rejects(reserveChatQuota(anonymous, 1, { env: invalidEnv, query }), quotaError("unavailable", 503));
  assert.equal(calls, 0);
});

test("invalid costs and forged identities cannot become SQL parameters or bypass limits", async () => {
  let calls = 0;
  const options = { env, query: async () => { calls += 1; return allowed(); } };
  for (const tokens of [0, -1, 64001, NaN, Infinity, 1.5, "100", 1n]) {
    await assert.rejects(reserveChatQuota(anonymous, tokens, options), quotaError("request_too_large", 413));
  }
  for (const forged of [null, {}, { ...anonymous, tier: "admin" }, { ...anonymous, subjectKey: "raw-user-id" },
    { ...anonymous, networkKey: "'); DROP SCHEMA chat_quota; --" }, { ...anonymous, subjectKey: [anonymous.subjectKey] },
    { ...anonymous, subjectKey: "A".repeat(64) }]) {
    await assert.rejects(reserveChatQuota(forged, 1, options), quotaError("unavailable", 503));
  }
  assert.equal(calls, 0);
});

test("SQL failures and malformed or version-mismatched rows fail closed without detail leakage", async () => {
  const invalid = [null, {}, [], [null], [[]], [{}], [...allowed(), ...allowed()],
    [{ allowed: 1, retry_after: 0, policy_version: 1 }], [{ allowed: true, retry_after: "0", policy_version: 1 }],
    [{ allowed: true, retry_after: 1, policy_version: 1 }], [{ allowed: false, retry_after: 0, policy_version: 1 }],
    [{ allowed: false, retry_after: 86401, policy_version: 1 }], [{ allowed: false, retry_after: 1.5, policy_version: 1 }],
    [{ allowed: true, retry_after: 0, policy_version: 2 }], [{ allowed: true, retry_after: 0, policy_version: "1" }],
    [{ allowed: true, retry_after: 0, policy_version: 1, privateDetail: "unexpected" }],
  ];
  for (const rows of invalid) await assert.rejects(reserveChatQuota(anonymous, 1, { env, query: async () => rows }), quotaError("unavailable", 503));
  await assert.rejects(reserveChatQuota(anonymous, 1, { env, query: async () => { throw new Error("PRIVATE_DATABASE_DETAIL_SENTINEL"); } }),
    (error) => quotaError("unavailable", 503)(error) && !JSON.stringify(error).includes("PRIVATE_DATABASE_DETAIL_SENTINEL") && !error.message.includes("PRIVATE_DATABASE_DETAIL_SENTINEL"));
});

test("release accepts gone leases, rejects malformed rows and never retries a failed release", async () => {
  for (const released of [0, 1]) {
    const lease = await reserveChatQuota(anonymous, 1, { env, query: async (sql) => sql.includes(".reserve(") ? allowed() : [{ released }] });
    await lease.release();
  }
  for (const rows of [null, [], [{}], [{ released: 2 }], [{ released: "1" }], [{ released: true }], [{ released: 1, refund: true }], [{ released: 1 }, { released: 1 }]]) {
    let releases = 0;
    const lease = await reserveChatQuota(anonymous, 1, { env, query: async (sql) => {
      if (sql.includes(".reserve(")) return allowed();
      releases += 1;
      return rows;
    } });
    await assert.rejects(lease.release(), quotaError("unavailable", 503));
    await assert.rejects(lease.release(), quotaError("unavailable", 503));
    assert.equal(releases, 1);
  }
});

test("hung SQL operations fail closed within their admission and release deadlines", { timeout: 11000 }, async () => {
  await assert.rejects(reserveChatQuota(anonymous, 1, { env, query: async () => new Promise(() => {}) }), quotaError("unavailable", 503));
  const lease = await reserveChatQuota(anonymous, 1, { env, query: async (sql) => sql.includes(".reserve(") ? allowed() : new Promise(() => {}) });
  await assert.rejects(lease.release(), quotaError("unavailable", 503));
});
