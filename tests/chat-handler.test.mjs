import assert from "node:assert/strict";
import { test } from "node:test";
import { createChatHandler } from "../src/lib/chat/handler.mjs";
import { ChatFailure, parseChatInput } from "../src/lib/chat/service.ts";
import { ChatAccessError } from "../src/lib/chat/access.mjs";
import { QuotaError } from "../src/lib/chat/quota.mjs";
import { QuotaIdentityError } from "../src/lib/chat/identity.mjs";
import { TurnstileError } from "../src/lib/chat/turnstile.mjs";
import { isSameOrigin, readChatBody } from "../src/lib/chat/security.ts";

const validBody = () => ({ locale: "el", consent: true, messages: [{ role: "user", content: "Office information?" }] });
const request = (options = {}) => new Request("https://site.example/api/chat", {
  method: "POST", headers: { origin: "https://site.example", "content-type": "application/json" },
  body: JSON.stringify(validBody()), ...options,
});

function classifyKnownError(error) {
  if (error instanceof ChatAccessError) return { code: "forbidden", status: 403 };
  if (error instanceof QuotaIdentityError || error instanceof ChatFailure || error instanceof TurnstileError) return { code: error.code, status: error.status };
  if (error instanceof QuotaError) return { code: error.code, status: error.status, retryAfter: error.retryAfter };
  if (error instanceof Error && error.message === "invalid_request") return { code: "invalid_request", status: 400 };
  if (error instanceof Error && error.message === "request_too_large") return { code: "request_too_large", status: 413 };
  return null;
}

function harness(overrides = {}) {
  const events = [];
  const identity = Object.freeze({ tier: "anonymous", subjectKey: "a".repeat(64), networkKey: "b".repeat(64) });
  const visitor = Object.freeze({ proof: "server-owned-test-visitor" });
  const principal = Object.freeze({ role: "public" });
  const context = Object.freeze({ kind: "public-chat-context" });
  const prepared = Object.freeze({ reservedTokens: 27001 });
  const reservationTokens = prepared.reservedTokens + 12000;
  const reservationCostEurMicros = 187500;
  const reply = { answer: "Public office information.", sources: [], suggestContact: false };
  const state = { charged: 0, released: 0, generated: 0 };
  const env = { CHATBOT_ENABLED: "true", OPENAI_API_KEY: "test-only-key", OPENAI_CHAT_MODEL: " configured-model " };
  const dependencies = {
    env,
    isSameOrigin(req) { events.push("origin"); return isSameOrigin(req); },
    async readChatBody(req) { events.push("read"); return readChatBody(req); },
    parseChatInput(value) { events.push("parse"); return parseChatInput(value); },
    async getChatVisitor(req, rawBody) { events.push("visitor"); assert.ok(req instanceof Request); assert.ok(rawBody && typeof rawBody === "object"); return { visitor }; },
    async resolveQuotaIdentity(req, actualVisitor) { events.push("identity"); assert.ok(req instanceof Request); assert.equal(actualVisitor, visitor); return identity; },
    getPublicChatPrincipal() { events.push("principal"); return principal; },
    getChatQuotaReservation(input, actualPrincipal, model) {
      events.push("bound"); assert.equal(actualPrincipal, principal); assert.equal(input.consent, true); assert.equal(model, "configured-model");
      return reservationTokens;
    },
    async getChatBudgetReservation(tokens, model) {
      events.push("budget"); assert.equal(tokens, reservationTokens); assert.equal(model, "configured-model");
      return reservationCostEurMicros;
    },
    getPublicChatContext(actualPrincipal, locale) { events.push("context"); assert.equal(actualPrincipal, principal); assert.equal(locale, "el"); return context; },
    prepareChatModelRequest(input, actualContext, model) { events.push("prepare"); assert.equal(actualContext, context); assert.deepEqual(input, validBody()); assert.equal(model, "configured-model"); return prepared; },
    async reserveChatQuota(actualIdentity, cost, actualCostEurMicros) {
      events.push("reserve"); assert.equal(actualIdentity, identity); assert.equal(cost, reservationTokens); assert.equal(actualCostEurMicros, reservationCostEurMicros);
      state.charged += cost;
      return { async release() { events.push("release"); state.released += 1; } };
    },
    async generatePreparedChatReply(actualPrepared, options) {
      events.push("model"); state.generated += 1; assert.equal(actualPrepared, prepared);
      assert.equal(options.apiKey, "test-only-key"); assert.ok(options.signal instanceof AbortSignal);
      assert.equal(state.charged, reservationTokens, "bounded cost must be reserved before a model call");
      return reply;
    },
    classifyKnownError,
    ...overrides,
  };
  return { handler: createChatHandler(dependencies), dependencies, events, visitor, identity, principal, context, prepared, reservationTokens, reservationCostEurMicros, reply, state, env };
}

