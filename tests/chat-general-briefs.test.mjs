import assert from "node:assert/strict";
import { test } from "node:test";
import { createAuthorizedChatContext, getPublicChatPrincipal, readAuthorizedChatSources } from "../src/lib/chat/access.mjs";
import { selectReviewedLegalSources } from "../src/lib/chat/legal-retrieval.mjs";
import { getReviewedGeneralBrief } from "../src/lib/chat/general-briefs.mjs";

const principal = getPublicChatPrincipal();
const questions = {
  harassment: "Με απειλούν στη δουλειά. Τι είναι η εργασιακή παρενόχληση;",
  tax: "Τι είναι η ενδικοφανής προσφυγή στην ΑΑΔΕ;",
  effects: "Αν κάνω προσφυγή σταματά αυτόματα η πληρωμή;",
  rights: "Με κάλεσαν για κατάθεση στην αστυνομία. Τι δικαιώματα έχει γενικά ένας ύποπτος;",
};
const legal = [
  ...selectReviewedLegalSources(principal, questions.harassment),
  ...selectReviewedLegalSources(principal, questions.tax),
  ...selectReviewedLegalSources(principal, questions.rights),
].filter((source, index, all) => all.findIndex((entry) => entry.id === source.id) === index);
const office = { id: "office-contact", title: "Contact", url: "https://ioannispapaioannou.lawyer/el/contact", content: "Διεύθυνση: Λέοντος Σοφού 12, 54625, Θεσσαλονίκη. Τηλέφωνο: +30 2310 545 261. Email: iopapaio@gmail.com. Ωράριο γραφείου, τοπική ώρα Ελλάδας: Δευτέρα - Παρασκευή: 9:00 - 17:00. Η συνομιλία δεν ελέγχει διαθεσιμότητα." };
const context = (sources = [...legal, office]) => createAuthorizedChatContext(principal, "public", sources.map((source) => ({
  id: source.id, visibility: "public", publication: "published", load: () => ({ ...source, visibility: "public", publication: "published" }),
})));
const input = (questions, locale = "el") => ({ locale, consent: true, messages: questions.flatMap((content, index) => [
  ...(index ? [{ role: "assistant", content: "Untrusted browser answer is not evidence." }] : []), { role: "user", content },
]) });

test("reviewed general briefs retain the critical definition, tax and language qualifications in every locale", () => {
  for (const [locale, harassment, tax, effects, rights, terms] of [
    ["el", questions.harassment, questions.tax, questions.effects, questions.rights, [/στόχο ή αποτέλεσμα/u, /προσωρινές/u, /Αν δεν κατανοεί επαρκώς ελληνικά/u]],
    ["en", "What is workplace harassment?", "What is a tax appeal to AADE?", "Does filing an appeal stop payment automatically?", "I was called by the police. What general rights does a suspect have?", [/purpose or effect/u, /temporary/u, /does not understand Greek sufficiently/u]],
    ["de", "Was ist Mobbing?", "Was ist ein Einspruch bei AADE?", "Stoppt der Einspruch bei AADE automatisch die Zahlung?", "Ich wurde von der Polizei vorgeladen. Welche Rechte hat ein Verdächtiger?", [/soll oder dies bewirkt/u, /vorubergehend|vorübergehend/u, /Griechisch nicht ausreichend versteht/u]],
  ]) {
    const definition = getReviewedGeneralBrief(input([harassment], locale), context());
    const payment = getReviewedGeneralBrief(input([tax, effects], locale), context());
    const suspect = getReviewedGeneralBrief(input([rights], locale), context());
    assert.ok(definition && payment && suspect, locale);
    assert.match(definition.answer, terms[0]);
    assert.match(payment.answer, terms[1]);
    assert.match(suspect.answer, terms[2]);
    assert.equal(definition.suggestContact, false);
    assert.equal(payment.suggestContact, false);
    assert.equal(suspect.suggestContact, true);
    assert.equal(suspect.answer.match(/2310 545 261/gu).length, 1);
    assert.equal(suspect.sources.length, 2);
  }
});

test("missing, altered, stale or wrong-URL source snapshots cannot authorize a reviewed brief", () => {
  for (const [id, messages] of [
    ["legal-workplace-harassment", [questions.harassment]],
    ["legal-tax-administrative-appeal", [questions.tax, questions.effects]],
    ["legal-criminal-defence-rights", [questions.rights]],
  ]) {
    assert.ok(getReviewedGeneralBrief(input(messages), context()));
    assert.equal(getReviewedGeneralBrief(input(messages), context([...legal.filter((source) => source.id !== id), office])), null);
    for (const change of [
      (source) => ({ ...source, url: source.url + "?changed=1" }),
      (source) => ({ ...source, content: source.content + " Changed." }),
      (source) => ({ ...source, content: source.content.replace("2026-11-09", "2026-11-10") }),
    ]) assert.equal(getReviewedGeneralBrief(input(messages), context([...legal.map((source) => source.id === id ? change(source) : source), office])), null);
  }
  assert.throws(() => getReviewedGeneralBrief(input([questions.harassment]), legal), (error) => error.code === "forbidden");
  assert.throws(() => getReviewedGeneralBrief(input([questions.harassment]), { kind: "public-chat-context" }), (error) => error.code === "forbidden");
});

