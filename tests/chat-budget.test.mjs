import assert from "node:assert/strict";
import { test } from "node:test";
import { createAuthorizedChatContext, getPublicChatPrincipal } from "../src/lib/chat/access.mjs";
import {
  CHAT_TOKEN_FRAMING_ALLOWANCE, MAX_CHAT_OUTPUT_TOKENS, MAX_CHAT_RESERVED_TOKENS,
  generateChatReply, generatePreparedChatReply, parseChatInput, prepareChatModelRequest,
} from "../src/lib/chat/service.ts";

const source = (id = "office-contact", content = "The office is in Thessaloniki.") => ({
  id, title: "Public office information", url: "https://www.ioannispapaioannou.lawyer/el/contact", content,
  visibility: "public", publication: "published",
});
const authorized = (records = [source()]) => createAuthorizedChatContext(getPublicChatPrincipal(), "public", records.map((record) => ({
  id: record.id, visibility: "public", publication: "published", load: () => record,
})));
const validInput = (content = "Where is the office?") => ({ locale: "el", consent: true, messages: [{ role: "user", content }] });
const response = () => Response.json({ status: "completed", output: [{ type: "message", content: [{
  type: "output_text", text: JSON.stringify({ kind: "grounded", answer: "The office is in Thessaloniki.", sourceIds: ["office-contact"], evidence: [{ sourceId: "office-contact", quote: source().content }], suggestContact: false }),
}] }] });

test("reserves the full exact serialized request, protocol headroom and all generated-token allowance", async () => {
  const prepared = prepareChatModelRequest(validInput(), authorized());
  let sent;
  await generatePreparedChatReply(prepared, { apiKey: "test-only-key", fetcher: async (_url, options) => {
    sent = options.body;
    return response();
  } });
  const body = JSON.parse(sent);
  assert.equal(prepared.reservedTokens, new TextEncoder().encode(sent).byteLength + CHAT_TOKEN_FRAMING_ALLOWANCE + MAX_CHAT_OUTPUT_TOKENS);
  assert.equal(body.max_output_tokens, 1800);
  assert.equal(body.store, false);
  assert.ok(!body.instructions.includes("The office is in Thessaloniki."));
  assert.ok(body.input[0].content.includes('"passages":[{"id":"office-contact:p1","text":"The office is in Thessaloniki."}]'));
  assert.deepEqual(body.text.format.schema.properties.sourceIds.items.enum, ["office-contact"]);
  assert.ok(prepared.reservedTokens < MAX_CHAT_RESERVED_TOKENS);
});

test("reservation includes Unicode byte cost, long history and public context instead of chars/4 guesses", () => {
  const ascii = prepareChatModelRequest(validInput("a".repeat(100)), authorized());
  const greek = prepareChatModelRequest(validInput("α".repeat(100)), authorized());
  assert.equal(greek.reservedTokens - ascii.reservedTokens, 100, "equal character counts can have different UTF-8 costs");
  const moreContext = prepareChatModelRequest(validInput("a".repeat(100)), authorized([source("office-contact", "a".repeat(1000))]));
  assert.ok(moreContext.reservedTokens > ascii.reservedTokens + 900);
  const withHistory = validInput();
  withHistory.messages = [{ role: "user", content: "old question" }, { role: "assistant", content: "prior answer" }, ...withHistory.messages];
  assert.ok(prepareChatModelRequest(withHistory, authorized()).reservedTokens > prepareChatModelRequest(validInput(), authorized()).reservedTokens);
});

