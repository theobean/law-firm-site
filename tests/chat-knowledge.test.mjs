import assert from "node:assert/strict";
import { test } from "node:test";
import { REVIEWED_LEGAL_SOURCES } from "../src/lib/chat/legal-catalog.mjs";
import { legalContextBytes, MAX_LEGAL_CONTEXT_BYTES, MAX_LEGAL_SOURCES, selectReviewedLegalSources } from "../src/lib/chat/legal-retrieval.mjs";
import { ChatAccessError, createAuthorizedChatContext, getPublicChatPrincipal, isApprovedPublicChatSourceId, readAuthorizedChatSources } from "../src/lib/chat/access.mjs";
import { parseChatReply, prepareChatModelRequest } from "../src/lib/chat/service.ts";
import { APPROVED_OFFICE_ARTICLES } from "../src/lib/chat/article-catalog.mjs";

const principal = getPublicChatPrincipal();
const ids = (sources) => sources.map(({ id }) => id);
const select = (question, options) => selectReviewedLegalSources(principal, question, options);
const byId = new Map(REVIEWED_LEGAL_SOURCES.map((source) => [source.id, source]));
const fixture = (id, overrides = {}) => ({
  ...byId.get(id), kind: "official-guidance", topics: [id], keywords: ["mediation"],
  content: `Reviewed complete excerpt for ${id}.`, ...overrides,
});
const context = (sources) => createAuthorizedChatContext(principal, "public", sources.map((source) => ({
  id: source.id, visibility: "public", publication: "published",
  load: () => ({ ...source, visibility: "public", publication: "published" }),
})));

test("the reviewed legal catalog has immutable metadata and independently approved source IDs", () => {
  assert.ok(REVIEWED_LEGAL_SOURCES.length >= 15);
  assert.ok(Object.isFrozen(REVIEWED_LEGAL_SOURCES));
  assert.equal(byId.size, REVIEWED_LEGAL_SOURCES.length);
  for (const source of REVIEWED_LEGAL_SOURCES) {
    assert.ok(Object.isFrozen(source));
    assert.ok(Object.isFrozen(source.topics));
    assert.ok(Object.isFrozen(source.keywords));
    assert.ok(isApprovedPublicChatSourceId(source.id), source.id);
    assert.equal(source.reviewedAt, "2026-11-09");
    assert.ok(["original-gazette", "official-guidance"].includes(source.kind));
    assert.ok(source.topics.length > 0 && source.keywords.length > 0);
    assert.equal(new URL(source.url).protocol, "https:");
  }
  assert.equal(APPROVED_OFFICE_ARTICLES.length, 13, "legal expansion must preserve the separately reviewed article registry");
});

test("Greek case, accents and inflection find the same Katseli guidance and original Gazette", () => {
  for (const question of ["Τι είναι ο νόμος Κατσέλη;", "ΚΑΤΣΕΛΗ", "κατσέλη", "Katseli law", "3869/2010"]) {
    const selected = ids(select(question));
    assert.ok(selected.includes("legislation-3869-2010"), question);
    assert.ok(selected.includes("legal-katseli-law"), question);
    assert.ok(!selected.includes("legal-mediation"), question);
    assert.ok(!selected.includes("legal-inheritance-tax"), question);
  }
  assert.deepEqual(select("38690"), [], "an adjacent statute number cannot match by numeric prefix");
});

test("multilingual reviewed search vocabulary retrieves the legal topic without unrelated sources", () => {
  for (const question of ["Τι είναι η διαμεσολάβηση;", "ΔΙΑΜΕΣΟΛΑΒΗΣΕΙΣ", "How does mediation work?", "Was ist eine Mediation?"]) {
    assert.deepEqual(ids(select(question)), ["legal-mediation"], question);
  }
  for (const question of ["What is a land registry record?", "Was steht im Grundbuch?", "κτηματολογικού φύλλου"]) {
    assert.ok(ids(select(question)).includes("legal-land-registry"), question);
  }
  for (const question of ["How does debt settlement work?", "Was ist eine außergerichtliche Schuldenregulierung?", "εξωδικαστικές ρυθμίσεις"]) {
    assert.ok(ids(select(question)).includes("legislation-4738-2020"), question);
  }
});

test("expanded official topics are reachable in realistic questions without loading the whole corpus", () => {
  for (const [question, expected] of [
    ["What is a credit report?", "legal-credit-report"],
    ["Τι είναι η βεβαίωση οφειλών;", "legal-debt-certificate"],
    ["What is a bank complaint?", "legal-bank-complaints"],
    ["Τι είναι το συναινετικό διαζύγιο;", "legal-consensual-divorce"],
    ["How does company formation work?", "legal-company-formation"],
    ["What is a property transfer?", "legal-property-transfer"],
    ["What does personal data access mean?", "legal-data-access"],
    ["What are defence rights after arrest?", "legal-criminal-defence-rights"],
    ["What are employment contract terms?", "legal-employment-terms"],
    ["Was ist Mobbing am Arbeitsplatz?", "legal-workplace-harassment"],
    ["What is a tax appeal?", "legal-tax-administrative-appeal"],
    ["What is access to public documents?", "legal-public-documents"],
  ]) {
    const selected = select(question);
    assert.ok(ids(selected).includes(expected), question);
    assert.ok(selected.length <= MAX_LEGAL_SOURCES);
    assert.ok(legalContextBytes(selected) <= MAX_LEGAL_CONTEXT_BYTES);
    assert.ok(!ids(selected).includes("legal-katseli-law"), question);
  }
});

