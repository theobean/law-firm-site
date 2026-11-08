import assert from "node:assert/strict";
import { test } from "node:test";
import { generateKeyPair, jwtVerify, SignJWT } from "jose";
import { QuotaIdentityError, resolveQuotaIdentity } from "../src/lib/chat/identity.mjs";

const env = { VERCEL: "1", CHAT_RATE_LIMIT_SECRET: "test-only-shared-hmac-secret-at-least-32-characters" };
const authenticatedEnv = { ...env, CHAT_AUTH_ISSUER: "https://issuer.example/", CHAT_AUTH_AUDIENCE: "law-firm-chat", CHAT_AUTH_JWKS_URL: "https://issuer.example/.well-known/jwks.json" };
const request = (headers = {}) => new Request("https://site.example/api/chat", { headers: { "x-vercel-forwarded-for": "192.0.2.1", ...headers } });
const rsa = await generateKeyPair("RS256");
const wrongRsa = await generateKeyPair("RS256");
const ec = await generateKeyPair("ES256");
const token = async (options = {}) => {
  const { alg = "RS256", key = rsa.privateKey, issuer = authenticatedEnv.CHAT_AUTH_ISSUER,
    audience = authenticatedEnv.CHAT_AUTH_AUDIENCE, subject = "verified-user", expiration = "10m", extra = {} } = options;
  return new SignJWT(extra).setProtectedHeader({ alg, kid: "test-key" }).setIssuer(issuer)
    .setAudience(audience).setSubject(subject).setIssuedAt().setExpirationTime(expiration).sign(key);
};
const verifyWith = (key) => (jwt, policy) => jwtVerify(jwt, key, policy);
const unauthorized = (error) => error instanceof QuotaIdentityError && error.code === "unauthorized" && error.status === 401;
const unavailable = (error) => error instanceof QuotaIdentityError && error.code === "unavailable" && error.status === 503;

test("anonymous identities are stable shared-secret pseudonyms and cannot be selected by client role headers", async () => {
  const first = await resolveQuotaIdentity(request(), { env });
  const second = await resolveQuotaIdentity(request({ "x-user-id": "admin", "x-user-role": "admin", "x-forwarded-for": "198.51.100.2" }), { env: { ...env } });
  assert.deepEqual(first, second);
  assert.equal(first.tier, "anonymous");
  assert.match(first.subjectKey, /^[0-9a-f]{64}$/);
  assert.match(first.networkKey, /^[0-9a-f]{64}$/);
  assert.notEqual(first.subjectKey, first.networkKey, "network and subject HMAC domains must differ");
  assert.ok(!JSON.stringify(first).includes("192.0.2.1"));
  assert.ok(Object.isFrozen(first));
  const other = await resolveQuotaIdentity(request({ "x-vercel-forwarded-for": "198.51.100.2" }), { env });
  assert.notEqual(first.subjectKey, other.subjectKey);
});

test("IP grouping normalizes IPv4-mapped IPv6 and coarsens native IPv6 to /64", async () => {
  const identity = (ip) => resolveQuotaIdentity(request({ "x-vercel-forwarded-for": ip }), { env });
  assert.deepEqual(await identity("192.0.2.1"), await identity("::ffff:192.0.2.1"));
  assert.deepEqual(await identity("192.0.2.1"), await identity("::ffff:c000:201"));
  assert.deepEqual(await identity("2001:db8:abcd:1234::1"), await identity("2001:0DB8:abcd:1234:ffff:0:1:2"));
  assert.notDeepEqual(await identity("2001:db8:abcd:1234::1"), await identity("2001:db8:abcd:1235::1"));
  assert.deepEqual(await identity("bad-address"), await identity(""));
});

test("forwarding headers cannot split anonymous quotas outside the trusted Vercel adapter", async () => {
  const localEnv = { ...env, VERCEL: undefined };
  const first = await resolveQuotaIdentity(request({ "x-vercel-forwarded-for": "192.0.2.1" }), { env: localEnv });
  const second = await resolveQuotaIdentity(request({ "x-vercel-forwarded-for": "198.51.100.2", "x-forwarded-for": "203.0.113.3" }), { env: localEnv });
  assert.deepEqual(first, second);
});