test("the reserved snapshot cannot change after preparation or through a fake prepared handle", async () => {
  const input = validInput();
  const prepared = prepareChatModelRequest(input, authorized(), "gpt-5.4-mini");
  assert.ok(Object.isFrozen(prepared));
  assert.deepEqual(Object.keys(prepared), ["reservedTokens"]);
  assert.throws(() => { prepared.reservedTokens = 0; }, TypeError);
  input.messages[0].content = "Changed after the reservation";
  let calls = 0;
  const options = { apiKey: "test-only-key", fetcher: async (_url, options) => {
    calls += 1;
    const sent = JSON.parse(options.body);
    assert.match(sent.input[0].content, /<user_input>\nWhere is the office\?\n<\/user_input>$/);
    assert.ok(!sent.input[0].content.includes("Changed after the reservation"));
    assert.equal(sent.model, "gpt-5.4-mini-2026-03-17");
    return response();
  } };
  for (const fake of [null, {}, { ...prepared }, JSON.parse(JSON.stringify(prepared)), { reservedTokens: 0 }, Object.create(prepared)]) {
    await assert.rejects(generatePreparedChatReply(fake, options), (error) => error.code === "forbidden" && error.status === 403);
  }
  assert.equal(calls, 0);
  await generatePreparedChatReply(prepared, options);
  assert.equal(calls, 1);
});

test("a prepared operation is single-use even when callers race or a provider request fails", async () => {
  const prepared = prepareChatModelRequest(validInput(), authorized());
  let calls = 0;
  const options = { apiKey: "test-only-key", fetcher: async () => { calls += 1; return response(); } };
  const results = await Promise.allSettled([generatePreparedChatReply(prepared, options), generatePreparedChatReply(prepared, options)]);
  assert.equal(results.filter(({ status }) => status === "fulfilled").length, 1);
  assert.equal(results.find(({ status }) => status === "rejected").reason.code, "forbidden");
  assert.equal(calls, 1);
  const failed = prepareChatModelRequest(validInput(), authorized());
  await assert.rejects(generatePreparedChatReply(failed, { apiKey: "test-only-key", fetcher: async () => Response.json({}, { status: 503 }) }), (error) => error.code === "upstream");
  await assert.rejects(generatePreparedChatReply(failed, options), (error) => error.code === "forbidden");
  assert.equal(calls, 1, "failure cannot replay a previously reserved handle");
});

test("large context and multibyte history spikes are rejected before any provider call", async () => {
  const largeContext = authorized(["office-contact", "office-identity", "office-appointments", "office-services", "office-nationwide"].map((id) => source(id, "α".repeat(6000))));
  assert.throws(() => prepareChatModelRequest(validInput(), largeContext), (error) => error.code === "request_too_large" && error.status === 413);
  const input = validInput();
  input.messages = Array.from({ length: 9 }, (_, index) => ({
    role: index % 2 ? "assistant" : "user", content: "€".repeat(index % 2 ? 3750 : 1000),
  }));
  let calls = 0;
  await assert.rejects(generateChatReply(input, authorized(), { apiKey: "test-only-key", fetcher: async () => { calls += 1; return response(); } }),
    (error) => error.code === "request_too_large" && error.status === 413);
  assert.equal(calls, 0);
});

test("escape-expanded valid history is rejected by the final request reservation before any provider call", async () => {
  const input = validInput();
  input.messages = Array.from({ length: 9 }, (_, index) => ({
    role: index % 2 ? "assistant" : "user", content: "&".repeat(index % 2 ? 3500 : 1000),
  }));
  assert.equal(input.messages.reduce((sum, { content }) => sum + content.length, 0), 19000);
  assert.deepEqual(parseChatInput(input), input, "unescaped messages satisfy the per-message and total input limits");
  const sameSizePlainInput = { ...input, messages: input.messages.map(({ role, content }) => ({ role, content: "a".repeat(content.length) })) };
  assert.ok(prepareChatModelRequest(sameSizePlainInput, authorized()).reservedTokens < MAX_CHAT_RESERVED_TOKENS);
  let calls = 0;
  await assert.rejects(generateChatReply(input, authorized(), {
    apiKey: "test-only-key", fetcher: async () => { calls += 1; return response(); },
  }), (error) => error.code === "request_too_large" && error.status === 413);
  assert.equal(calls, 0);
});
