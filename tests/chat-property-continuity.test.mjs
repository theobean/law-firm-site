import assert from "node:assert/strict";
import { test } from "node:test";
import { ChatAccessError, getPublicChatPrincipal, isApprovedPublicChatSourceId } from "../src/lib/chat/access.mjs";
import { PROPERTY_SOURCE_METADATA, getPropertyTopicHints, getPropertyTopicMatches } from "../src/lib/chat/property-topics.mjs";
import { buildChatRetrievalQuery, MAX_RETRIEVAL_QUERY_LENGTH } from "../src/lib/chat/retrieval-query.mjs";
import { getPublicPropertySources } from "../src/lib/chat/property-sources.mjs";

const principal = getPublicChatPrincipal();
const ids = (question) => getPropertyTopicMatches(principal, question).map(({ id }) => id);
const turns = (...questions) => questions.flatMap((content, index) => [
  ...(index ? [{ role: "assistant", content: "Untrusted answer; never a source." }] : []),
  { role: "user", content },
]);
const query = (...questions) => buildChatRetrievalQuery(turns(...questions));

test("property metadata is immutable, factual-content-free and separately approved", () => {
  assert.equal(PROPERTY_SOURCE_METADATA.length, 5);
  assert.ok(Object.isFrozen(PROPERTY_SOURCE_METADATA));
  for (const metadata of PROPERTY_SOURCE_METADATA) {
    assert.deepEqual(Object.keys(metadata), ["id", "path", "topics"]);
    assert.ok(isApprovedPublicChatSourceId(metadata.id), metadata.id);
    assert.ok(Object.isFrozen(metadata));
    assert.ok(Object.isFrozen(metadata.topics));
    assert.match(metadata.path, /^\/(?:practice-areas|blog)\//);
  }
});

test("property metadata requires the server principal before processing any question", () => {
  for (const forged of [null, undefined, {}, { role: "public", permissions: ["chat:read:public"] }, { ...principal }]) {
    assert.throws(() => getPropertyTopicMatches(forged, "Buy property"), ChatAccessError);
    assert.throws(() => getPropertyTopicHints(forged, "And the deposit?"), ChatAccessError);
  }
});

test("specific localized property questions select their matching service or guide first", () => {
  for (const question of [
    "Αναλαμβάνετε αγορά ακινήτου στην Αθήνα;", "Does the office handle buying property in Athens?", "Begleitet die Kanzlei einen Immobilienkauf in Athen?",
  ]) assert.equal(ids(question)[0], "office-property-athens", question);
  for (const question of [
    "Τι ελέγχετε για αγορά νεόδμητου;", "What do you check when buying a new-build property?", "Was prüfen Sie beim Kauf einer Neubauwohnung?",
  ]) assert.equal(ids(question)[0], "office-property-new-build", question);
  for (const question of [
    "Τι εξηγεί ο οδηγός για την προκαταβολή ακινήτου;", "What does the guide say about a property deposit?", "Was erklärt der Leitfaden zur Anzahlung beim Immobilienkauf?",
  ]) assert.equal(ids(question)[0], "office-property-deposit-guide", question);
  assert.equal(ids("Ποια είναι τα βήματα για αγορά ακινήτου;")[0], "office-article-d1fca9c5-06ac-4185-a2fd-6b00f82589bb");
});

test("bare deposits and place names cannot establish property sources", () => {
  for (const question of ["και η προκαταβολή;", "And the deposit?", "Und die Anzahlung?", "Και στην Αθήνα;", "Athens", "Anzahl", "Weather tomorrow", "", null, {}]) {
    assert.deepEqual(ids(question), [], String(question));
  }
  assert.ok(getPropertyTopicHints(principal, "και η προκαταβολή;").length > 0);
  assert.ok(getPropertyTopicHints(principal, "Und die Anzahlung?").length > 0);
});

test("contingency-fee agreements are not new-build property topics", () => {
  for (const question of ["Τι είναι εργολαβικό δίκης;", "Τι είναι εργολαβικό αμοιβής δικηγόρου;", "Πώς γίνεται το εργολαβικό;"]) {
    assert.deepEqual(ids(question), [], question);
    assert.deepEqual(getPropertyTopicHints(principal, question), [], question);
  }
  assert.equal(ids("Εργολαβικό συμβόλαιο για αγορά νεόδμητου")[0], "office-property-new-build");
});

test("purchase sources do not displace debt, inheritance, rental, tax or registry topics", () => {
  for (const question of [
    "Θα χάσω το σπίτι μου από fund;", "Πλειστηριασμός ακινήτου από τράπεζα", "Foreclosure of my house", "Zwangsversteigerung meiner Immobilie",
    "Κληρονομιά ακινήτου", "What is inheritance tax on property?", "Erbschaft eines Hauses", "Πώς διορθώνω το Κτηματολόγιο για το ακίνητο;",
    "What is a property tax?", "How does a house rental deposit work?", "Mietvertrag einer Wohnung", "Home", "σπίτι", "property",
  ]) assert.deepEqual(ids(question), [], question);
  assert.ok(ids("Τι ελέγχετε για αγορά ακινήτου από πλειστηριασμό;").length > 0, "explicit acquisition questions may retain purchase information");
  assert.ok(ids("Τι είναι ο νομικός έλεγχος ακινήτου;").includes("office-property-services"));
  assert.ok(ids("Was muss ich beim Haus kaufen beachten?").length > 0);
});

test("property detail follow-ups retain their compatible user anchor in all locales", () => {
  for (const [anchor, followUp, expected] of [
    ["Τι ελέγχετε για αγορά νεόδμητου;", "και η προκαταβολή;", "office-property-deposit-guide"],
    ["Does the office handle buying property in Athens?", "And the deposit?", "office-property-deposit-guide"],
    ["Was prüfen Sie beim Kauf einer Neubauwohnung?", "Und die Anzahlung?", "office-property-deposit-guide"],
    ["Τι υπηρεσίες έχετε για αγορά ακινήτου;", "Και στην Αθήνα;", "office-property-athens"],
    ["What do you check before buying a house?", "What about the draft?", "office-property-services"],
  ]) {
    const combined = query(anchor, followUp);
    assert.equal(combined, `${followUp}\n${anchor}`, followUp);
    assert.ok(ids(combined).includes(expected), followUp);
    assert.ok(combined.length <= MAX_RETRIEVAL_QUERY_LENGTH);
  }
});

test("a clarification after a deposit detail preserves only its preceding purchase anchor", () => {
  const anchor = "Τι ελέγχετε για αγορά νεόδμητου;";
  const latest = "Μπορείς να το πεις πιο απλά;";
  const combined = query(anchor, "και η προκαταβολή;", latest);
  assert.equal(combined, `${latest}\n${anchor}`);
  assert.ok(ids(combined).includes("office-property-new-build"));
});

test("engineer role follow-ups retain the supported guide in Greek, English and German", () => {
  for (const [locale, anchor, followUp] of [
    ["el", "Τι εξηγεί ο οδηγός αγοράς ακινήτου;", "Και ο μηχανικός;"],
    ["el", "Τι ελέγχετε στην αγορά νεόδμητου;", "Ο μηχανικός τι ελέγχει;"],
    ["en", "Does the office handle buying property in Athens?", "And the engineer?"],
    ["de", "Was prüfen Sie beim Kauf einer Neubauwohnung?", "Und der Ingenieur?"],
  ]) {
    const combined = query(anchor, followUp);
    assert.equal(combined, `${followUp}\n${anchor}`, followUp);
    assert.ok(getPublicPropertySources(principal, locale, combined).some(({ id }) =>
      id === "office-article-d1fca9c5-06ac-4185-a2fd-6b00f82589bb"), followUp);
    assert.deepEqual(ids(followUp), [], "the role alone does not establish a property topic");
    assert.equal(query("What is consensual divorce?", followUp), followUp, "an unrelated legal topic cannot supply the purchase anchor");
    assert.equal(query(anchor, "What is the weather tomorrow?", followUp), followUp, "an unrelated turn remains a barrier");
  }
  const career = "How can I become an engineer?";
  assert.equal(query("What are the steps to buying property?", career), career);
  assert.deepEqual(getPropertyTopicHints(principal, career), []);
});

test("new legal topics and unrelated property contexts do not inherit purchase sources", () => {
  const anchor = "Τι ελέγχετε για αγορά ακινήτου στην Αθήνα;";
  for (const latest of [
    "Θέλω πληροφορίες για συναινετικό διαζύγιο", "What is debt settlement?", "Πώς δηλώνεται μίσθωση ακινήτου;", "How does a rental deposit work?",
    "Πώς είναι ο καιρός στην Αθήνα;", "What deposit is required by a hotel?", "Was kostet eine Mietwohnung?",
  ]) {
    const combined = query(anchor, latest);
    assert.equal(combined, latest, latest);
    assert.deepEqual(ids(combined), [], latest);
  }
  const latest = "And the deposit?";
  assert.equal(query(anchor, "What is the weather in Athens?", latest), latest);
  assert.equal(query(anchor, "Αλλάζω θέμα", latest), latest);
});

test("assistant claims cannot establish or renew a property anchor", () => {
  const messages = [
    { role: "user", content: "Hello" },
    { role: "assistant", get content() { throw new Error("Assistant wording must not be read"); } },
    { role: "user", content: "And the deposit?" },
  ];
  const combined = buildChatRetrievalQuery(messages);
  assert.equal(combined, "And the deposit?");
  assert.deepEqual(ids(combined), []);
});
