import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildEvidenceSchema, evidencePassages, MAX_EVIDENCE_PASSAGES_PER_SOURCE, MAX_EVIDENCE_PASSAGE_CHARACTERS, MAX_EVIDENCE_SOURCES } from "../src/lib/chat/evidence-schema.mjs";
import { REVIEWED_LEGAL_SOURCES } from "../src/lib/chat/legal-catalog.mjs";
import { createAuthorizedChatContext, getPublicChatPrincipal } from "../src/lib/chat/access.mjs";
import { CHAT_TOKEN_FRAMING_ALLOWANCE, MAX_CHAT_OUTPUT_TOKENS, generatePreparedChatReply, parseChatReply, prepareChatModelRequest } from "../src/lib/chat/service.ts";

const source = (id, content) => ({ id, title: "Reviewed source", url: "https://ioannispapaioannou.lawyer/el/contact", content });
const approved = (records) => createAuthorizedChatContext(getPublicChatPrincipal(), "public", records.map((record) => ({
  id: record.id, visibility: "public", publication: "published", load: () => ({ ...record, visibility: "public", publication: "published" }),
})));
const reply = (record, quote) => ({ kind: "grounded", answer: "A supported general explanation.", sourceIds: [record.id], evidence: [{ sourceId: record.id, quote }], suggestContact: false });

function assertCovered(content, passages) {
  const coverage = new Uint8Array(content.length);
  assert.ok(passages.length > 0 && passages.length <= MAX_EVIDENCE_PASSAGES_PER_SOURCE);
  for (const passage of passages) {
    assert.ok(passage.length >= 20 && passage.length <= MAX_EVIDENCE_PASSAGE_CHARACTERS);
    assert.equal(passage.trim(), passage);
    assert.ok(content.includes(passage), "every candidate is a literal contiguous substring");
    for (let offset = content.indexOf(passage); offset !== -1; offset = content.indexOf(passage, offset + 1)) {
      coverage.fill(1, offset, offset + passage.length);
    }
  }
  for (let offset = 0; offset < content.length; offset++) {
    if (!/\s/u.test(content[offset])) assert.equal(coverage[offset], 1, `uncovered source character ${offset}`);
  }
}

test("every complete approved legal excerpt is covered by deterministic literal choices, including its final qualification", () => {
  for (const record of REVIEWED_LEGAL_SOURCES) {
    const content = `ΕΛΕΓΜΕΝΗ ΠΗΓΗ. Έλεγχος ${record.reviewedAt}.\n${record.content}`;
    const passages = evidencePassages(content);
    assertCovered(content, passages);
    assert.deepEqual(evidencePassages(content), passages);
    assert.ok(Object.isFrozen(passages));
    for (const quote of passages) assert.equal(parseChatReply(reply({ ...record, content }, quote), [{ ...record, content }]).sources.length, 1);
    assert.equal(record.content.endsWith(content.slice(-20)), true, "source content is never rewritten or shortened");
  }
});

test("sentence and word boundaries retain long clauses, Unicode and short final tails", () => {
  for (const content of [
    "A meaningful first sentence is complete. Another meaningful sentence explains a qualification. A final sentence remains intact.",
    "Η περιγραφή διατηρεί όλες τις προϋποθέσεις και τις επιφυλάξεις. ".repeat(30) + "Τέλος.",
    "A long clause keeps every original word and punctuation ".repeat(55) + "END_SENTINEL.",
    "α".repeat(5993) + " ΤΕΛΟΣ",
    "🙂".repeat(2900) + " literal final qualification.",
  ]) assertCovered(content, evidencePassages(content));
  const simple = evidencePassages("One complete sentence is a meaningful source passage. Another complete sentence is also a meaningful source passage.");
  assert.equal(simple.length, 1, "complete short sentences can share one meaningful passage");
});