test("API admission reserves one bounded cost before context retrieval and its sole model call", async () => {
  const h = harness();
  const response = await h.handler(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), h.reply);
  assert.deepEqual(h.events, ["origin", "read", "parse", "visitor", "identity", "principal", "bound", "budget", "reserve", "context", "prepare", "model", "release"]);
  assert.equal(h.state.generated, 1);
  assert.equal(h.state.released, 1);
  assert.equal(h.state.charged, h.reservationTokens);
});

test("quota precedes asynchronous context loading, which receives the final question and locale before preparation", async () => {
  const h = harness();
  const input = {
    locale: "en", consent: true,
    messages: [
      { role: "user", content: "What services do you offer?" },
      { role: "assistant", content: "We can explain the office's services." },
      { role: "user", content: "How can I arrange an appointment?" },
    ],
  };
  let resolveContext;
  const contextReady = new Promise((resolve) => { resolveContext = resolve; });
  let enteredContext;
  const contextEntered = new Promise((resolve) => { enteredContext = resolve; });
  let contextArguments;
  h.dependencies.getChatQuotaReservation = (actualInput, actualPrincipal, model) => {
    h.events.push("bound");
    assert.deepEqual(actualInput, input);
    assert.equal(actualPrincipal, h.principal);
    assert.equal(model, "configured-model");
    return h.reservationTokens;
  };
  h.dependencies.getPublicChatContext = async (...args) => {
    h.events.push("context");
    contextArguments = args;
    enteredContext();
    const context = await contextReady;
    h.events.push("context-ready");
    return context;
  };
  h.dependencies.prepareChatModelRequest = (actualInput, actualContext, model) => {
    h.events.push("prepare");
    assert.deepEqual(actualInput, input);
    assert.equal(actualContext, h.context);
    assert.equal(model, "configured-model");
    return h.prepared;
  };

  const responsePromise = h.handler(request({ body: JSON.stringify(input) }));
  try {
    await contextEntered;
    assert.equal(contextArguments[0], h.principal);
    assert.deepEqual(contextArguments.slice(1), ["en", input.messages.at(-1).content]);
    assert.deepEqual(h.events, ["origin", "read", "parse", "visitor", "identity", "principal", "bound", "budget", "reserve", "context"]);
    assert.deepEqual(h.state, { charged: h.reservationTokens, released: 0, generated: 0 });
  } finally {
    resolveContext(h.context);
  }
  const response = await responsePromise;
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), h.reply);
  assert.deepEqual(h.events, ["origin", "read", "parse", "visitor", "identity", "principal", "bound", "budget", "reserve", "context", "context-ready", "prepare", "model", "release"]);
  assert.equal(h.state.generated, 1);
  assert.equal(h.state.charged, h.reservationTokens);
  assert.equal(h.state.released, 1);
});