test("only a locally signed and fully verified JWT receives the authenticated quota tier", async () => {
  const jwt = await token({ extra: { role: "admin", permissions: ["cases:read"] } });
  const identity = await resolveQuotaIdentity(request({ authorization: `Bearer ${jwt}` }), { env: authenticatedEnv, verifyToken: verifyWith(rsa.publicKey) });
  const anonymous = await resolveQuotaIdentity(request(), { env: authenticatedEnv });
  assert.equal(identity.tier, "authenticated");
  assert.equal(identity.networkKey, anonymous.networkKey, "authenticated traffic must still share the network quota");
  assert.notEqual(identity.subjectKey, anonymous.subjectKey);
  assert.ok(!JSON.stringify(identity).includes("verified-user"));
  assert.equal(identity.role, undefined, "quota authentication must not grant a context role");
  assert.equal(identity.permissions, undefined);
  const nextJwt = await token({ extra: { role: "visitor" } });
  const next = await resolveQuotaIdentity(request({ authorization: `Bearer ${nextJwt}` }), { env: authenticatedEnv, verifyToken: verifyWith(rsa.publicKey) });
  assert.equal(next.subjectKey, identity.subjectKey, "new tokens for the same issuer/subject do not reset quota");
});

test("ES256 verification is supported and verified subjects have independent keys", async () => {
  const first = await token({ alg: "ES256", key: ec.privateKey, subject: "subject-a" });
  const second = await token({ alg: "ES256", key: ec.privateKey, subject: "subject-b" });
  const identity = async (jwt) => resolveQuotaIdentity(request({ authorization: `Bearer ${jwt}` }), { env: authenticatedEnv, verifyToken: verifyWith(ec.publicKey) });
  assert.notEqual((await identity(first)).subjectKey, (await identity(second)).subjectKey);
});

test("forged signatures, issuer/audience mismatches, expired and invalid subjects are rejected", async () => {
  const invalidTokens = [
    await token({ key: wrongRsa.privateKey }), await token({ issuer: "https://other.example/" }),
    await token({ audience: "different-application" }), await token({ expiration: "-30s" }),
    await token({ subject: " " }), await token({ subject: "x".repeat(201) }), await token({ subject: "bad\u0000subject" }),
  ];
  for (const jwt of invalidTokens) {
    await assert.rejects(resolveQuotaIdentity(request({ authorization: `Bearer ${jwt}` }), { env: authenticatedEnv, verifyToken: verifyWith(rsa.publicKey) }), unauthorized);
  }
  const noExpiry = await new SignJWT({ sub: "user" }).setProtectedHeader({ alg: "RS256" })
    .setIssuer(authenticatedEnv.CHAT_AUTH_ISSUER).setAudience(authenticatedEnv.CHAT_AUTH_AUDIENCE).sign(rsa.privateKey);
  await assert.rejects(resolveQuotaIdentity(request({ authorization: `Bearer ${noExpiry}` }), { env: authenticatedEnv, verifyToken: verifyWith(rsa.publicKey) }), unauthorized);
  const unsigned = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url") + "." + Buffer.from(JSON.stringify({ sub: "admin" })).toString("base64url") + ".";
  await assert.rejects(resolveQuotaIdentity(request({ authorization: `Bearer ${unsigned}` }), { env: authenticatedEnv }), unauthorized);
});

test("bad bearer syntax or missing auth configuration never falls back to anonymous or authenticated", async () => {
  for (const authorization of ["", "Basic credential", "Bearer not-a-jwt", "Bearer a.b.c extra", `Bearer ${"a".repeat(8193)}`]) {
    await assert.rejects(resolveQuotaIdentity(request({ authorization }), { env: authenticatedEnv }), unauthorized);
  }
  await assert.rejects(resolveQuotaIdentity(request({ authorization: `Bearer ${await token()}` }), { env }), unauthorized);
});

test("missing shared secret and partial or unsafe authentication configuration fail closed", async () => {
  for (const configuredEnv of [
    {}, { ...env, CHAT_RATE_LIMIT_SECRET: "short" }, { ...env, CHAT_RATE_LIMIT_SECRET: " " + env.CHAT_RATE_LIMIT_SECRET },
    { ...env, CHAT_AUTH_ISSUER: "https://issuer.example/" },
    { ...authenticatedEnv, CHAT_AUTH_JWKS_URL: "http://issuer.example/keys" },
    { ...authenticatedEnv, CHAT_AUTH_JWKS_URL: "https://user:pass@issuer.example/keys" },
    { ...authenticatedEnv, CHAT_AUTH_ISSUER: "https://issuer.example/#fragment" },
  ]) {
    await assert.rejects(resolveQuotaIdentity(request(), { env: configuredEnv }), unavailable);
  }
});

test("JWKS/provider outages fail closed and even trusted adapters must return complete verified claims", async () => {
  const jwt = await token();
  await assert.rejects(resolveQuotaIdentity(request({ authorization: `Bearer ${jwt}` }), {
    env: authenticatedEnv, verifyToken: async () => { throw new Error("Provider unavailable"); },
  }), unavailable);
  await assert.rejects(resolveQuotaIdentity(request({ authorization: `Bearer ${jwt}` }), {
    env: authenticatedEnv, verifyToken: async () => ({ payload: { sub: "admin" }, protectedHeader: { alg: "RS256" } }),
  }), unauthorized);
});
