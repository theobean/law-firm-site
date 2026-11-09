import assert from "node:assert/strict";
import { test } from "node:test";
import { parseChatReply, generateChatReply } from "../src/lib/chat/service.ts";
import { createAuthorizedChatContext, getPublicChatPrincipal } from "../src/lib/chat/access.mjs";

const sources = [
  { id: "office-contact", title: "Contact", url: "https://ioannispapaioannou.lawyer/el/contact", content: "The office is in Thessaloniki. Contact the office by phone or through its contact page." },
  { id: "office-services", title: "Services", url: "https://ioannispapaioannou.lawyer/el/practice-areas", content: "The office provides general information about its published legal services." },
];
const valid = () => ({ kind: "grounded", answer: "The office is in Thessaloniki.", sourceIds: [sources[0].id], evidence: [{ sourceId: sources[0].id, quote: "The office is in Thessaloniki." }], suggestContact: false });
const fails = (fn) => assert.throws(fn, error => error.code === "upstream" && error.status === 502);

test("a permitted citation without an exact substantive source passage is not enough", () => {
  for (const evidence of [undefined, [], null, [{ sourceId: sources[0].id, quote: "The office guarantees success in every legal case." }], [{ sourceId: sources[0].id, quote: "Thessaloniki" }]]) {
    fails(() => parseChatReply({ ...valid(), evidence }, sources));
  }
  const reply = parseChatReply(valid(), sources);
  assert.equal(reply.answer, valid().answer);
  assert.deepEqual(reply.sources, [{ title: sources[0].title, url: sources[0].url }]);
  assert.ok(!Object.hasOwn(reply, "evidence"), "internal evidence never becomes a browser response field");
});

test("evidence cannot cite another source, miss one selected source or duplicate its attribution", () => {
  fails(() => parseChatReply({ ...valid(), evidence: [{ sourceId: sources[1].id, quote: sources[1].content }] }, sources));
  fails(() => parseChatReply({ ...valid(), sourceIds: sources.map(s => s.id) }, sources));
  fails(() => parseChatReply({ ...valid(), evidence: [valid().evidence[0], valid().evidence[0]] }, sources));
  fails(() => parseChatReply({ ...valid(), evidence: [{ ...valid().evidence[0], permission: "admin" }] }, sources));
  fails(() => parseChatReply({ ...valid(), evidence: [{ sourceId: sources[0].id, quote: "x".repeat(401) }] }, [{ ...sources[0], content: "x".repeat(500) }]));
  const all = parseChatReply({ ...valid(), sourceIds: sources.map(s => s.id), evidence: sources.map(s => ({ sourceId: s.id, quote: s.content })) }, sources);
  assert.equal(all.sources.length, 2);
});

test("normalization preserves copied source text but does not permit approximate or invented quotes", () => {
  const record = { ...sources[0], content: "Το γραφείο εξυπηρετεί στη Θεσσαλονίκη." };
  const item = { ...valid(), answer: record.content, evidence: [{ sourceId: record.id, quote: record.content.normalize("NFD") }] };
  assert.equal(parseChatReply(item, [record]).answer, record.content);
  fails(() => parseChatReply({ ...item, evidence: [{ sourceId: record.id, quote: record.content.replace("εξυπηρετεί", "εγγυάται") }] }, [record]));
});

test("real provider output must supply evidence; no retry or second model call repairs a missing quote", async () => {
  const context = createAuthorizedChatContext(getPublicChatPrincipal(), "public", sources.map(s => ({ id: s.id, visibility: "public", publication: "published", load: () => ({ ...s, visibility: "public", publication: "published" }) })));
  let calls = 0;
  await assert.rejects(generateChatReply({ locale: "el", consent: true, messages: [{ role: "user", content: "Πού βρίσκεται το γραφείο;" }] }, context, {
    apiKey: "test-only-key", fetcher: async () => { calls++; const reply = valid(); delete reply.evidence; return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(reply) }] }] }); },
  }), error => error.code === "upstream");
  assert.equal(calls, 1);
});

test("controlled wording cannot hide an unauthorized citation or invalid supplied evidence", () => {
  fails(() => parseChatReply({ ...valid(), kind: "out_of_scope", sourceIds: ["private-client-file"] }, sources));
  fails(() => parseChatReply({ ...valid(), kind: "private_access", evidence: [{ sourceId: sources[0].id, quote: "Invented client information that is not present." }] }, sources));
});