test("rejected asynchronous context fails closed and releases its lease without refunding admission", async () => {
  const h = harness();
  h.dependencies.getPublicChatContext = async () => {
    h.events.push("context");
    await Promise.resolve();
    throw new Error("private context retrieval details");
  };

  const response = await h.handler(request());
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "upstream" });
  assert.deepEqual(h.events, ["origin", "read", "parse", "visitor", "identity", "principal", "bound", "budget", "reserve", "context", "release"]);
  assert.deepEqual(h.state, { charged: h.reservationTokens, released: 1, generated: 0 });
});

test("quota denial returns 429 and database Retry-After without loading CMS context or calling the model", async () => {
  const h = harness();
  h.dependencies.reserveChatQuota = async () => {
    h.events.push("reserve");
    throw new QuotaError("rate_limit", 429, 61);
  };
  const response = await h.handler(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "61");
  assert.deepEqual(await response.json(), { error: "rate_limit" });
  assert.deepEqual(h.events, ["origin", "read", "parse", "visitor", "identity", "principal", "bound", "budget", "reserve"]);
  assert.equal(h.state.generated, 0);
  assert.equal(h.state.released, 0);
  assert.equal(h.state.charged, 0);
});

test("the gateway receives the single raw-body snapshot and only its owned visitor reaches identity", async () => {
  const h = harness();
  const token = "test-single-use-turnstile-token";
  const cookieHeader = "__Host-lexi_visitor=signed-test-cookie; Path=/; HttpOnly; Secure; SameSite=Strict";
  let rawSnapshot;
  h.dependencies.readChatBody = async (req) => {
    h.events.push("read");
    rawSnapshot = await readChatBody(req);
    return rawSnapshot;
  };
  h.dependencies.parseChatInput = (rawBody) => {
    h.events.push("parse");
    assert.equal(rawBody, rawSnapshot);
    return parseChatInput(rawBody);
  };
  h.dependencies.getChatVisitor = async (req, rawBody) => {
    h.events.push("visitor");
    assert.ok(req.bodyUsed, "verification must not read the request body a second time");
    assert.equal(rawBody, rawSnapshot);
    assert.equal(rawBody.turnstileToken, token);
    return { visitor: h.visitor, cookieHeader };
  };
  const response = await h.handler(request({ body: JSON.stringify({ ...validBody(), turnstileToken: token, visitor: { proof: "attacker-supplied" } }) }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("set-cookie"), cookieHeader);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), h.reply, "neither proof nor token may enter the public reply");
  assert.equal(h.events.filter((event) => event === "read").length, 1);
  assert.equal(h.events.filter((event) => event === "parse").length, 1);
  assert.equal(h.events.filter((event) => event === "visitor").length, 1);
});

test("token rejection precedes identity, monetary pricing, quota, context and provider even with a cookie or Bearer header", async () => {
  for (const code of ["unauthorized", "unavailable"]) {
    const h = harness();
    h.dependencies.getChatVisitor = async (req, rawBody) => {
      h.events.push("visitor");
      assert.equal(req.headers.get("authorization"), "Bearer test-authorization");
      assert.equal(req.headers.get("cookie"), "__Host-lexi_visitor=existing-browser-cookie");
      assert.equal(rawBody.turnstileToken, "rejected-token");
      throw new TurnstileError(code);
    };
    const response = await h.handler(request({
      headers: { origin: "https://site.example", "content-type": "application/json", authorization: "Bearer test-authorization", cookie: "__Host-lexi_visitor=existing-browser-cookie" },
      body: JSON.stringify({ ...validBody(), turnstileToken: "rejected-token" }),
    }));
    assert.equal(response.status, code === "unauthorized" ? 401 : 503);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("set-cookie"), null);
    assert.deepEqual(await response.json(), { error: code });
    assert.deepEqual(h.events, ["origin", "read", "parse", "visitor"]);
    assert.deepEqual(h.state, { charged: 0, released: 0, generated: 0 });
  }
});

