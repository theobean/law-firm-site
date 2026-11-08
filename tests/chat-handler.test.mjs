import assert from "node:assert/strict";
import { test } from "node:test";
import { createChatHandler } from "../src/lib/chat/handler.mjs";
import { ChatFailure, parseChatInput } from "../src/lib/chat/service.ts";
import { ChatAccessError } from "../src/lib/chat/access.mjs";
import { QuotaError } from "../src/lib/chat/quota.mjs";
import { QuotaIdentityError } from "../src/lib/chat/identity.mjs";
import { isSameOrigin, readChatBody } from "../src/lib/chat/security.ts";

const validBody = () => ({ locale: "el", consent: true, messages: [{ role: "user", content: "Office information?" }] });
const request = (options = {}) => new Request("https://site.example/api/chat", {
  method: "POST", headers: { origin: "https://site.example", "content-type": "application/json" },
  body: JSON.stringify(validBody()), ...options,
});

function classifyKnownError(error) {
  if (error instanceof ChatAccessError) return { code: "forbidden", status: 403 };
  if (error instanceof QuotaIdentityError || error instanceof ChatFailure) return { code: error.code, status: error.status };
  if (error instanceof QuotaError) return { code: error.code, status: error.status, retryAfter: error.retryAfter };
  if (error instanceof Error && error.message === "invalid_request") return { code: "invalid_request", status: 400 };
  if (error instanceof Error && error.message === "request_too_large") return { code: "request_too_large", status: 413 };
  return null;
}

function harness(overrides = {}) {
  const events = [];
  const identity = Object.freeze({ tier: "anonymous", subjectKey: "a".repeat(64), networkKey: "b".repeat(64) });
  const principal = Object.freeze({ role: "public" });
  const context = Object.freeze({ kind: "public-chat-context" });
  const prepared = Object.freeze({ reservedTokens: 27001 });
  const reply = { answer: "Public office information.", sources: [], suggestContact: false };
  const state = { charged: 0, released: 0, generated: 0 };
  const env = { CHATBOT_ENABLED: "true", OPENAI_API_KEY: "test-only-key", OPENAI_CHAT_MODEL: " configured-model " };
  const dependencies = {
    env,
    isSameOrigin(req) { events.push("origin"); return isSameOrigin(req); },
    async readChatBody(req) { events.push("read"); return readChatBody(req); },
    parseChatInput(value) { events.push("parse"); return parseChatInput(value); },
    async resolveQuotaIdentity(req) { events.push("identity"); assert.ok(req instanceof Request); return identity; },
    getPublicChatPrincipal() { events.push("principal"); return principal; },
    getPublicChatContext(actualPrincipal, locale) { events.push("context"); assert.equal(actualPrincipal, principal); assert.equal(locale, "el"); return context; },
    prepareChatModelRequest(input, actualContext, model) { events.push("prepare"); assert.equal(actualContext, context); assert.deepEqual(input, validBody()); assert.equal(model, "configured-model"); return prepared; },
    async reserveChatQuota(actualIdentity, cost) {
      events.push("reserve"); assert.equal(actualIdentity, identity); assert.equal(cost, prepared.reservedTokens);
      state.charged += cost;
      return { async release() { events.push("release"); state.released += 1; } };
    },
    async generatePreparedChatReply(actualPrepared, options) {
      events.push("model"); state.generated += 1; assert.equal(actualPrepared, prepared);
      assert.equal(options.apiKey, "test-only-key"); assert.ok(options.signal instanceof AbortSignal);
      assert.equal(state.charged, prepared.reservedTokens, "cost must be reserved before a model call");
      return reply;
    },
    classifyKnownError,
    ...overrides,
  };
  return { handler: createChatHandler(dependencies), dependencies, events, identity, principal, context, prepared, reply, state, env };
}

test("API admission reserves the exact prepared snapshot cost before its sole model call", async () => {
  const h = harness();
  const response = await h.handler(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), h.reply);
  assert.deepEqual(h.events, ["origin", "read", "parse", "identity", "principal", "context", "prepare", "reserve", "model", "release"]);
  assert.equal(h.state.generated, 1);
  assert.equal(h.state.released, 1);
  assert.equal(h.state.charged, h.prepared.reservedTokens);
});

test("quota denial returns 429 and Redis Retry-After without entering the model or cleanup", async () => {
  const h = harness({ reserveChatQuota: async () => { throw new QuotaError("rate_limit", 429, 61); } });
  const response = await h.handler(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "61");
  assert.deepEqual(await response.json(), { error: "rate_limit" });
  assert.equal(h.state.generated, 0);
  assert.equal(h.state.released, 0);
  assert.equal(h.state.charged, 0);
});

