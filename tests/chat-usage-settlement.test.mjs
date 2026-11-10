import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHAT_BUDGET_MODEL, usageCostEurMicros, reserveCostEurMicros } from '../src/lib/chat/money.mjs';
import { generateChatReply, ChatFailure } from '../src/lib/chat/service.ts';
import { createAuthorizedChatContext, getPublicChatPrincipal } from '../src/lib/chat/access.mjs';
import { createChatHandler } from '../src/lib/chat/handler.mjs';

const source = { id: 'office-contact', title: 'Office', url: 'https://ioannispapaioannou.lawyer/el/contact', content: 'The office is in Thessaloniki.' };
const context = () => createAuthorizedChatContext(getPublicChatPrincipal(), 'public', [{ ...source, visibility: 'public', publication: 'published', load: () => ({ ...source, visibility: 'public', publication: 'published' }) }]);
const input = () => ({ locale: 'en', consent: true, messages: [{ role: 'user', content: 'Where is the office?' }] });
const payload = () => ({ status: 'completed', model: CHAT_BUDGET_MODEL, service_tier: 'default', usage: { input_tokens: 3000, output_tokens: 300, total_tokens: 3300 }, output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ kind: 'grounded', answer: source.content, sourceIds: [source.id], evidence: [{ sourceId: source.id, quote: source.content }], suggestContact: false }) }] }] });
const now = Date.parse('2026-11-09T12:00:00Z');
const fx = async () => new Response("<Cube><Cube time='2026-11-09'><Cube currency='USD' rate='1.1165'/></Cube></Cube>", { headers: { 'content-type': 'application/xml' } });

test('completed validated provider usage is internal and counts the entire output, including reasoning', async () => {
  const observed = [];
  const reply = await generateChatReply(input(), context(), { apiKey: 'test-only', fetcher: async () => Response.json(payload()), onUsage: u => observed.push(u) });
  assert.deepEqual(observed, [{ inputTokens: 3000, outputTokens: 300 }]);
  assert.equal(Object.isFrozen(observed[0]), true);
  assert.deepEqual(Object.keys(reply).sort(), ['answer', 'sources', 'suggestContact']);
});

test('missing, inconsistent, out-of-bound or differently priced usage never qualifies for settlement', async () => {
  const variants = [
    p => { delete p.usage; }, p => { p.model = 'other-model'; }, p => { p.service_tier = 'priority'; },
    p => { p.service_tier = null; }, p => { p.usage.total_tokens++; },
    p => { p.usage.input_tokens = '3000'; }, p => { p.usage.input_tokens = 0; p.usage.total_tokens = 300; },
    p => { p.usage.input_tokens = 64000; p.usage.total_tokens = 64300; },
    p => { p.usage.output_tokens = 1801; p.usage.total_tokens = 4801; },
    p => { p.usage.output_tokens = -1; p.usage.total_tokens = 2999; },
    p => { p.usage.output_tokens = 0; p.usage.total_tokens = 3000; },
    p => { p.usage.output_tokens = 3.5; p.usage.total_tokens = 3003.5; },
  ];
  for (const change of variants) {
    const p = payload(); change(p); let calls = 0;
    await generateChatReply(input(), context(), { apiKey: 'test-only', fetcher: async () => Response.json(p), onUsage: () => calls++ });
    assert.equal(calls, 0);
  }
});

test('provider errors and invalid evidence retain the full reservation even when usage looks valid', async () => {
  for (const change of [p => { p.status = 'incomplete'; }, p => { const answer = JSON.parse(p.output[0].content[0].text); answer.evidence[0].quote = 'This quotation was never present in the authorized source.'; p.output[0].content[0].text = JSON.stringify(answer); }]) {
    const p = payload(); change(p); let calls = 0;
    await assert.rejects(generateChatReply(input(), context(), { apiKey: 'test-only', fetcher: async () => Response.json(p), onUsage: () => calls++ }), e => e instanceof ChatFailure);
    assert.equal(calls, 0);
  }
});