test("verified browser cookies survive quota denial with Retry-After and all later failure paths", async () => {
  const cookieHeader = "__Host-lexi_visitor=signed-test-cookie; Path=/; HttpOnly; Secure; SameSite=Strict";
  for (const [overrides, status, code] of [
    [{ resolveQuotaIdentity: async () => { throw new QuotaIdentityError("unauthorized"); } }, 401, "unauthorized"],
    [{ getChatBudgetReservation: async () => { throw new QuotaError("unavailable", 503); } }, 503, "unavailable"],
    [{ reserveChatQuota: async () => { throw new QuotaError("rate_limit", 429, 61); } }, 429, "rate_limit"],
    [{ reserveChatQuota: async () => { throw new QuotaError("unavailable", 503); } }, 503, "unavailable"],
    [{ getPublicChatContext: async () => { throw new ChatAccessError(); } }, 403, "forbidden"],
    [{ prepareChatModelRequest: () => ({ reservedTokens: 64001 }) }, 413, "request_too_large"],
    [{ generatePreparedChatReply: async () => { throw new ChatFailure("upstream", 502); } }, 502, "upstream"],
    [{ getChatQuotaReservation: () => NaN }, 502, "upstream"],
  ]) {
    const h = harness(overrides);
    h.dependencies.getChatVisitor = async () => ({ visitor: h.visitor, cookieHeader });
    const response = await h.handler(request());
    assert.equal(response.status, status);
    assert.equal(response.headers.get("set-cookie"), cookieHeader);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("retry-after"), status === 429 ? "61" : null);
    assert.deepEqual(await response.json(), { error: code });
  }
});

test("disabled verification can return a null visitor without issuing a browser cookie", async () => {
  const h = harness();
  h.dependencies.getChatVisitor = async () => ({ visitor: null });
  h.dependencies.resolveQuotaIdentity = async (_request, visitor) => {
    assert.equal(visitor, null);
    return h.identity;
  };
  const response = await h.handler(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(h.state.generated, 1);
});

test("asynchronous monetary pricing completes before its exact EUR-micros cost reaches shared admission", async () => {
  const h = harness();
  let resolvePrice;
  const priceReady = new Promise((resolve) => { resolvePrice = resolve; });
  let enteredPricing;
  const pricingEntered = new Promise((resolve) => { enteredPricing = resolve; });
  const reservedCostEurMicros = 246813;
  h.dependencies.getChatBudgetReservation = async (tokens, model) => {
    h.events.push("budget");
    assert.equal(tokens, h.reservationTokens);
    assert.equal(model, "configured-model");
    enteredPricing();
    return priceReady;
  };
  h.dependencies.reserveChatQuota = async (identity, tokens, cost) => {
    h.events.push("reserve");
    assert.equal(identity, h.identity);
    assert.equal(tokens, h.reservationTokens);
    assert.equal(cost, reservedCostEurMicros);
    h.state.charged += tokens;
    return { async release() { h.events.push("release"); h.state.released += 1; } };
  };
  const responsePromise = h.handler(request());
  try {
    await pricingEntered;
    assert.deepEqual(h.events, ["origin", "read", "parse", "visitor", "identity", "principal", "bound", "budget"]);
    assert.deepEqual(h.state, { charged: 0, released: 0, generated: 0 });
  } finally {
    resolvePrice(reservedCostEurMicros);
  }
  const response = await responsePromise;
  assert.equal(response.status, 200);
  assert.equal(h.state.generated, 1);
  assert.equal(h.state.released, 1);
});

test("missing or invalid monetary pricing fails closed before database, context or provider work", async () => {
  for (const cost of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, "187500", undefined]) {
    const h = harness();
    h.dependencies.getChatBudgetReservation = async () => { h.events.push("budget"); return cost; };
    const response = await h.handler(request());
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: "upstream" });
    assert.deepEqual(h.events, ["origin", "read", "parse", "visitor", "identity", "principal", "bound", "budget"]);
    assert.deepEqual(h.state, { charged: 0, released: 0, generated: 0 });
  }
  const h = harness();
  h.dependencies.getChatBudgetReservation = async () => { h.events.push("budget"); throw new QuotaError("unavailable", 503); };
  const response = await h.handler(request());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "unavailable" });
  assert.deepEqual(h.events, ["origin", "read", "parse", "visitor", "identity", "principal", "bound", "budget"]);
  assert.deepEqual(h.state, { charged: 0, released: 0, generated: 0 });
});