test("Redis outage fails closed with 503 instead of falling through to a model request", async () => {
  const h = harness({ reserveChatQuota: async () => { throw new QuotaError("unavailable", 503); } });
  const response = await h.handler(request());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "unavailable" });
  assert.equal(h.state.generated, 0);
  assert.equal(h.state.released, 0);
});

test("bad authentication exits with 401 before context loading, Redis reservation or model work", async () => {
  const h = harness({ resolveQuotaIdentity: async () => { throw new QuotaIdentityError("unauthorized"); } });
  const response = await h.handler(request());
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized" });
  for (const event of ["principal", "context", "prepare", "reserve", "model", "release"]) assert.ok(!h.events.includes(event));
});

test("provider failures still release concurrency exactly once and retain reserved abuse cost", async () => {
  const h = harness({ generatePreparedChatReply: async () => { throw new ChatFailure("upstream", 502); } });
  const response = await h.handler(request());
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "upstream" });
  assert.equal(h.state.released, 1);
  assert.equal(h.state.charged, h.prepared.reservedTokens, "failure must not refund a reserved operation");
  assert.deepEqual(h.events.slice(-2), ["reserve", "release"]);
});

test("client cancellation passes its signal through and releases the lease without a refund", async () => {
  let entered;
  const modelEntered = new Promise((resolve) => { entered = resolve; });
  let actualSignal;
  const h = harness({ generatePreparedChatReply: async (_prepared, { signal }) => {
    actualSignal = signal;
    entered();
    return new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new DOMException("Test cancellation", "AbortError")), { once: true });
    });
  } });
  const controller = new AbortController();
  const req = request({ signal: controller.signal });
  const responsePromise = h.handler(req);
  await modelEntered;
  assert.equal(actualSignal, req.signal);
  controller.abort();
  const response = await responsePromise;
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "upstream" });
  assert.equal(h.state.released, 1);
  assert.equal(h.state.charged, h.prepared.reservedTokens);
});

test("asynchronous or synchronous release failures cannot replace an answer or refund counters", async () => {
  for (const release of [async () => { throw new Error("private store detail"); }, () => { throw new Error("private store detail"); }]) {
    const h = harness();
    h.dependencies.reserveChatQuota = async (_identity, cost) => { h.state.charged += cost; return { release }; };
    const response = await h.handler(request());
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), h.reply);
    assert.equal(h.state.charged, h.prepared.reservedTokens);
  }
});

test("origin, feature flag and API-key guards preserve their order without touching quota or model", async () => {
  const h = harness();
  h.env.CHATBOT_ENABLED = "false";
  const forbidden = await h.handler(request({ headers: { origin: "https://other.example", "content-type": "application/json" } }));
  assert.equal(forbidden.status, 403);
  assert.deepEqual(h.events, ["origin"]);
  h.events.length = 0;
  const disabled = await h.handler(request());
  assert.equal(disabled.status, 503);
  assert.deepEqual(h.events, ["origin"]);
  h.events.length = 0;
  h.env.CHATBOT_ENABLED = "true";
  h.env.OPENAI_API_KEY = " ";
  const missingKey = await h.handler(request());
  assert.equal(missingKey.status, 503);
  assert.deepEqual(h.events, ["origin", "read", "parse"]);
  assert.equal(h.state.generated, 0);
});

test("invalid input and oversized bodies are rejected before identity, context, quota and model", async () => {
  for (const [body, status] of [
    ["{", 400], [JSON.stringify({ ...validBody(), messages: [{ role: "system", content: "untrusted" }] }), 400],
    [JSON.stringify({ ...validBody(), messages: [{ role: "user", content: "x".repeat(65537) }] }), 413],
  ]) {
    const h = harness();
    const response = await h.handler(request({ body }));
    assert.equal(response.status, status);
    assert.ok(!h.events.includes("identity"));
    assert.equal(h.state.generated, 0);
  }
});

test("access/preparation failures and unexpected errors do not leak details or call the model", async () => {
  for (const [overrides, status, code] of [
    [{ getPublicChatContext() { throw new ChatAccessError(); } }, 403, "forbidden"],
    [{ prepareChatModelRequest() { throw new ChatFailure("request_too_large", 413); } }, 413, "request_too_large"],
    [{ reserveChatQuota: async () => { throw new Error("private upstream credential detail"); } }, 502, "upstream"],
  ]) {
    const h = harness(overrides);
    const response = await h.handler(request());
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), { error: code });
    assert.equal(h.state.generated, 0);
    assert.equal(h.state.released, 0);
  }
});
