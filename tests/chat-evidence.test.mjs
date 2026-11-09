import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseChatReply, generateChatReply } from "../src/lib/chat/service.ts";
import { createAuthorizedChatContext, getPublicChatPrincipal } from "../src/lib/chat/access.mjs";

const sources = [
  { id: "office-contact", title: "Contact", url: "https://ioannispapaioannou.lawyer/el/contact", content: "The office is in Thessaloniki. Contact the office by phone or through its contact page." },
  { id: "office-services", title: "Services", url: "https://ioannispapaioannou.lawyer/el/practice-areas", content: "The office provides general information about its published legal services." },
];
const valid = () => ({ kind: "grounded", answer: "The office is in Thessaloniki.", sourceIds: [sources[0].id], evidence: [{ sourceId: sources[0].id, quote: "The office is in Thessaloniki." }], suggestContact: false });
const fails = (fn) => assert.throws(fn, error => error.code === "upstream" && error.status === 502);
const escapePrompt = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const quotedReply = (source, quote) => ({ ...valid(), sourceIds: [source.id], evidence: [{ sourceId: source.id, quote }] });

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

test("actual Greek office-service titles accept original or once-escaped prompt evidence", () => {
  const messages = JSON.parse(readFileSync(new URL("../messages/el.json", import.meta.url), "utf8"));
  const record = { ...sources[1], content: `Κύρια εξειδίκευση του γραφείου: ${messages.practiceAreas.areas.banking.title} και ${messages.practiceAreas.areas.extrajudicial.title}. Δημοσιευμένοι τομείς: ${Object.values(messages.practiceAreas.areas).map((area) => area.title).join("; ")}. Η αναφορά υπηρεσίας δεν συνεπάγεται αποδοχή συγκεκριμένης υπόθεσης ή εγγύηση αποτελέσματος.` };
  const quote = record.content.split(". ")[1] + ".";
  assert.ok(quote.includes("&") && quote.includes("Εργατικό Δίκαιο") && quote.includes("Κληρονομικό Δίκαιο"));
  for (const text of [quote, escapePrompt(quote), escapePrompt(quote).normalize("NFD")]) {
    const reply = parseChatReply({ ...quotedReply(record, text), answer: "Στους δημοσιευμένους τομείς περιλαμβάνονται το Κληρονομικό και το Εργατικό Δίκαιο." }, [record], "el");
    assert.equal(reply.sources.length, 1);
    assert.ok(!Object.hasOwn(reply, "evidence"));
  }
});

test("evidence handles only one XML transport layer while preserving literal entities and quotation marks", () => {
  for (const content of [
    'The published title is "A & B"; its examples use C < D and E > F.',
    'The published title is "A &amp; B"; that entity text is literal.',
  ]) {
    const record = { ...sources[1], content };
    for (const quote of [content, escapePrompt(content)]) {
      assert.equal(parseChatReply(quotedReply(record, quote), [record]).sources.length, 1);
    }
  }
  const record = { ...sources[1], content: 'The published title is "A & B"; its examples use C < D and E > F.' };
  for (const quote of [
    escapePrompt(escapePrompt(record.content)),
    record.content.replace("&", "&#38;"),
    record.content.replace("&", "&#x26;"),
    record.content.replace("&", "&copy;"),
    record.content.replace('"A & B"', "“A & B”"),
    record.content.replace("examples use", "examples  use"),
    record.content.replace("published title", "guaranteed outcome"),
  ]) fails(() => parseChatReply(quotedReply(record, quote), [record]));
  fails(() => parseChatReply({ ...quotedReply(record, escapePrompt(record.content)), sourceIds: ["private-client-file"] }, [record]));
});

test("transport evidence cannot match partial entity fragments or bypass quote length bounds", () => {
  const record = { ...sources[1], content: "& This published phrase is a literal source passage." };
  const fragment = escapePrompt(record.content).slice(1);
  assert.ok(fragment.startsWith("amp;") && fragment.length >= 20);
  fails(() => parseChatReply(quotedReply(record, fragment), [record]));
  const short = { ...sources[1], content: "A & B < C > D" };
  assert.ok(escapePrompt(short.content).length >= 20 && short.content.length < 20);
  fails(() => parseChatReply(quotedReply(short, escapePrompt(short.content)), [short]));
  const long = { ...sources[1], content: "A & B ".repeat(65) };
  assert.ok(long.content.length <= 400 && escapePrompt(long.content).length > 400);
  fails(() => parseChatReply(quotedReply(long, escapePrompt(long.content)), [long]));
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
