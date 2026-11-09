import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAT_BUDGET_MODEL, reserveCostEurMicros } from "../src/lib/chat/money.mjs";

const now = Date.parse("2026-11-09T12:00:00Z");
const xml = (rate = "1.1165", date = "2026-11-06") => `<gesmes:Envelope><Cube><Cube time='${date}'><Cube currency='USD' rate='${rate}'/><Cube currency='GBP' rate='0.86'/></Cube></Cube></gesmes:Envelope>`;
const response = (body = xml()) => new Response(body, { headers: { "content-type": "application/xml" } });
const unavailable = (error) => error.code === "unavailable" && error.status === 503;

test("reserves integer EUR using the full input envelope, maximum output and safety margin", async () => {
  let calls = 0;
  const fetcher = async (url, options) => {
    calls++;
    assert.equal(url, "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml");
    assert.equal(options.method, "GET"); assert.equal(options.redirect, "error");
    assert.equal(options.credentials, "omit"); assert.equal(options.cache, "no-store");
    return response();
  };
  const result = await reserveCostEurMicros(50000, CHAT_BUDGET_MODEL, { fetcher, now });
  assert.equal(result, 43597); // ceil(($0.03615 + $0.0081) / 1.1165 * 1.10 * 1e6)
  assert.equal(await reserveCostEurMicros(50000, undefined, { fetcher, now: now + 1000 }), result);
  assert.equal(calls, 1, "only FX metadata is cached, never usage counters");
});

test("model changes, malformed envelopes and stale price cards fail before FX or provider work", async () => {
  let calls = 0; const fetcher = async () => { calls++; return response(); };
  for (const [units, model, at] of [[0, undefined, now], [1799, undefined, now], [64001, undefined, now],
    [30000.1, undefined, now], [30000, "other-model", now], [30000, undefined, Date.parse("2026-12-09T00:00:00Z")]]) {
    await assert.rejects(reserveCostEurMicros(units, model, { fetcher, now: at }), unavailable);
  }
  assert.equal(calls, 0);
});

test("expired, future, duplicate, extreme and entity-bearing FX data fails closed", async () => {
  const invalid = [xml("1.1165", "2026-10-30"), xml("1.1165", "2026-11-10"), xml("1.2", "2026-02-30"),
    xml("0.1"), xml("3"), xml("1.1234567"), xml().replace("</Cube></Cube>", "<Cube currency='USD' rate='1.1'/></Cube></Cube>"),
    "<!DOCTYPE doc [<!ENTITY secret SYSTEM 'file:///private'>]>" + xml(), "not XML", xml().replace("USD", "EUR")];
  for (const body of invalid) await assert.rejects(reserveCostEurMicros(30000, undefined, { now, fetcher: async () => response(body) }), unavailable);
});

test("FX outage, wrong media, byte overflow and a stalled request never use invented rates", async () => {
  for (const fetcher of [async () => { throw new Error("private detail"); },
    async () => new Response("down", { status: 503 }), async () => new Response(xml()),
    async () => response("x".repeat(65537))]) {
    await assert.rejects(reserveCostEurMicros(30000, undefined, { now, fetcher }), unavailable);
  }
  const started = Date.now();
  await assert.rejects(reserveCostEurMicros(30000, undefined, { now, fetcher: async () => new Promise(() => {}) }), unavailable);
  assert.ok(Date.now() - started >= 2900 && Date.now() - started < 5000);
});