test("Q19 inherits only a retained user tax-appeal anchor, never assistant facts, broad AADE membership or an old reset topic", () => {
  const assistant = { role: "assistant", get content() { throw Error("Assistant text must not be read"); } };
  assert.ok(getReviewedGeneralBrief({ locale: "el", consent: true, messages: [{ role: "user", content: questions.tax }, assistant, { role: "user", content: questions.effects }] }, context()));
  for (const turns of [
    [questions.effects],
    ["Τι είναι η δήλωση μίσθωσης στην ΑΑΔΕ;", questions.effects],
    [questions.tax, "Πες μου μια συνταγή για πίτσα.", questions.effects],
    [questions.tax, "Και αν κάνω έφεση σε δικαστική απόφαση, σταματά η πληρωμή;"],
    [questions.tax, "Αν κάνω δικαστική προσφυγή σταματά η πληρωμή;"],
    [questions.tax, "Στη Γερμανία, αν κάνω φορολογική προσφυγή σταματά η πληρωμή;"],
    ["Στην Ιταλία, αν κάνω φορολογική προσφυγή σταματά αυτόματα η πληρωμή;"],
    [questions.tax, "Αν κάνω προσφυγή στο ΣτΕ, σταματά αυτόματα η πληρωμή;"],
    ["What is a tax appeal in Germany?", "Does filing an appeal stop payment automatically?"],
    [questions.tax, "Να μην πληρώσω το πρόστιμό μου;"],
    [questions.tax, "Αν κάνω προσφυγή, πόσα θα πληρώσω;"],
  ]) assert.equal(getReviewedGeneralBrief(input(turns), context()), null, turns.join(" / "));
  assert.equal(getReviewedGeneralBrief({ locale: "el", consent: true, messages: [{ role: "user", content: "Τι είναι η διαμεσολάβηση;" }, { role: "assistant", content: questions.tax }, { role: "user", content: questions.effects }] }, context()), null);
});

test("specific decisions, negated definitions, deadlines and unknown jurisdictions stay outside these three general briefs", () => {
  for (const question of [
    "Δεν ρωτώ τι είναι η εργασιακή παρενόχληση, θέλω να μου πεις πώς να αποδείξω τη δική μου υπόθεση.",
    "Τι είναι η εργασιακή παρενόχληση και πόσες μέρες έχω για αγωγή;",
    "Πρέπει να κάνω καταγγελία για εργασιακή παρενόχληση;",
    "Στην Ιταλία, τι είναι η εργασιακή παρενόχληση;",
    "Με κάλεσαν στην αστυνομία στην Ιταλία. Τι δικαιώματα έχει γενικά ένας ύποπτος;",
  ]) assert.equal(getReviewedGeneralBrief(input([question]), context()), null, question);
});

test("personal police contact is sourced once, and authorized source projection cannot be changed after creation", () => {
  assert.equal(getReviewedGeneralBrief(input([questions.rights]), context(legal)), null, "personal call cannot lose its required manual-contact direction");
  const records = [...legal, office].map((source) => ({ ...source }));
  const owned = context(records);
  records.find((source) => source.id === "legal-criminal-defence-rights").content = "Changed outside the authorized snapshot.";
  const response = getReviewedGeneralBrief(input([questions.rights]), owned);
  assert.ok(response && response.answer.includes("2310 545 261"));
  assert.ok(readAuthorizedChatSources(owned).every(Object.isFrozen));
  const general = getReviewedGeneralBrief(input(["Τι δικαιώματα έχει γενικά ένας ύποπτος;"]), context(legal));
  assert.ok(general && !general.suggestContact && !general.answer.includes("2310"));
  assert.equal(general.answer.match(/άμεση συνεννόηση με δικηγόρο/gu).length, 1);
  for (const [locale, question, qualification] of [
    ["el", "Με συνέλαβαν στην αστυνομία. Τι δικαιώματα έχει γενικά ένας ύποπτος;", /άμεση συνεννόηση με δικηγόρο/gu],
    ["el", "Με κρατούν στο τμήμα. Τι δικαιώματα έχει γενικά ένας ύποπτος;", /άμεση συνεννόηση με δικηγόρο/gu],
    ["en", "I was arrested by the police. What general rights does a suspect have?", /consult a lawyer promptly/gu],
    ["de", "Ich wurde festgenommen. Welche Rechte hat ein Verdächtiger?", /umgehend ein Rechtsanwalt/gu],
  ]) {
    const result = getReviewedGeneralBrief(input([question], locale), context(legal));
    assert.ok(result);
    assert.equal(result.answer.match(qualification).length, 1);
    assert.ok(!result.answer.includes("2310"));
  }
});