test("every reviewed excerpt has a reachable search alias within the shared retrieval bounds", () => {
  for (const source of REVIEWED_LEGAL_SOURCES) {
    assert.ok(source.keywords.some((keyword) => {
      const selected = select(keyword);
      assert.ok(selected.length <= MAX_LEGAL_SOURCES);
      assert.ok(legalContextBytes(selected) <= MAX_LEGAL_CONTEXT_BYTES);
      return ids(selected).includes(source.id);
    }), source.id);
  }
});

test("law-topic comparison keeps both original statutes and their explanatory guidance", () => {
  const selected = ids(select("Ποια είναι η διαφορά νόμου Κατσέλη και εξωδικαστικού μηχανισμού;"));
  for (const id of ["legislation-3869-2010", "legal-katseli-law", "legislation-4738-2020", "legal-debt-settlement"]) {
    assert.ok(selected.includes(id), id);
  }
  assert.equal(selected.length, 4);
});

test("empty, unrelated and office-only questions do not fall back to the entire legal catalog", () => {
  for (const question of ["", " ", "Hello", "Weather tomorrow", "What is the office phone number?", "fundamental theory", "willing participants", "και την των", null, {}]) {
    assert.deepEqual(select(question), [], String(question));
  }
});

test("selection is stable across catalog ordering and prefers diversity among equally relevant topics", () => {
  const actual = select("Κατσέλη και διαμεσολάβηση");
  assert.deepEqual(select("Κατσέλη και διαμεσολάβηση", { sources: [...REVIEWED_LEGAL_SOURCES].reverse() }), actual);
  const sources = [
    fixture("legal-mediation", { topics: ["mediation"] }),
    fixture("legal-banking-code", { topics: ["mediation"] }),
    fixture("legal-land-registry", { topics: ["mediation"] }),
    fixture("legal-inheritance-tax", { topics: ["mediation"] }),
    fixture("legal-labor-disputes", { topics: ["labor"], keywords: ["employment"] }),
  ];
  const selected = select("mediation employment", { sources });
  assert.ok(ids(selected).slice(0, 2).includes("legal-labor-disputes"));
  assert.equal(selected.length, MAX_LEGAL_SOURCES);
});

test("whole-excerpt count and encoded-byte budgets include provenance labels and XML expansion", () => {
  const sources = ["legal-mediation", "legal-banking-code", "legal-land-registry", "legal-inheritance-tax", "legal-labor-disputes"]
    .map((id) => fixture(id, { content: "&<🙂α".repeat(300) + ` END_${id}` }));
  const selected = select("mediation", { sources });
  assert.ok(selected.length > 0 && selected.length < MAX_LEGAL_SOURCES);
  assert.ok(legalContextBytes(selected) <= MAX_LEGAL_CONTEXT_BYTES);
  assert.ok(Object.isFrozen(selected));
  for (const source of selected) {
    assert.ok(Object.isFrozen(source));
    assert.ok(source.content.startsWith("ΕΠΙΣΗΜΗ ΚΑΘΟΔΗΓΗΣΗ"));
    assert.ok(source.content.endsWith(` END_${source.id}`), "the legally relevant end of an excerpt must not be clipped");
  }
  const broad = select(REVIEWED_LEGAL_SOURCES.flatMap(({ keywords }) => keywords.slice(0, 1)).join(" ").slice(0, 1900));
  assert.ok(broad.length <= MAX_LEGAL_SOURCES);
  assert.ok(legalContextBytes(broad) <= MAX_LEGAL_CONTEXT_BYTES);
});

test("approval and the owned public principal precede content reads, including exact keyword matches", () => {
  let reads = 0;
  const deniedContent = () => { reads++; throw new Error("denied content must not be read"); };
  const allowed = fixture("legal-mediation");
  const unknown = { ...fixture("legal-banking-code"), id: "private-unapproved-source", get content() { return deniedContent(); } };
  const privateSource = { ...fixture("legal-land-registry"), visibility: "private", get content() { return deniedContent(); } };
  const draft = { ...fixture("legal-inheritance-tax"), publication: "draft", get content() { return deniedContent(); } };
  const unrelated = { ...fixture("legal-labor-disputes"), keywords: ["employment"], get content() { return deniedContent(); } };
  const sources = [allowed, unknown, privateSource, draft, unrelated];
  for (const forged of [undefined, null, {}, { role: "admin" }, { ...principal }]) {
    assert.throws(() => selectReviewedLegalSources(forged, "mediation", { sources }), ChatAccessError);
  }
  assert.deepEqual(ids(select("mediation", { sources })), ["legal-mediation"]);
  assert.equal(reads, 0);
});

test("adding unmatched catalog entries does not load them or inflate the selected provider envelope", () => {
  const chosen = fixture("legal-mediation");
  const untouched = ["legal-banking-code", "legal-land-registry", "legal-inheritance-tax", "legal-labor-disputes"].map((id) => ({
    ...fixture(id), keywords: ["unmatchedvocabulary"], get content() { throw new Error("unmatched content read"); },
  }));
  const input = { locale: "el", consent: true, messages: [{ role: "user", content: "mediation" }] };
  const small = select("mediation", { sources: [chosen] });
  const expanded = select("mediation", { sources: [chosen, ...untouched] });
  assert.deepEqual(expanded, small);
  assert.equal(prepareChatModelRequest(input, context(expanded)).reservedTokens, prepareChatModelRequest(input, context(small)).reservedTokens);
});

test("authorization projects the frozen selected context and rejects citations to unselected approved entries", () => {
  const selected = select("διαμεσολάβηση");
  const authorized = context(selected);
  assert.deepEqual(readAuthorizedChatSources(authorized), selected);
  assert.ok(!ids(selected).includes("legal-inheritance-tax"));
  assert.throws(() => parseChatReply({ kind: "grounded", answer: "An unsupported legal claim.", sourceIds: ["legal-inheritance-tax"], suggestContact: false }, selected),
    (error) => error.code === "upstream" && error.status === 502);
});
