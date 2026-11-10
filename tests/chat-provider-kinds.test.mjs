import assert from "node:assert/strict";
import { test } from "node:test";
import { createAuthorizedChatContext, getPublicChatPrincipal } from "../src/lib/chat/access.mjs";
import { generateChatReply, parseChatReply } from "../src/lib/chat/service.ts";
import { INFORMATION_REPLY_KINDS } from "../src/lib/chat/response-policy.mjs";
import { CHAT_BUDGET_MODEL } from "../src/lib/chat/money.mjs";

const PROVIDER_KINDS = ["grounded", "handoff", "personal_handoff", "office_fees", "legal_deadline", "appointment", "greeting"];
const legal = { id: "legal-mediation", title: "Mediation", url: "https://e-justice.europa.eu/topics/court-procedures", content: "Η διαμεσολάβηση περιγράφεται εδώ μόνο ως γενική νομική έννοια." };
const office = {
  id: "office-contact", title: "Contact", url: "https://ioannispapaioannou.lawyer/el/contact",
  content: "Διεύθυνση: Λέοντος Σοφού 12, 54625 Θεσσαλονίκη. Τηλέφωνο: +30 2310 545 261. Email: iopapaio@gmail.com. Ωράριο γραφείου, τοπική ώρα Ελλάδας: Δευτέρα–Παρασκευή 9:00–17:00. Η συνομιλία δεν ελέγχει διαθεσιμότητα.",
};
const context = () => createAuthorizedChatContext(getPublicChatPrincipal(), "public", [legal, office].map(source => ({
  id: source.id, visibility: "public", publication: "published", load: () => ({ ...source, visibility: "public", publication: "published" }),
})));
const input = (content = "Τι είναι η διαμεσολάβηση;") => ({ locale: "el", consent: true, messages: [{ role: "user", content }] });
const reply = (kind) => ({ kind, answer: kind === "grounded" ? legal.content : "", sourceIds: kind === "grounded" ? [legal.id] : [], evidence: kind === "grounded" ? [`${legal.id}:p1`] : [], suggestContact: kind !== "grounded" });
const provider = (answer) => Response.json({
  status: "completed", model: CHAT_BUDGET_MODEL, service_tier: "default",
  usage: { input_tokens: 3000, output_tokens: 300, total_tokens: 3300 },
  output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(answer) }] }],
});

test("the provider schema permits exactly the seven legacy kinds and gives no internal information-policy choice", async () => {
  let calls = 0;
  await generateChatReply(input(), context(), { apiKey: "test-only", fetcher: async (_url, options) => {
    calls++;
    const body = JSON.parse(options.body);
    assert.deepEqual(body.text.format.schema.properties.kind.enum, PROVIDER_KINDS);
    for (const kind of INFORMATION_REPLY_KINDS) assert.ok(!body.text.format.schema.properties.kind.enum.includes(kind));
    assert.ok(!body.instructions.includes("Use out_of_scope"));
    assert.ok(!body.instructions.includes("office_hours for verified office hours"));
    assert.deepEqual(body.tools, []);
    assert.equal(body.tool_choice, "none");
    assert.equal(body.max_output_tokens, 1800);
    return provider(reply("grounded"));
  } });
  assert.equal(calls, 1);
});

test("provider-selected internal or unknown kinds fail before evidence parsing and never report usage", async () => {
  for (const kind of [...INFORMATION_REPLY_KINDS, "unknown_internal_kind", null, 7]) {
    let calls = 0;
    let usage = 0;
    await assert.rejects(generateChatReply(input(), context(), { apiKey: "test-only", onUsage: () => usage++, fetcher: async () => {
      calls++;
      // An unauthorized evidence ID would fail later. Kind rejection must win
      // even for a shape-valid information reply with plausible public facts.
      return provider({ ...reply(kind), evidence: ["private-client-file:p1"] });
    } }), error => error.code === "upstream" && error.status === 502 && error.diagnostic === "reply_kind", String(kind));
    assert.equal(calls, 1);
    assert.equal(usage, 0, "a rejected internal kind must retain its full financial reservation");
  }
});

test("every legacy provider kind remains accepted through its existing validated path", async () => {
  for (const kind of PROVIDER_KINDS) {
    const observed = [];
    const result = await generateChatReply(input(), context(), {
      apiKey: "test-only", onUsage: usage => observed.push(usage), fetcher: async () => provider(reply(kind)),
    });
    assert.ok(result.answer.length > 0);
    assert.deepEqual(observed, [{ inputTokens: 3000, outputTokens: 300 }]);
  }
});

test("a trusted local information snapshot still uses its controlled copy without provider I/O", async () => {
  let calls = 0;
  const observed = [];
  const local = parseChatReply({ kind: "office_hours", answer: "", sourceIds: [], evidence: [], suggestContact: true }, [office]);
  const result = await generateChatReply(input("Ποιες ώρες είστε ανοιχτά;"), context(), {
    apiKey: "test-only", onUsage: usage => observed.push(usage), fetcher: async () => { calls++; throw Error("no provider"); },
  });
  assert.equal(calls, 0);
  assert.equal(result.answer, local.answer);
  assert.ok(result.answer.includes("9:00–17:00"));
  assert.deepEqual(observed, [{ inputTokens: 0, outputTokens: 0 }]);
});
