import assert from "node:assert/strict";
import { test } from "node:test";
import { TurnstileError, verifyTurnstileToken } from "../src/lib/chat/turnstile.mjs";

const env = { CHAT_TURNSTILE_SECRET_KEY: "test-only-turnstile-secret", CHAT_TURNSTILE_HOSTNAMES: "site.example,www.site.example" };
const valid = { success: true, hostname: "site.example", action: "lexi_chat", "error-codes": [] };
const unauthorized = (error) => error instanceof TurnstileError && error.code === "unauthorized" && error.status === 401 && error.message === "unauthorized";
const unavailable = (error) => error instanceof TurnstileError && error.code === "unavailable" && error.status === 503 && error.message === "unavailable";
const verify = (result, options = {}) => verifyTurnstileToken("test-token", { env, fetcher: async () => Response.json(result), ...options });

test("Turnstile validates only through fixed POST Siteverify without credentials or redirects", async () => {
  let calls = 0;
  await verifyTurnstileToken("test-token", { env, remoteIp: "192.0.2.1", fetcher: async (url, options) => {
    calls++;
    assert.equal(url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
    assert.equal(options.method, "POST");
    assert.equal(options.credentials, "omit");
    assert.equal(options.redirect, "error");
    assert.equal(options.cache, "no-store");
    assert.equal(options.headers["content-type"], "application/x-www-form-urlencoded");
    assert.ok(options.signal instanceof AbortSignal);
    assert.deepEqual(Object.fromEntries(new URLSearchParams(options.body)), { secret: env.CHAT_TURNSTILE_SECRET_KEY, response: "test-token", remoteip: "192.0.2.1" });
    return Response.json(valid);
  } });
  assert.equal(calls, 1);
  await verifyTurnstileToken("test-token", { env, remoteIp: "spoofed, 192.0.2.1", fetcher: async (_url, options) => {
    assert.equal(new URLSearchParams(options.body).has("remoteip"), false);
    return Response.json({ ...valid, hostname: "www.site.example" });
  } });
});

test("invalid or oversized tokens fail before outbound I/O", async () => {
  for (const token of [undefined, null, {}, 123, "", " token", "token ", "token\nvalue", "a".repeat(2049)]) {
    await assert.rejects(verifyTurnstileToken(token, { env, fetcher: async () => assert.fail("must not fetch") }), unauthorized);
  }
  await verifyTurnstileToken("a".repeat(2048), { env, fetcher: async () => Response.json(valid) });
});

test("missing or unsafe server configuration fails closed before I/O", async () => {
  const configurations = [
    {}, { ...env, CHAT_TURNSTILE_SECRET_KEY: "" }, { ...env, CHAT_TURNSTILE_SECRET_KEY: " secret" },
    { ...env, CHAT_TURNSTILE_HOSTNAMES: "" }, { ...env, CHAT_TURNSTILE_HOSTNAMES: "*.site.example" },
    { ...env, CHAT_TURNSTILE_HOSTNAMES: "https://site.example" }, { ...env, CHAT_TURNSTILE_HOSTNAMES: "site.example:443" },
    { ...env, CHAT_TURNSTILE_HOSTNAMES: "site.example/" }, { ...env, CHAT_TURNSTILE_HOSTNAMES: "site.example," },
    { ...env, CHAT_TURNSTILE_HOSTNAMES: "site.example,site.example" }, { ...env, CHAT_TURNSTILE_HOSTNAMES: "SITE.EXAMPLE" },
  ];
  for (const invalidEnv of configurations) {
    await assert.rejects(verifyTurnstileToken("test-token", { env: invalidEnv, fetcher: async () => assert.fail("must not fetch") }), unavailable);
  }
});

test("boolean success, exact configured hostname and exact chat action are mandatory", async () => {
  for (const result of [
    { ...valid, hostname: "evil.example" }, { ...valid, hostname: "sub.site.example" },
    { ...valid, hostname: "site.example.evil.example" }, { ...valid, hostname: "SITE.EXAMPLE" },
    { ...valid, hostname: undefined }, { ...valid, action: "other_action" },
    { ...valid, action: undefined }, { ...valid, action: ["lexi_chat"] },
    { ...valid, "error-codes": ["timeout-or-duplicate"] }, { ...valid, "error-codes": "invalid" },
  ]) await assert.rejects(verify(result), unauthorized);
  for (const result of [null, [], {}, { ...valid, success: "true" }, { ...valid, success: 1 }]) {
    await assert.rejects(verify(result), unavailable);
  }
});

test("replayed, expired or invalid challenge errors never pass and secret/provider errors are unavailable", async () => {
  for (const code of ["timeout-or-duplicate", "invalid-input-response", "missing-input-response", "bad-request"]) {
    await assert.rejects(verify({ success: false, "error-codes": [code] }), unauthorized);
  }
  for (const code of ["missing-input-secret", "invalid-input-secret", "internal-error"]) {
    await assert.rejects(verify({ success: false, "error-codes": [code] }), unavailable);
  }
  let used = false;
  const fetcher = async () => {
    if (used) return Response.json({ success: false, "error-codes": ["timeout-or-duplicate"] });
    used = true;
    return Response.json(valid);
  };
  await verifyTurnstileToken("single-use-token", { env, fetcher });
  await assert.rejects(verifyTurnstileToken("single-use-token", { env, fetcher }), unauthorized);
});

test("HTTP errors, redirects, broken JSON, invalid UTF-8 and transport errors stay private", async () => {
  const responses = [
    new Response("secret-provider-message", { status: 503 }),
    new Response("", { status: 302, headers: { location: "https://evil.example" } }),
    new Response("not JSON"), new Response(""), new Response(new Uint8Array([0xff])),
    new Response("{}", { headers: { "content-length": "invalid" } }),
  ];
  for (const response of responses) await assert.rejects(verifyTurnstileToken("test-token", { env, fetcher: async () => response }), unavailable);
  await assert.rejects(verifyTurnstileToken("test-token", { env, fetcher: async () => { throw new Error("secret-provider-message"); } }), unavailable);
  await assert.rejects(verifyTurnstileToken("test-token", { env, fetcher: async () => ({ ok: true, redirected: true }) }), unavailable);
});

test("response body is limited to 32 KiB even without a content-length header", async () => {
  const oversizedJson = JSON.stringify({ ...valid, padding: "a".repeat(32768) });
  for (const headers of [{ "content-type": "application/json" }, { "content-type": "application/json", "content-length": String(Buffer.byteLength(oversizedJson)) }]) {
    await assert.rejects(verifyTurnstileToken("test-token", { env, fetcher: async () => new Response(oversizedJson, { headers }) }), unavailable);
  }
  const boundary = JSON.stringify({ ...valid, padding: "" });
  const permittedJson = JSON.stringify({ ...valid, padding: "a".repeat(32768 - Buffer.byteLength(boundary)) });
  assert.equal(Buffer.byteLength(permittedJson), 32768);
  await verifyTurnstileToken("test-token", { env, fetcher: async () => new Response(permittedJson, { headers: { "content-type": "application/json" } }) });
});

test("five-second deadline aborts provider I/O even when an adapter ignores abort", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let signal;
  const promise = verifyTurnstileToken("test-token", { env, fetcher: async (_url, options) => {
    signal = options.signal;
    return new Promise(() => {});
  } });
  const rejection = assert.rejects(promise, unavailable);
  t.mock.timers.tick(4999);
  assert.equal(signal.aborted, false);
  t.mock.timers.tick(1);
  await rejection;
  assert.equal(signal.aborted, true);
});
