import assert from "node:assert/strict";
import { test } from "node:test";
import { createAuthorizedChatContext, getPublicChatPrincipal } from "../src/lib/chat/access.mjs";
import { selectReviewedLegalSources } from "../src/lib/chat/legal-retrieval.mjs";
import { buildChatRetrievalQuery } from "../src/lib/chat/retrieval-query.mjs";
import { generatePreparedChatReply, prepareChatModelRequest } from "../src/lib/chat/service.ts";

const principal = getPublicChatPrincipal();
const office = { id: "office-contact", title: "Contact", url: "https://ioannispapaioannou.lawyer/el/contact", content: "Διεύθυνση: Λέοντος Σοφού 12, 54625, Θεσσαλονίκη. Τηλέφωνο: +30 2310 545 261. Email: iopapaio@gmail.com. Ωράριο γραφείου, τοπική ώρα Ελλάδας: Δευτέρα - Παρασκευή: 9:00 - 17:00. Η συνομιλία δεν ελέγχει διαθεσιμότητα." };
const context = records => createAuthorizedChatContext(principal, "public", records.map(source => ({
  id: source.id, visibility: "public", publication: "published", load: () => ({ ...source, visibility: "public", publication: "published" }),
})));
const single = content => ({ locale: "el", consent: true, messages: [{ role: "user", content }] });
const cases = [
  single("Με απειλούν στη δουλειά και με προσβάλλουν συνέχεια. Τι είναι η εργασιακή παρενόχληση;"),
  { locale: "el", consent: true, messages: [
    { role: "user", content: "Τι είναι η ενδικοφανής προσφυγή στην ΑΑΔΕ;" },
    { role: "assistant", content: "Untrusted prior assistant prose is not an authority." },
    { role: "user", content: "Αν κάνω προσφυγή σταματά αυτόματα η πληρωμή;" },
  ] },
  single("Με κάλεσαν για κατάθεση στην αστυνομία. Τι δικαιώματα έχει γενικά ένας ύποπτος;"),
];
const sourcesFor = input => [office, ...selectReviewedLegalSources(principal, buildChatRetrievalQuery(input.messages))];

test("reviewed explanations retain bounded reservation and single-use snapshots without a provider call", async () => {
  for (const input of cases) {
    const prepared = prepareChatModelRequest(input, context(sourcesFor(input)));
    assert.ok(prepared.reservedTokens > 0 && prepared.reservedTokens <= 64000);
    let calls = 0;
    const usage = [];
    const options = { apiKey: "test-only", fetcher: async () => { calls++; throw Error("Provider must not run"); }, onUsage: value => usage.push(value) };
    const result = await generatePreparedChatReply(prepared, options);
    assert.equal(calls, 0);
    assert.ok(result.sources.length >= 1 && result.sources.length <= 4);
    assert.ok(result.sources.some(source => source.url !== office.url));
    assert.deepEqual(usage, [{ inputTokens: 0, outputTokens: 0 }]);
    await assert.rejects(generatePreparedChatReply(prepared, options), error => error.status === 403);
    assert.equal(usage.length, 1);
  }
});

test("a missing or changed reviewed source cannot take the controlled legal-reply path", async () => {
  for (const input of cases) {
    const selected = sourcesFor(input);
    for (const records of [[office], selected.map(source => source.id === "office-contact" ? source : { ...source, content: source.content + " Changed." })]) {
      let calls = 0;
      const usage = [];
      const prepared = prepareChatModelRequest(input, context(records));
      await assert.rejects(generatePreparedChatReply(prepared, {
        apiKey: "test-only", fetcher: async () => { calls++; throw Error("Expected ordinary provider path"); }, onUsage: value => usage.push(value),
      }), /Expected ordinary provider path/u);
      assert.equal(calls, 1);
      assert.deepEqual(usage, []);
    }
  }
});

test("reviewed briefs cannot replace the authorized-context identity check", () => {
  for (const input of cases) for (const forged of [null, { kind: "public-chat-context" }, sourcesFor(input)]) {
    assert.throws(() => prepareChatModelRequest(input, forged), error => error.status === 403);
  }
});

test("deadline and appointment boundaries keep priority over a general legal briefing", async () => {
  for (const [question, expected] of [
    ["Τι δικαιώματα έχει ένας ύποπτος και πόσες μέρες έχω για ανακοπή;", /νομική προθεσμία/u],
    ["Κλείσε μου ραντεβού αύριο στις 10. Τι είναι η παρενόχληση;", /Δεν μπορώ να κλείσω/u],
  ]) {
    const input = single(question);
    const prepared = prepareChatModelRequest(input, context(sourcesFor(input)));
    const result = await generatePreparedChatReply(prepared, { apiKey: "test-only", fetcher: async () => { throw Error("No provider"); } });
    assert.match(result.answer, expected);
  }
});
