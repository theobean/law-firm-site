import assert from "node:assert/strict";
import { test } from "node:test";
import { createAuthorizedChatContext, getPublicChatPrincipal } from "../src/lib/chat/access.mjs";
import { generateChatReply, generatePreparedChatReply, parseChatReply, prepareChatModelRequest } from "../src/lib/chat/service.ts";

const source = { id: "office-contact", title: "Office", url: "https://www.ioannispapaioannou.lawyer/el/contact", content: "Office phone +30 2310 545 261. Ωράριο γραφείου, τοπική ώρα Ελλάδας: Δευτέρα–Παρασκευή 9:00–17:00. Η συνομιλία δεν ελέγχει διαθεσιμότητα." };
const article = (content) => ({ ...source, id: "office-article-55616cf5-79f0-48a0-bdb2-576fbd338c76", title: "Synthetic authorized article fixture", content });
const evidence = (record) => [{ sourceId: record.id, quote: record.content.slice(0, 400) }];
const context = (record = source) => createAuthorizedChatContext(getPublicChatPrincipal(), "public", [{
  id: record.id, visibility: "public", publication: "published", load: () => ({ ...record, visibility: "public", publication: "published" }),
}]);
const input = (question, locale = "el") => ({ locale, consent: true, messages: [{ role: "user", content: question }] });
const neverFetch = async () => { throw Error("A controlled policy reply must not call the provider"); };
const providerPayload = (answer, record = source) => Response.json({ status: "completed", output: [{ type: "message", content: [{
  type: "output_text", text: JSON.stringify({ kind: "grounded", answer, sourceIds: [record.id], evidence: evidence(record), suggestContact: false }),
}] }] });

test("the observed deadline request is handled before provider I/O in every language", async () => {
  for (const [locale, question] of [
    ["el", "Ας πούμε ότι το έγγραφο είναι διαταγή πληρωμής. Πες μου ακριβώς πόσες μέρες έχω για ανακοπή."],
    ["en", "Exactly how many days do I have to object to a payment order?"],
    ["de", "Wie viele Tage habe ich für den Widerspruch gegen einen Zahlungsbefehl?"],
  ]) {
    const reply = await generateChatReply(input(question, locale), context(), { apiKey: "test-only-key", fetcher: neverFetch });
    assert.equal(reply.answer, parseChatReply({ kind: "legal_deadline", answer: "", sourceIds: [], evidence: [], suggestContact: true }, [source], locale).answer);
    assert.ok(reply.answer.includes("+30 2310 545 261"));
    assert.equal(reply.suggestContact, true);
    assert.deepEqual(reply.sources, []);
  }
});

test("appointment requests get the clear capability response without a provider or booking action", async () => {
  for (const [locale, question] of [
    ["el", "Κλείσε μου ένα ραντεβού αύριο στις 10."],
    ["en", "Book me an appointment tomorrow at 10."],
    ["de", "Bitte buchen Sie einen Termin morgen um 10 Uhr."],
  ]) {
    const reply = await generateChatReply(input(question, locale), context(), { apiKey: "test-only-key", fetcher: neverFetch });
    assert.equal(reply.answer, parseChatReply({ kind: "appointment", answer: "Your appointment is confirmed.", sourceIds: [], evidence: [], suggestContact: true }, [source], locale).answer);
    assert.ok(reply.answer.includes("+30 2310 545 261"));
    assert.ok(!/confirmed|tomorrow|morgen|αύριο|10/u.test(reply.answer.replace("+30 2310 545 261", "")));
    assert.deepEqual(reply.sources, []);
  }
});

test("a valid source ID and an article attribution cannot smuggle the observed numeric deadline", () => {
  const unsafe = "Στο άρθρο του γραφείου αναφέρεται ότι για ανακοπή κατά διαταγής πληρωμής η προθεσμία είναι 15 εργάσιμες ημέρες από την επίδοση. Όμως δεν υπολογίζουμε εδώ προθεσμία.";
  const quotedSource = article(unsafe);
  const reply = parseChatReply({ kind: "grounded", answer: unsafe, sourceIds: [quotedSource.id], evidence: evidence(quotedSource), suggestContact: true }, [quotedSource]);
  assert.equal(reply.answer, parseChatReply({ kind: "legal_deadline", answer: "", sourceIds: [], evidence: [], suggestContact: true }, [quotedSource]).answer);
  assert.ok(!reply.answer.includes("15 εργάσιμες"));
  assert.deepEqual(reply.sources, []);
  assert.throws(() => parseChatReply({ kind: "grounded", answer: unsafe, sourceIds: ["invented"], evidence: evidence(quotedSource), suggestContact: true }, [quotedSource]), error => error.code === "upstream");
});

test("post-provider deadline filtering also protects otherwise ordinary concept questions", async () => {
  const unsafe = "Στην ανακοπή διαταγής πληρωμής έχετε δεκαπέντε εργάσιμες ημέρες από την επίδοση, σύμφωνα με άρθρο.";
  const quotedSource = article(unsafe);
  const reply = await generateChatReply(input("Τι είναι η διαταγή πληρωμής;"), context(quotedSource), {
    apiKey: "test-only-key",
    fetcher: async () => providerPayload(unsafe, quotedSource),
  });
  assert.ok(!reply.answer.includes("δεκαπέντε"));
  assert.deepEqual(reply.sources, []);
  assert.equal(reply.suggestContact, true);
});

test("controlled replies still require an authorized context and retain the single-use immutable snapshot", async () => {
  const question = "Πόσες μέρες έχω για ανακοπή διαταγής πληρωμής;";
  assert.throws(() => prepareChatModelRequest(input(question), [source]), error => error.code === "forbidden");
  const original = input(question);
  const prepared = prepareChatModelRequest(original, context());
  assert.ok(prepared.reservedTokens > 0);
  assert.ok(Object.isFrozen(prepared));
  original.messages[0].content = "Where is the office?";
  const reply = await generatePreparedChatReply(prepared, { apiKey: "test-only-key", fetcher: neverFetch });
  assert.ok(reply.answer.includes("νομική προθεσμία"));
  await assert.rejects(generatePreparedChatReply(prepared, { apiKey: "test-only-key", fetcher: neverFetch }), error => error.code === "forbidden");
});

test("office hours use authorized facts without provider I/O and appointment prices retain the fee path", async () => {
  let calls = 0;
  const reply = await generateChatReply(input("Ποιες είναι οι ώρες λειτουργίας;"), context(), {
    apiKey: "test-only-key", fetcher: async () => { calls++; return providerPayload("Δευτέρα–Παρασκευή 9:00–17:00. Τηλέφωνο +30 2310 545 261."); },
  });
  assert.equal(calls, 0);
  assert.equal(reply.sources.length, 1);
  assert.ok(reply.answer.includes("9:00–17:00"));
  const fees = await generateChatReply(input("Πόσο κοστίζει ένα ραντεβού;"), context(), {
    apiKey: "test-only-key", fetcher: async () => { calls++; return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ kind: "office_fees", answer: "", sourceIds: [], evidence: [], suggestContact: true }) }] }] }); },
  });
  assert.equal(calls, 1);
  assert.ok(fees.answer.includes("αμοιβή"));
});
