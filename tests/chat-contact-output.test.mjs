import assert from "node:assert/strict";
import { test } from "node:test";
import { qualifyPoliceContactAnswer } from "../src/lib/chat/contact-output.mjs";
import { generateChatReply } from "../src/lib/chat/service.ts";
import { createAuthorizedChatContext, getPublicChatPrincipal } from "../src/lib/chat/access.mjs";
import { CHAT_BUDGET_MODEL } from "../src/lib/chat/money.mjs";

const EL_FULL = "Για τη συγκεκριμένη κλήση, επικοινωνήστε άμεσα με δικηγόρο στο +30 2310 545 261 ή μέσω της σελίδας επικοινωνίας.";
const EL_SHORT = "Για τη συγκεκριμένη κλήση χρειάζεται άμεση συνεννόηση με δικηγόρο.";
const LIVE_TAIL = "Για συγκεκριμένη κλήση απαιτείται άμεση συνεννόηση με δικηγόρο.";
const RIGHTS = "Γενικά, ο ύποπτος έχει πρόσβαση σε συνήγορο και ενημέρωση για την κατηγορία.";

test("the observed Q24 final sentence becomes one controlled contact direction while rights remain intact", () => {
  const result = qualifyPoliceContactAnswer(`${RIGHTS} ${LIVE_TAIL}`, "el");
  assert.equal(result, `${RIGHTS}\n\n${EL_FULL}`);
  assert.equal(result.includes(LIVE_TAIL), false);
  assert.equal(result.match(/2310 545 261/gu).length, 1);
});

test("known full, short and repeated closing directions normalize to one current canonical suffix", () => {
  for (const tail of [EL_FULL, EL_SHORT, LIVE_TAIL, `${EL_SHORT}\n\n${EL_FULL}`, `${LIVE_TAIL} ${EL_SHORT}`]) {
    assert.equal(qualifyPoliceContactAnswer(`${RIGHTS}\n\n${tail}  \n`, "el"), `${RIGHTS}\n\n${EL_FULL}`);
  }
  assert.equal(qualifyPoliceContactAnswer(EL_FULL, "el"), EL_FULL);
  assert.equal(qualifyPoliceContactAnswer(EL_SHORT, "el"), EL_FULL);
});

test("missing qualification and a phone alone always receive the mandatory direction", () => {
  assert.equal(qualifyPoliceContactAnswer(RIGHTS, "el"), `${RIGHTS}\n\n${EL_FULL}`);
  const body = `${RIGHTS} Τηλέφωνο γραφείου: +30 2310 545 261.`;
  assert.equal(qualifyPoliceContactAnswer(body, "el"), `${body}\n\n${EL_SHORT}`);
  assert.equal(qualifyPoliceContactAnswer(`${body}\n\n${LIVE_TAIL}`, "el"), `${body}\n\n${EL_SHORT}`);
  assert.equal(qualifyPoliceContactAnswer(`${body}\n\n${EL_FULL}`, "el"), `${body}\n\n${EL_SHORT}`);
  assert.ok(qualifyPoliceContactAnswer("Άλλος αριθμός: 12310 545 261.", "el").endsWith(EL_FULL));
});

test("general rights, internal directions, quoted, negated and unrecognized sentences are never removed", () => {
  for (const body of [
    RIGHTS,
    "Ο ύποπτος έχει δικαίωμα πρόσβασης σε δικηγόρο και ενημέρωσης για την κατηγορία.",
    "Για συγκεκριμένη κλήση δεν απαιτείται άμεση συνεννόηση με δικηγόρο.",
    "Για συγκεκριμένη κλήση ίσως απαιτείται συνεννόηση με δικηγόρο.",
    `Δεν ισχύει ότι ${LIVE_TAIL}`,
    `Διατυπώθηκε η φράση: ${LIVE_TAIL}`,
    `Η πηγή γράφει «${LIVE_TAIL}»`,
    `Αν ισχύει το εξής, ${LIVE_TAIL}`,
    `${RIGHTS} ${LIVE_TAIL} Οι γενικές πληροφορίες δεν κρίνουν τη συγκεκριμένη υπόθεση.`,
  ]) {
    assert.equal(qualifyPoliceContactAnswer(body, "el"), `${body}\n\n${EL_FULL}`, body);
  }
});

