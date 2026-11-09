/** Fixed, reviewed standard-tier price card. No tools, priority tier or other
 * models may use this budget. Amounts are pre-tax API-usage estimates, not a
 * guarantee of the final card/FX/tax amount on an invoice. */
export const CHAT_BUDGET_MODEL = "gpt-5.4-mini-2026-03-17";
export const CHAT_PRICE_REVIEWED_AT = "2026-11-09";
export const CHAT_PRICE_VALID_UNTIL = "2026-12-09";
const priceExpiry = Date.parse(CHAT_PRICE_VALID_UNTIL + "T00:00:00Z");
const priceStart = Date.parse(CHAT_PRICE_REVIEWED_AT + "T00:00:00Z");
const fxEndpoint = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const dayMs = 86400000;
const fxCache = new WeakMap();

export class MonetaryBudgetError extends Error {
  code = "unavailable";
  status = 503;
  constructor() { super("unavailable"); this.name = "MonetaryBudgetError"; }
}

const ceilDivide = (value, divisor) => (value + divisor - 1n) / divisor;

async function boundedXml(response) {
  const type = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  const declared = response.headers.get("content-length");
  if (!response.ok || response.redirected || !["text/xml", "application/xml"].includes(type) || !response.body ||
      (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > 65536))) {
    await response.body?.cancel(); throw new MonetaryBudgetError();
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 65536) { await reader.cancel(); throw new MonetaryBudgetError(); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } finally { reader.releaseLock(); }
}

function parseRate(xml, nowMs) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new MonetaryBudgetError();
  const clean = xml.replace(/<!--[\s\S]*?-->/g, "");
  const dated = [...clean.matchAll(/<Cube\s+time=(['"])(\d{4}-\d{2}-\d{2})\1\s*>([\s\S]*?)<\/Cube>/g)];
  if (dated.length !== 1) throw new MonetaryBudgetError();
  const date = dated[0][2];
  const rateDay = Date.parse(date + "T00:00:00Z");
  const today = Math.floor(nowMs / dayMs) * dayMs;
  if (!Number.isFinite(rateDay) || new Date(rateDay).toISOString().slice(0, 10) !== date ||
      rateDay > today || today - rateDay > 7 * dayMs) throw new MonetaryBudgetError();
  const usd = [...dated[0][3].matchAll(/<Cube\s+currency=(['"])USD\1\s+rate=(['"])(\d+(?:\.\d{1,6})?)\2\s*\/\s*>/g)];
  if (usd.length !== 1 || (dated[0][3].match(/currency\s*=\s*['"]USD['"]/g) || []).length !== 1) throw new MonetaryBudgetError();
  const [whole, fraction = ""] = usd[0][3].split(".");
  if (whole.length > 2) throw new MonetaryBudgetError();
  const rateMillionths = BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, "0"));
  if (rateMillionths < 500000n || rateMillionths > 2000000n) throw new MonetaryBudgetError();
  return { rateMillionths, rateDay, checkedAt: nowMs };
}

async function exchangeRate(fetcher, nowMs) {
  const cached = fxCache.get(fetcher);
  const today = Math.floor(nowMs / dayMs) * dayMs;
  if (cached && nowMs >= cached.checkedAt && nowMs - cached.checkedAt < 6 * 3600000 &&
      cached.rateDay <= today && today - cached.rateDay <= 7 * dayMs) return cached;
  const controller = new AbortController();
  let timer;
  try {
    const xml = await Promise.race([
      (async () => boundedXml(await fetcher(fxEndpoint, {
        method: "GET", headers: { Accept: "application/xml, text/xml" },
        cache: "no-store", credentials: "omit", redirect: "error", signal: controller.signal,
      })))(),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new MonetaryBudgetError()); }, 3000); }),
    ]);
    const rate = parseRate(xml, nowMs);
    fxCache.set(fetcher, rate);
    return rate;
  } finally { clearTimeout(timer); }
}

/** Reserve a conservative EUR upper bound before shared database admission.
 * The client cannot provide prices, exchange rates or monetary amounts.
 * Standard input price $0.75/M, maximum output price $4.50/M, plus 10% margin.
 * Cached-input discounts are ignored. FX is ECB's dated USD-per-EUR reference.
 * @param {number} reservedTokens
 * @param {string | undefined} [model]
 * @param {{fetcher?: typeof fetch, now?: number | (() => number)}} [options]
 * @returns {Promise<number>} Integer EUR millionths, never measured invoice cost.
 */
export async function reserveCostEurMicros(reservedTokens, model = CHAT_BUDGET_MODEL, options = {}) {
  try {
    const nowMs = typeof options.now === "function" ? options.now() : options.now ?? Date.now();
    if (typeof nowMs !== "number" || !Number.isFinite(nowMs) || nowMs < priceStart || nowMs >= priceExpiry ||
        !Number.isSafeInteger(reservedTokens) || reservedTokens < 1800 || reservedTokens > 64000 ||
        ![CHAT_BUDGET_MODEL, "gpt-5.4-mini"].includes(model)) throw new MonetaryBudgetError();
    const fx = await exchangeRate(options.fetcher ?? fetch, nowMs);
    const usdMicros = ceilDivide(BigInt(reservedTokens - 1800) * 75n + 1800n * 450n, 100n);
    const eurMicros = ceilDivide(usdMicros * 1000000n * 110n, fx.rateMillionths * 100n);
    if (eurMicros < 1n || eurMicros > 5000000n) throw new MonetaryBudgetError();
    return Number(eurMicros);
  } catch { throw new MonetaryBudgetError(); }
}

/** Conservative charge from a completed provider result, never from browser
 * fields or the dashboard. Same prices/FX/margin as admission; no cache discount.
 * Zero is reserved for application-controlled replies that made no API call.
 * Unknown/error cases must keep the original reservation instead.
 * @param {{inputTokens: number, outputTokens: number}} usage
 * @param {string | undefined} [model]
 * @param {{fetcher?: typeof fetch, now?: number | (() => number)}} [options]
 */
export async function usageCostEurMicros(usage, model = CHAT_BUDGET_MODEL, options = {}) {
  try {
    const nowMs = typeof options.now === "function" ? options.now() : options.now ?? Date.now();
    if (typeof nowMs !== "number" || !Number.isFinite(nowMs) || nowMs < priceStart || nowMs >= priceExpiry ||
        !usage || !Number.isSafeInteger(usage.inputTokens) || !Number.isSafeInteger(usage.outputTokens) ||
        usage.inputTokens < 0 || usage.inputTokens > 62200 || usage.outputTokens < 0 || usage.outputTokens > 1800 ||
        (usage.inputTokens === 0 && usage.outputTokens !== 0) ||
        ![CHAT_BUDGET_MODEL, "gpt-5.4-mini"].includes(model)) throw new MonetaryBudgetError();
    if (usage.inputTokens === 0 && usage.outputTokens === 0) return 0;
    const fx = await exchangeRate(options.fetcher ?? fetch, nowMs);
    const usdMicros = ceilDivide(BigInt(usage.inputTokens) * 75n + BigInt(usage.outputTokens) * 450n, 100n);
    return Number(ceilDivide(usdMicros * 1000000n * 110n, fx.rateMillionths * 100n));
  } catch { throw new MonetaryBudgetError(); }
}