test("the schema ties each finite passage enum to its own approved source and keeps empty evidence possible", () => {
  const records = [source("office-contact", "The office is in Thessaloniki. Its contact channels are published."), source("office-services", "Published legal services have their own independent description.")];
  const schema = buildEvidenceSchema(records);
  assert.equal(schema.type, "array");
  assert.equal(schema.maxItems, 4);
  assert.ok(!Object.hasOwn(schema, "minItems"), "controlled replies still allow an empty evidence array");
  assert.equal(schema.items.anyOf.length, records.length);
  for (const [index, branch] of schema.items.anyOf.entries()) {
    assert.equal(branch.type, "object");
    assert.equal(branch.additionalProperties, false);
    assert.deepEqual(branch.required, ["sourceId", "quote"]);
    assert.deepEqual(branch.properties.sourceId.enum, [records[index].id]);
    assert.deepEqual(branch.properties.quote.enum, evidencePassages(records[index].content));
    assert.ok(!Object.hasOwn(branch.properties.quote, "pattern"));
    assert.ok(!branch.properties.quote.enum.includes(records[1 - index].content));
  }
  assert.throws(() => buildEvidenceSchema([{ ...records[0], id: "private-client-file" }]));
  assert.throws(() => buildEvidenceSchema([records[0], records[0]]));
  assert.throws(() => buildEvidenceSchema([]));
});

test("schema bounds cannot silently discard a source or exceed the provider enum envelope", () => {
  const records = REVIEWED_LEGAL_SOURCES.slice(0, MAX_EVIDENCE_SOURCES).map((record) => source(record.id, "α".repeat(6000)));
  const schema = buildEvidenceSchema(records);
  assert.equal(schema.items.anyOf.length, MAX_EVIDENCE_SOURCES);
  const enums = schema.items.anyOf.flatMap((branch) => [branch.properties.sourceId.enum, branch.properties.quote.enum]);
  assert.ok(enums.reduce((total, values) => total + values.length, 0) + MAX_EVIDENCE_SOURCES + 32 < 1000);
  assert.ok(enums.flat().reduce((total, value) => total + value.length, 0) < 90000);
  assert.ok(schema.items.anyOf.every((branch) => branch.properties.quote.enum.length <= 64));
  assert.throws(() => buildEvidenceSchema([...records, source(REVIEWED_LEGAL_SOURCES[MAX_EVIDENCE_SOURCES].id, "A complete additional approved excerpt.")]));
  for (const content of [null, "short", "x".repeat(6001), "un-normalized cafe\u0301 source text.", "\ud800 invalid source passage."]) assert.throws(() => evidencePassages(content));
});

test("the actual provider snapshot constrains real Greek office and property sources without changing facts, permissions or cost accounting", async () => {
  const messages = JSON.parse(readFileSync(new URL("../messages/el.json", import.meta.url), "utf8"));
  const office = source("office-services", `Κύρια εξειδίκευση του γραφείου: ${messages.practiceAreas.areas.banking.title} και ${messages.practiceAreas.areas.extrajudicial.title}. Δημοσιευμένοι τομείς: ${Object.values(messages.practiceAreas.areas).map((area) => area.title).join("; ")}. Η αναφορά υπηρεσίας δεν συνεπάγεται αποδοχή συγκεκριμένης υπόθεσης ή εγγύηση αποτελέσματος.`);
  const property = REVIEWED_LEGAL_SOURCES.find((record) => record.id === "legal-property-transfer");
  const records = [office, property];
  const prepared = prepareChatModelRequest({ locale: "el", consent: true, messages: [{ role: "user", content: "Θέλω να αγοράσω ένα σπίτι. Τι κάνει ο ψηφιακός φάκελος μεταβίβασης;" }] }, approved(records));
  let calls = 0;
  await generatePreparedChatReply(prepared, { apiKey: "test-only", fetcher: async (_url, options) => {
    calls++;
    const body = JSON.parse(options.body);
    assert.equal(body.text.format.schema.type, "object");
    const branches = body.text.format.schema.properties.evidence.items.anyOf;
    assert.deepEqual(branches.map((branch) => branch.properties.sourceId.enum[0]), records.map((record) => record.id));
    for (const [index, branch] of branches.entries()) {
      assertCovered(records[index].content, branch.properties.quote.enum);
      const serializedContent = JSON.stringify(records[index].content).slice(1, -1).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      assert.ok(body.input[0].content.includes(serializedContent), "the full original reference stays in the request");
    }
    assert.equal(prepared.reservedTokens, Buffer.byteLength(options.body, "utf8") + CHAT_TOKEN_FRAMING_ALLOWANCE + MAX_CHAT_OUTPUT_TOKENS);
    assert.deepEqual(body.tools, []);
    assert.equal(body.tool_choice, "none");
    assert.equal(body.max_output_tokens, 1800);
    assert.equal(body.service_tier, "default");
    const chosen = branches.find((branch) => branch.properties.sourceId.enum[0] === property.id);
    const output = reply(property, chosen.properties.quote.enum[0]);
    return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(output) }] }] });
  } });
  assert.equal(calls, 1);
});
