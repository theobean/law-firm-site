import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildEvidenceChoices, buildEvidenceSchema, evidencePassages, MAX_EVIDENCE_PASSAGES_PER_SOURCE, MAX_EVIDENCE_PASSAGE_CHARACTERS, MAX_EVIDENCE_SOURCES } from "../src/lib/chat/evidence-schema.mjs";
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

test("flat passage IDs bind immutable source text and keep empty evidence possible", () => {
  const records = [source("office-contact", "The office is in Thessaloniki. Its contact channels are published."), source("office-services", "Published legal services have their own independent description.")];
  const choices = buildEvidenceChoices(records);
  const schema = buildEvidenceSchema(choices);
  assert.equal(schema.type, "array");
  assert.equal(schema.maxItems, 4);
  assert.ok(!Object.hasOwn(schema, "minItems"), "controlled replies still allow an empty evidence array");
  assert.deepEqual(schema.items, { type: "string", enum: ["office-contact:p1", "office-services:p1"] });
  assert.ok(Object.isFrozen(choices) && choices.every(Object.isFrozen));
  assert.deepEqual(choices, records.map((record) => ({ id: `${record.id}:p1`, sourceId: record.id, quote: record.content })));
  const original = choices[0].quote;
  records[0].content = "Changed after immutable choices were created.";
  assert.equal(choices[0].quote, original);
  assert.throws(() => { choices[0].quote = "Forged quote."; }, TypeError);
  assert.throws(() => buildEvidenceChoices([{ ...records[0], id: "private-client-file" }]));
  assert.throws(() => buildEvidenceChoices([records[0], records[0]]));
  assert.throws(() => buildEvidenceChoices([]));
});

test("schema bounds cannot silently discard a source or exceed the provider enum envelope", () => {
  const records = REVIEWED_LEGAL_SOURCES.slice(0, MAX_EVIDENCE_SOURCES).map((record) => source(record.id, "α".repeat(6000)));
  const choices = buildEvidenceChoices(records);
  const schema = buildEvidenceSchema(choices);
  assert.equal(new Set(choices.map((choice) => choice.sourceId)).size, MAX_EVIDENCE_SOURCES);
  assert.ok(schema.items.enum.length + MAX_EVIDENCE_SOURCES + 32 < 1000);
  assert.ok(schema.items.enum.reduce((total, value) => total + value.length, 0) <= 15000);
  assert.ok(records.every((record) => choices.filter((choice) => choice.sourceId === record.id).length <= 64));
  assert.throws(() => buildEvidenceChoices([...records, source(REVIEWED_LEGAL_SOURCES[MAX_EVIDENCE_SOURCES].id, "A complete additional approved excerpt.")]));
  for (const content of [null, "short", "x".repeat(6001), "un-normalized cafe\u0301 source text.", "\ud800 invalid source passage."]) assert.throws(() => evidencePassages(content));
});

test("the provider snapshot carries complete ordered passages once and constrains real Greek sources without changing permissions or cost accounting", async () => {
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
    const schema = body.text.format.schema.properties.evidence;
    const choices = buildEvidenceChoices(records);
    assert.deepEqual(schema.items, { type: "string", enum: choices.map((choice) => choice.id) });
    const reference = JSON.parse(body.input[0].content.match(/<reference_material format="json">\n([\s\S]*?)\n<\/reference_material>/)[1]
      .replace(/&(?:amp|lt|gt);/g, (entity) => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">" })[entity]));
    for (const [index, record] of records.entries()) {
      assertCovered(record.content, reference[index].passages.map((passage) => passage.text));
      assert.deepEqual(reference[index].passages, choices.filter((choice) => choice.sourceId === record.id).map((choice) => ({ id: choice.id, text: choice.quote })));
      assert.ok(!Object.hasOwn(reference[index], "content"), "full text is represented by ordered passages without a duplicate content field");
    }
    assert.equal(prepared.reservedTokens, Buffer.byteLength(options.body, "utf8") + CHAT_TOKEN_FRAMING_ALLOWANCE + MAX_CHAT_OUTPUT_TOKENS);
    assert.deepEqual(body.tools, []);
    assert.equal(body.tool_choice, "none");
    assert.equal(body.max_output_tokens, 1800);
    assert.equal(body.service_tier, "default");
    const chosen = choices.find((choice) => choice.sourceId === property.id);
    const output = { ...reply(property, chosen.quote), evidence: [chosen.id] };
    return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(output) }] }] });
  } });
  assert.equal(calls, 1);
});

test("provider passage IDs cannot be forged, omitted, duplicated, mixed or assigned to an unselected source", async () => {
  const records = [source("office-contact", "The office is in Thessaloniki. Its contact channels are published."), source("office-services", "Published legal services have their own independent description.")];
  for (const evidence of [
    ["private-client-file:p1"], ["office-contact:p999"],
    ["office-contact:p1", "office-contact:p1"], [], undefined,
    ["office-services:p1"], ["office-contact:p1", { sourceId: records[0].id, quote: records[0].content }],
  ]) {
    const prepared = prepareChatModelRequest({ locale: "en", consent: true, messages: [{ role: "user", content: "Where is the office?" }] }, approved(records));
    let calls = 0;
    let usage = 0;
    await assert.rejects(generatePreparedChatReply(prepared, { apiKey: "test-only", onUsage: () => usage++, fetcher: async () => {
      calls++;
      return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ ...reply(records[0], records[0].content), evidence }) }] }] });
    } }), (error) => error.code === "upstream" && error.diagnostic.startsWith("evidence_"));
    assert.equal(calls, 1);
    assert.equal(usage, 0, "failed evidence validation never qualifies for a measured settlement");
  }
});

test("a passage ID resolves only the immutable text owned by its prepared snapshot", async () => {
  const record = source("office-contact", "The original office passage remains immutable.");
  const original = record.content;
  const prepared = prepareChatModelRequest({ locale: "en", consent: true, messages: [{ role: "user", content: "Where is the office?" }] }, approved([record]));
  record.content = "Changed outside the prepared authorized snapshot.";
  const result = await generatePreparedChatReply(prepared, { apiKey: "test-only", fetcher: async (_url, options) => {
    assert.ok(options.body.includes(original));
    assert.ok(!options.body.includes(record.content));
    return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ ...reply(record, original), answer: original, evidence: ["office-contact:p1"] }) }] }] });
  } });
  assert.equal(result.answer, original);
  assert.ok(!Object.hasOwn(result, "evidence"));
});

test("two distinct passage IDs of one card support a definition together with its separate qualification", async () => {
  const record = source("office-services", "This definition is general published service information. ".repeat(5) + "The separate qualification does not establish acceptance of a case or promise a result.");
  const choices = buildEvidenceChoices([record]);
  assert.ok(choices.length >= 2 && choices[0].quote !== choices.at(-1).quote);
  const prepared = prepareChatModelRequest({ locale: "en", consent: true, messages: [{ role: "user", content: "Which services are published?" }] }, approved([record]));
  const result = await generatePreparedChatReply(prepared, { apiKey: "test-only", fetcher: async () => Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ ...reply(record, choices[0].quote), evidence: [choices[0].id, choices.at(-1).id] }) }] }] }) });
  assert.equal(result.sources.length, 1);
});