test("a prepared snapshot one token above its reservation fails with 413 and releases the lease", async () => {
  const h = harness();
  h.dependencies.prepareChatModelRequest = () => {
    h.events.push("prepare");
    return Object.freeze({ reservedTokens: h.reservationTokens + 1 });
  };
  const response = await h.handler(request());
  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { error: "request_too_large" });
  assert.deepEqual(h.events, ["origin", "read", "parse", "visitor", "identity", "principal", "bound", "budget", "reserve", "context", "prepare", "release"]);
  assert.deepEqual(h.state, { charged: h.reservationTokens, released: 1, generated: 0 });
});

test("invalid reservation bounds fail closed before quota, CMS context or provider work", async () => {
  for (const bound of [0, -1, 1.5, 64001, NaN, Infinity, "39001", undefined]) {
    const h = harness();
    h.dependencies.getChatQuotaReservation = () => { h.events.push("bound"); return bound; };
    const response = await h.handler(request());
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: "upstream" });
    assert.deepEqual(h.events, ["origin", "read", "parse", "visitor", "identity", "principal", "bound"]);
    assert.deepEqual(h.state, { charged: 0, released: 0, generated: 0 });
  }
});

test("database outage fails closed with 503 instead of falling through to a model request", async () => {
  const h = harness({ reserveChatQuota: async () => { throw new QuotaError("unavailable", 503); } });
  const response = await h.handler(request());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "unavailable" });
  assert.equal(h.state.generated, 0);
  assert.equal(h.state.released, 0);
});

test("bad authentication exits with 401 before context loading, database reservation or model work", async () => {
  const h = harness({ resolveQuotaIdentity: async () => { throw new QuotaIdentityError("unauthorized"); } });
  const response = await h.handler(request());
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized" });
  for (const event of ["principal", "bound", "context", "prepare", "reserve", "model", "release"]) assert.ok(!h.events.includes(event));
});

test("provider failures still release concurrency exactly once and retain reserved abuse cost", async () => {
  const h = harness();
  h.dependencies.generatePreparedChatReply = async () => {
    h.events.push("model"); h.state.generated += 1;
    throw new ChatFailure("upstream", 502);
  };
  const response = await h.handler(request());
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "upstream" });
  assert.equal(h.state.released, 1);
  assert.equal(h.state.charged, h.reservationTokens, "failure must not refund a reserved operation");
  assert.deepEqual(h.events.slice(-2), ["model", "release"]);
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
  assert.equal(h.state.charged, h.reservationTokens);
});

test("asynchronous or synchronous release failures cannot replace an answer or refund counters", async () => {
  for (const release of [async () => { throw new Error("private store detail"); }, () => { throw new Error("private store detail"); }]) {
    const h = harness();
    h.dependencies.reserveChatQuota = async (_identity, cost) => { h.state.charged += cost; return { release }; };
    const response = await h.handler(request());
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), h.reply);
    assert.equal(h.state.charged, h.reservationTokens);
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
  for (const [overrides, status, code, reserved] of [
    [{ getPublicChatContext() { throw new ChatAccessError(); } }, 403, "forbidden", true],
    [{ prepareChatModelRequest() { throw new ChatFailure("request_too_large", 413); } }, 413, "request_too_large", true],
    [{ reserveChatQuota: async () => { throw new Error("private upstream credential detail"); } }, 502, "upstream", false],
  ]) {
    const h = harness(overrides);
    const response = await h.handler(request());
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), { error: code });
    assert.equal(h.state.generated, 0);
    assert.equal(h.state.released, reserved ? 1 : 0);
    assert.equal(h.state.charged, reserved ? h.reservationTokens : 0);
  }
});