test('only the server-controlled no-provider branch reports zero use', async () => {
  const body = input(); body.messages[0].content = 'Can you book me an appointment tomorrow?'; let providerCalls = 0; let measured;
  await generateChatReply(body, context(), { apiKey: 'test-only', fetcher: async () => { providerCalls++; return Response.json(payload()); }, onUsage: u => { measured = u; } });
  assert.equal(providerCalls, 0); assert.deepEqual(measured, { inputTokens: 0, outputTokens: 0 });
  const p = payload(); p.output[0].content[0].text = JSON.stringify({ kind: 'appointment', answer: '', sourceIds: [], evidence: [], suggestContact: true });
  measured = undefined;
  await generateChatReply(input(), context(), { apiKey: 'test-only', fetcher: async () => Response.json(p), onUsage: u => { measured = u; } });
  assert.deepEqual(measured, { inputTokens: 3000, outputTokens: 300 }, 'model-selected controlled kind still incurred a provider charge');
});

test('measured usage uses the same conservative prices/FX/margin and cannot exceed matching admission', async () => {
  const options = { fetcher: fx, now };
  assert.equal(await usageCostEurMicros({ inputTokens: 3000, outputTokens: 300 }, undefined, options), 3547);
  for (const inputTokens of [1, 3000, 62200]) for (const outputTokens of [0, 300, 1800]) {
    const cost = await usageCostEurMicros({ inputTokens, outputTokens }, undefined, options);
    const bound = await reserveCostEurMicros(inputTokens + 1800, undefined, options);
    assert.ok(cost >= 1 && cost <= bound);
  }
  let calls = 0;
  assert.equal(await usageCostEurMicros({ inputTokens: 0, outputTokens: 0 }, undefined, { now, fetcher: async () => { calls++; throw Error(); } }), 0);
  assert.equal(calls, 0);
  for (const usage of [null, {}, { inputTokens: 0, outputTokens: 1 }, { inputTokens: -1, outputTokens: 0 }, { inputTokens: 62201, outputTokens: 0 }, { inputTokens: 1, outputTokens: 1801 }, { inputTokens: '1', outputTokens: 0 }]) {
    await assert.rejects(usageCostEurMicros(usage, undefined, options));
  }
});

function handlerHarness({ settlement = 25, failAfterUsage = false, pricingFails = false, omitUsage = false, responseFails = false } = {}) {
  const released = []; let settlementCalls = 0;
  const h = createChatHandler({ env: { CHATBOT_ENABLED: 'true', OPENAI_API_KEY: 'test-only' },
    isSameOrigin: () => true, readChatBody: async () => input(), parseChatInput: x => x,
    getChatVisitor: async () => ({ visitor: {} }), resolveQuotaIdentity: async () => ({}), getPublicChatPrincipal: () => ({}),
    getChatQuotaReservation: () => 20000, getChatBudgetReservation: async () => 100,
    reserveChatQuota: async () => ({ release: async cost => { released.push(cost); } }),
    getPublicChatContext: () => ({}), prepareChatModelRequest: () => ({ reservedTokens: 20000 }),
    generatePreparedChatReply: async (_, options) => { if (!omitUsage) options.onUsage({ inputTokens: 3000, outputTokens: 300 }); if (failAfterUsage) throw Error(); const reply = { answer: 'Office', sources: [], suggestContact: false }; if (responseFails) reply.answer = 1n; return reply; },
    getChatBudgetSettlement: async () => { settlementCalls++; if (pricingFails) throw Error(); return settlement; }, classifyKnownError: () => null,
  });
  return { run: () => h(new Request('https://example.test/api/chat')), released, calls: () => settlementCalls };
}

test('handler settles once only after a successful displayable reply and never exposes accounting', async () => {
  for (const settlement of [0, 25, 100]) {
    const h = handlerHarness({ settlement }); const reply = await h.run();
    assert.equal(reply.status, 200); assert.deepEqual(h.released, [settlement]);
    assert.deepEqual(Object.keys(await reply.json()).sort(), ['answer', 'sources', 'suggestContact']);
  }
});

test('all unknown, invalid and error paths preserve the original financial charge', async () => {
  for (const options of [{ failAfterUsage: true }, { responseFails: true }, { pricingFails: true }, { omitUsage: true }, { settlement: -1 }, { settlement: 101 }, { settlement: 1.5 }, { settlement: NaN }, { settlement: '25' }]) {
    const h = handlerHarness(options); await h.run(); assert.deepEqual(h.released, [undefined]);
    if (options.failAfterUsage || options.responseFails || options.omitUsage) assert.equal(h.calls(), 0);
  }
});
