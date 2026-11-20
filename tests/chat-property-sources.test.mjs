import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";
import {
  ChatAccessError, createAuthorizedChatContext, getPublicChatPrincipal,
  isApprovedPublicChatSourceId, readAuthorizedChatSources,
} from "../src/lib/chat/access.mjs";
import { APPROVED_OFFICE_ARTICLES } from "../src/lib/chat/article-catalog.mjs";
import {
  getPublicPropertySources, MAX_PROPERTY_CONTEXT_BYTES, MAX_PROPERTY_SOURCES,
  propertyContextBytes,
} from "../src/lib/chat/property-sources.mjs";
import {
  PROPERTY_PURCHASE_GUIDES, PROPERTY_DEPOSIT_GUIDES,
  PROPERTY_ATHENS_PAGES, PROPERTY_NEW_BUILD_PAGES,
} from "../src/lib/property-content.mjs";
import {
  generatePreparedChatReply, MAX_CHAT_RESERVED_TOKENS, parseChatReply,
  prepareChatModelRequest,
} from "../src/lib/chat/service.ts";

// Exercise the real Next-only knowledge module under Node. Only the build-time
// server-only marker and the three static JSON imports need test adapters.
const knowledgeHooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (/\/messages\/(?:el|en|de)\.json$/u.test(url)) {
      return { format: "module", source: `export default ${readFileSync(new URL(url), "utf8")}`, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
let knowledge;
try {
  knowledge = await import("../src/lib/chat/knowledge.ts");
} finally {
  knowledgeHooks.deregister();
}
const { getStaticPublicChatContext, getPublicChatContext } = knowledge;
const principal = getPublicChatPrincipal();
const guideId = "office-article-d1fca9c5-06ac-4185-a2fd-6b00f82589bb";
const input = (question, locale = "el") => ({ locale, consent: true, messages: [{ role: "user", content: question }] });
const select = (question, locale = "el") => getPublicPropertySources(principal, locale, question);
const contextFor = (sources) => createAuthorizedChatContext(principal, "public", sources.map((source) => ({
  id: source.id, visibility: "public", publication: "published",
  load: () => ({ ...source, visibility: "public", publication: "published", privateNotes: "PRIVATE_PROPERTY_NOTE" }),
})));

test("property content rejects forged access and invalid locale before returning any context", () => {
  for (const forged of [undefined, null, {}, { role: "public" }, { ...principal }]) {
    assert.throws(() => getPublicPropertySources(forged, "el", "Αγορά ακινήτου"), ChatAccessError);
    assert.throws(() => getPublicPropertySources(forged, "el", ""), ChatAccessError);
  }
  for (const locale of [undefined, null, "fr", "EL", {}, "__proto__"]) {
    assert.throws(() => getPublicPropertySources(principal, locale, "Αγορά ακινήτου"), TypeError);
  }
  for (const question of [undefined, null, {}, [], "", "   ", "α".repeat(2001), "\ud800"]) {
    const result = select(question);
    assert.deepEqual(result, []);
    assert.ok(Object.isFrozen(result));
  }
});

test("new property services and deposit guidance are reachable in all supported chat languages", () => {
  for (const [locale, question, expected, path] of [
    ["el", "Τι αναλαμβάνει το γραφείο για αγορά ακινήτου στην Αθήνα;", "office-property-athens", "/practice-areas/realEstate/agora-akinitou-athina"],
    ["en", "What legal checks does the office handle when buying property in Athens?", "office-property-athens", "/practice-areas/realEstate/agora-akinitou-athina"],
    ["de", "Was prüft die Kanzlei beim Immobilienkauf in Athen?", "office-property-athens", "/practice-areas/realEstate/agora-akinitou-athina"],
    ["el", "Τι ελέγχετε σε αγορά νεόδμητου;", "office-property-new-build", "/practice-areas/realEstate/agora-neodmitou"],
    ["en", "What does the guide say about buying a new-build flat?", "office-property-new-build", "/practice-areas/realEstate/agora-neodmitou"],
    ["de", "Welche Prüfung bietet die Kanzlei beim Kauf einer Neubauwohnung?", "office-property-new-build", "/practice-areas/realEstate/agora-neodmitou"],
    ["el", "Τι να γνωρίζω για προκαταβολή αγοράς ακινήτου;", "office-property-deposit-guide", "/blog/prokatavoli-agora-akinitou"],
    ["en", "What does the guide say about a deposit when buying property?", "office-property-deposit-guide", "/blog/prokatavoli-agora-akinitou"],
    ["de", "Was steht im Leitfaden über die Anzahlung beim Immobilienkauf?", "office-property-deposit-guide", "/blog/prokatavoli-agora-akinitou"],
  ]) {
    const sources = select(question, locale);
    const source = sources.find(({ id }) => id === expected);
    assert.ok(source, `${locale}: ${question}`);
    assert.equal(new URL(source.url).pathname, `/${locale}${path}`);
    assert.ok(isApprovedPublicChatSourceId(source.id));
  }
  assert.ok(select("Was muss ich beim Haus kaufen beachten?", "de").length > 0,
    "ordinary German house-purchase wording must reach the existing property knowledge");
});

test("the canonical purchase guide retains the exact current website paragraphs in every locale", () => {
  for (const [locale, question] of [
    ["el", "Τι αναφέρει ο οδηγός αγοράς ακινήτου;"],
    ["en", "What does the guide to buying property say?"],
    ["de", "Was steht im Leitfaden zum Immobilienkauf?"],
  ]) {
    const guide = select(question, locale).find(({ id }) => id === guideId);
    const page = PROPERTY_PURCHASE_GUIDES[locale];
    assert.ok(guide, locale);
    assert.equal(guide.title, page.title);
    assert.ok(guide.content.includes(page.excerpt));
    for (const section of page.sections) {
      assert.ok(guide.content.includes(section.title), `${locale}: ${section.title}`);
      assert.ok(guide.content.includes(section.text), `${locale}: complete qualifications stay with ${section.title}`);
    }
    assert.ok(!guide.content.includes(page.serviceCta));
    assert.match(guide.content, /όχι επίσημο κείμενο νόμου/u);
  }
  assert.ok(!APPROVED_OFFICE_ARTICLES.some(({ sourceId }) => sourceId === guideId),
    "the same guide cannot be supplied a second time from its old CMS body");
});

test("property projections omit intake CTAs and the unreviewed deposit-form legal assertion", () => {
  for (const locale of ["el", "en", "de"]) {
    const deposit = select("property purchase deposit προκαταβολή αγοράς ακινήτου", locale)
      .find(({ id }) => id === "office-property-deposit-guide");
    const page = PROPERTY_DEPOSIT_GUIDES[locale];
    assert.ok(deposit);
    assert.ok(deposit.content.includes(page.intro));
    assert.ok(deposit.content.includes(page.scenarios[0].paragraphs[1]), "the mortgage-discharge condition must remain");
    assert.ok(deposit.content.includes(page.scenarios[1].paragraphs[1]), "loan-delay/rejection qualifications must remain");
    assert.ok(!deposit.content.includes(page.contactText));
    assert.ok(!deposit.content.includes(page.contactLabel));
    assert.ok(!deposit.content.includes(page.scenarios[2].paragraphs[1]),
      "a specific notarial-form legal conclusion is outside this reviewed excerpt");
    const athens = select("property purchase Athens", locale).find(({ id }) => id === "office-property-athens");
    assert.ok(athens.content.includes(PROPERTY_ATHENS_PAGES[locale].intro));
    assert.ok(!athens.content.includes(PROPERTY_ATHENS_PAGES[locale].contact));
    const newBuild = select("new build property purchase", locale).find(({ id }) => id === "office-property-new-build");
    assert.ok(newBuild.content.includes(PROPERTY_NEW_BUILD_PAGES[locale].checks[0].text));
    assert.ok(!newBuild.content.includes(PROPERTY_NEW_BUILD_PAGES[locale].preparation));
    assert.doesNotMatch(`${deposit.content}\n${athens.content}\n${newBuild.content}`, /(?:\d+[.,]?\d*\s*(?:€|ευρώ|euros?)|100\s*%|σίγουρα θα|guaranteed outcome)/iu);
  }
});

test("unrelated questions and ambiguous deposits cannot load property sources", () => {
  for (const question of [
    "Πώς θα είναι ο καιρός στην Αθήνα;", "Πώς παίρνω διαζύγιο;", "Τι είναι ο νόμος Κατσέλη;",
    "Τι είναι η εγγύηση σε μίσθωση ακινήτου;", "Επιστρέφεται η προκαταβολή;",
    "What is a hotel deposit?", "What is a bail deposit?", "Anzahlung für ein Hotel",
    "Προκαταβολή μισθού", "Ενοίκιο διαμερίσματος στην Αθήνα",
  ]) assert.deepEqual(select(question), [], question);
});

test("selected property sources preserve complete Unicode and the shared context budget", () => {
  assert.equal(MAX_PROPERTY_SOURCES, 2);
  assert.equal(MAX_PROPERTY_CONTEXT_BYTES, 10000);
  for (const locale of ["el", "en", "de"]) {
    for (const question of [
      "οδηγός αγοράς ακινήτου", "αγορά ακινήτου Αθήνα νεόδμητο προκαταβολή οδηγός",
      "new build property purchase guide deposit Athens title checks",
      "Immobilienkauf Neubau Anzahlung Leitfaden Athen",
    ]) {
      const sources = select(question, locale);
      assert.ok(sources.length > 0 && sources.length <= MAX_PROPERTY_SOURCES, question);
      assert.equal(new Set(sources.map(({ id }) => id)).size, sources.length);
      assert.ok(propertyContextBytes(sources) <= MAX_PROPERTY_CONTEXT_BYTES);
      assert.ok(Object.isFrozen(sources));
      for (const source of sources) {
        assert.ok(Object.isFrozen(source));
        assert.deepEqual(Object.keys(source), ["id", "title", "url", "content"]);
        assert.doesNotMatch(source.content, /[\uD800-\uDFFF]/u);
      }
    }
  }
  const probe = [{ id: "x<&", title: "Ελλάδα", url: "https://example.com/", content: "A&B <C>" }];
  const serialized = JSON.stringify(probe.map(({ id, title, content }) => ({ id, title, content })))
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  assert.equal(propertyContextBytes(probe), Buffer.byteLength(serialized) + Buffer.byteLength(JSON.stringify(["x<&"])));
});

test("property sources retain the independent authorization projection and cannot impersonate a context", () => {
  const sources = select("Τι αναφέρει ο οδηγός αγοράς ακινήτου;");
  const authorized = readAuthorizedChatSources(contextFor(sources));
  assert.equal(authorized.length, sources.length);
  assert.ok(!JSON.stringify(authorized).includes("PRIVATE_PROPERTY_NOTE"));
  assert.throws(() => prepareChatModelRequest(input("Αγορά ακινήτου"), sources), ChatAccessError);
  assert.throws(() => { authorized[0].content = "FORGED_CONTENT"; }, TypeError);
});

test("the real knowledge pipeline combines property and official context within twelve evidence sources", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ result: APPROVED_OFFICE_ARTICLES.map((binding) => ({
    _id: binding.documentId, slug: binding.slug, authorId: binding.authorId,
    title: "Ακίνητο και αγορά", excerpt: "Ενημερωτικό άρθρο.",
    content: "Το γραφείο περιγράφει γενικά την αγορά ακινήτου.", publishedAt: "2026-06-01T12:00:00Z",
  })) });
  try {
    let sawFullSourceEnvelope = false;
    for (const [locale, question] of [
      ["el", "Τι είναι ο ψηφιακός φάκελος μεταβίβασης για αγορά ακινήτου;"],
      ["el", "Αγορά ακινήτου στην Αθήνα, προκαταβολή, Κτηματολόγιο, μίσθωση και συναινετικό διαζύγιο, φόρος κληρονομιάς"],
      ["en", "Property purchase guide: Athens, new-build property, deposit, title checks, land registry, tenancy, divorce, inheritance tax"],
      ["de", "Immobilienkauf Leitfaden: Athen, Neubau, Anzahlung, Eigentumstitel, Grundbuch, Miete, Scheidung, Erbschaftsteuer"],
    ]) {
      const baseline = prepareChatModelRequest(input(question, locale), getStaticPublicChatContext(principal, locale, question));
      const sources = readAuthorizedChatSources(await getPublicChatContext(principal, locale, question));
      assert.ok(sources.length <= 12);
      sawFullSourceEnvelope ||= sources.length === 12;
      assert.equal(new Set(sources.map(({ id }) => id)).size, sources.length);
      assert.ok(sources.some(({ id }) => id.startsWith("office-property-")));
      if (question.includes("ψηφιακός")) assert.ok(sources.some(({ id }) => id === "legal-property-transfer"));
      const final = prepareChatModelRequest(input(question, locale), contextFor(sources));
      assert.ok(final.reservedTokens <= MAX_CHAT_RESERVED_TOKENS);
      assert.ok(final.reservedTokens <= Math.min(MAX_CHAT_RESERVED_TOKENS, baseline.reservedTokens + 24000),
        `${locale}: live sources must fit the static-plus-article reservation before any provider request`);
    }
    assert.ok(sawFullSourceEnvelope, "exercise the full twelve-source envelope rather than only small contexts");
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("canonical guide evidence is accepted only from its authorized current source", () => {
  const sources = select("Τι αναφέρει ο οδηγός αγοράς ακινήτου;");
  const quote = PROPERTY_PURCHASE_GUIDES.el.sections[1].text;
  const reply = { kind: "grounded", answer: quote, sourceIds: [guideId], evidence: [{ sourceId: guideId, quote }], suggestContact: false };
  const accepted = parseChatReply(reply, sources, "el");
  assert.equal(accepted.answer, quote);
  assert.equal(new URL(accepted.sources[0].url).pathname, "/el/blog/agora-akiniton-vimata");
  assert.throws(() => parseChatReply({ ...reply, evidence: [{ sourceId: guideId, quote: "STALE_CMS_PROPERTY_GUIDE παλιότερη εκδοχή χωρίς εγκεκριμένη τεκμηρίωση." }] }, sources, "el"));
});

test("property references remain data and do not add tools or booking capabilities", async () => {
  const question = "Τι αναφέρει ο οδηγός αγοράς ακινήτου;";
  const context = getStaticPublicChatContext(principal, "el", question);
  let sent;
  await generatePreparedChatReply(prepareChatModelRequest(input(question), context), {
    apiKey: "test-only-placeholder", fetcher: async (_url, options) => {
      sent = JSON.parse(options.body);
      return Response.json({ status: "completed", output: [{ type: "message", content: [{
        type: "output_text", text: JSON.stringify({ kind: "handoff", answer: "", sourceIds: [], evidence: [], suggestContact: true }),
      }] }] });
    },
  });
  assert.ok(sent);
  assert.deepEqual(sent.tools, []);
  assert.equal(sent.tool_choice, "none");
  assert.equal(sent.store, false);
  assert.ok(sent.text.format.schema.properties.sourceIds.items.enum.includes(guideId));
  assert.ok(sent.input[0].content.includes(guideId));
  assert.ok(!sent.instructions.includes(PROPERTY_PURCHASE_GUIDES.el.excerpt));
  for (const question of [
    "Κλείσε μου ραντεβού για αγορά ακινήτου.",
    "Υπόβαλε αίτημα αγοράς ακινήτου για μένα.",
  ]) {
    let calls = 0;
    const reply = await generatePreparedChatReply(prepareChatModelRequest(input(question),
      getStaticPublicChatContext(principal, "el", question)), {
      apiKey: "test-only-placeholder", fetcher: async () => { calls++; throw new Error("must not call provider"); },
    });
    assert.equal(calls, 0, question);
    assert.equal(reply.suggestContact, true);
    assert.match(reply.answer, /Δεν μπορώ/u);
    assert.match(reply.answer, /σελίδ.*επικοινων/u);
  }
});
