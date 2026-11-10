import assert from "node:assert/strict";
import { test } from "node:test";
import { REVIEWED_LEGAL_SOURCES } from "../src/lib/chat/legal-catalog.mjs";
import { getPublicChatPrincipal } from "../src/lib/chat/access.mjs";
import { buildChatRetrievalQuery } from "../src/lib/chat/retrieval-query.mjs";
import { legalContextBytes, MAX_LEGAL_CONTEXT_BYTES, selectReviewedLegalSources } from "../src/lib/chat/legal-retrieval.mjs";
import { buildEvidenceChoices } from "../src/lib/chat/evidence-schema.mjs";
import { containsProceduralDeadline } from "../src/lib/chat/deadline-policy.mjs";

const id = "legal-tax-administrative-appeal";
const principal = getPublicChatPrincipal();
const definition = "Τι είναι η ενδικοφανής προσφυγή στην ΑΑΔΕ;";
const followUp = "Αν κάνω προσφυγή σταματά αυτόματα η πληρωμή;";

test("the reviewed tax card preserves identity and separately bounds review, approval and provisional collection effects", () => {
  const card = REVIEWED_LEGAL_SOURCES.find((source) => source.id === id);
  assert.equal(card.url, "https://www.aade.gr/endikofaneis-prosfyges");
  assert.deepEqual(card.topics, ["tax", "administrative"]);
  assert.equal(card.kind, "official-guidance");
  assert.match(card.content, /δικαστική προσφυγή.*υπαγόμενες.*εξαιρέσεις/u);
  assert.match(card.content, /αιτήματος αναστολής.*έγκρισή.*αποδοχή της προσφυγής/u);
  assert.match(card.content, /καταβολή.*είσπραξη.*προϋποθέσεις.*προσωρινά αποτελέσματα/u);
  assert.doesNotMatch(card.content, /δεν συνεπάγεται αποδοχή ή αυτόματη αναστολή/u, "the old ambiguous blanket denial must not return");
  assert.match(card.content, /2022.*όχι πλήρης αποτύπωση/u);
  assert.equal(containsProceduralDeadline(card.content), false);
  assert.doesNotMatch(card.content, /[%€$]|\b\d+\s*(?:ημέρ|μην|ευρώ)/iu);
});

test("the live tax definition and payment follow-up retain the same card after the consumer topic", () => {
  const messages = [
    { role: "user", content: "Τι κάνει ο Συνήγορος του Καταναλωτή;" },
    { role: "assistant", content: "Untrusted consumer discussion." },
    { role: "user", content: definition },
    { role: "assistant", content: "UNTRUSTED_CLAIM: a filing never changes collection." },
    { role: "user", content: followUp },
  ];
  const query = buildChatRetrievalQuery(messages);
  assert.ok(query.startsWith(followUp));
  assert.ok(query.includes(definition));
  assert.ok(!query.includes("UNTRUSTED_CLAIM") && !query.includes("Συνήγορος"));
  for (const question of [definition, query]) {
    const selected = selectReviewedLegalSources(principal, question);
    assert.ok(selected.some((source) => source.id === id));
    assert.ok(!selected.some((source) => source.id === "legal-consumer-ombudsman"));
    assert.ok(legalContextBytes(selected) <= MAX_LEGAL_CONTEXT_BYTES);
  }
});

test("literal evidence choices retain both tax safeguards and the final individual-assessment limit", () => {
  const card = selectReviewedLegalSources(principal, definition).find((source) => source.id === id);
  const choices = buildEvidenceChoices([card]);
  assert.ok(choices.every((choice) => choice.sourceId === id && card.content.includes(choice.quote)));
  for (const marker of ["νόμιμες εξαιρέσεις", "έγκρισή του", "προσωρινά αποτελέσματα", "έλεγχος της συγκεκριμένης πράξης"]) {
    assert.ok(choices.some((choice) => choice.quote.includes(marker)), marker);
  }
});