test("English and German canonical tails normalize without removing their general rights", () => {
  for (const [locale, body, full, short] of [
    ["en", "General rights include access to a lawyer.", "For this police call, contact a lawyer promptly at +30 2310 545 261 or through the contact page.", "For this police call, consult a lawyer promptly."],
    ["de", "Zu den allgemeinen Rechten gehört der Zugang zu einem Rechtsanwalt.", "Wenden Sie sich wegen dieser polizeilichen Ladung umgehend an einen Rechtsanwalt unter +30 2310 545 261 oder über die Kontaktseite.", "Wenden Sie sich wegen dieser polizeilichen Ladung umgehend an einen Rechtsanwalt."],
  ]) {
    for (const tail of [full, short, `${short}\n\n${full}`]) assert.equal(qualifyPoliceContactAnswer(`${body}\n\n${tail}`, locale), `${body}\n\n${full}`);
    const withPhone = `${body} +30 2310 545 261.`;
    assert.equal(qualifyPoliceContactAnswer(`${withPhone}\n\n${short}`, locale), `${withPhone}\n\n${short}`);
  }
  for (const [locale, body, expected] of [
    ["en", "For this police call, do not consult a lawyer promptly.", "For this police call, contact a lawyer promptly"],
    ["de", "Wenden Sie sich wegen dieser polizeilichen Ladung nicht umgehend an einen Rechtsanwalt.", "Wenden Sie sich wegen dieser polizeilichen Ladung umgehend an einen Rechtsanwalt unter"],
  ]) {
    const result = qualifyPoliceContactAnswer(body, locale);
    assert.ok(result.startsWith(`${body}\n\n`));
    assert.ok(result.slice(body.length).includes(expected));
  }
});

const source = {
  id: "legal-criminal-defence-rights", title: "General rights",
  url: "https://e-justice.europa.eu/topics/your-rights",
  content: `${RIGHTS} ${LIVE_TAIL}`,
};
const context = () => createAuthorizedChatContext(getPublicChatPrincipal(), "public", [{
  id: source.id, visibility: "public", publication: "published",
  load: () => ({ ...source, visibility: "public", publication: "published" }),
}]);
const input = () => ({ locale: "el", consent: true, messages: [{ role: "user", content: "Με κάλεσαν στην αστυνομία για κατάθεση. Τι δικαιώματα έχει γενικά ένας ύποπτος;" }] });
const provider = (answer) => Response.json({
  status: "completed", model: CHAT_BUDGET_MODEL, service_tier: "default",
  usage: { input_tokens: 3000, output_tokens: 300, total_tokens: 3300 },
  output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({
    kind: "grounded", answer, sourceIds: [source.id], evidence: [`${source.id}:p1`], suggestContact: false,
  }) }] }],
});

test("the real service postcondition deduplicates the observed tail and validates before reporting usage", async () => {
  const observed = [];
  const result = await generateChatReply(input(), context(), {
    apiKey: "test-only", fetcher: async () => provider(`${RIGHTS} ${LIVE_TAIL}`), onUsage: (usage) => observed.push(usage),
  });
  assert.equal(result.answer, `${RIGHTS}\n\n${EL_FULL}`);
  assert.equal(result.suggestContact, true);
  assert.equal(result.sources.length, 1);
  assert.deepEqual(observed, [{ inputTokens: 3000, outputTokens: 300 }]);
});

test("a mandatory contact direction never clips an overflowing answer or reports settlement usage", async () => {
  const original = `${"α".repeat(3950)}.`;
  assert.ok(original.length < 4000);
  assert.ok(qualifyPoliceContactAnswer(original, "el").length > 4000);
  let usage = 0;
  await assert.rejects(generateChatReply(input(), context(), {
    apiKey: "test-only", fetcher: async () => provider(original), onUsage: () => usage++,
  }), (error) => error.code === "upstream" && error.diagnostic === "reply_contract");
  assert.equal(usage, 0);
});
