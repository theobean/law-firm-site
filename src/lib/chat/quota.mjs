import { randomUUID } from "node:crypto";
import { readBoundedJson } from "./protocol.mjs";

/** Shared, conservative reservation units; these are not measured usage bills. */
export const CHAT_QUOTA_POLICY = Object.freeze({
  anonymous: Object.freeze({ requestsPerMinute: 6, tokensPerMinute: 100000, requestsPerDay: 30, tokensPerDay: 500000, concurrency: 1 }),
  authenticated: Object.freeze({ requestsPerMinute: 20, tokensPerMinute: 300000, requestsPerDay: 300, tokensPerDay: 5000000, concurrency: 2 }),
  network: Object.freeze({ requestsPerMinute: 30, tokensPerMinute: 500000, requestsPerDay: 0, tokensPerDay: 5000000, concurrency: 3 }),
  global: Object.freeze({ requestsPerMinute: 60, tokensPerMinute: 1000000, requestsPerDay: 1000, tokensPerDay: 10000000, concurrency: 8 }),
  leaseMilliseconds: 60000,
  maxReservedTokens: 64000,
});

export class QuotaError extends Error {
  /** @param {"rate_limit" | "unavailable" | "request_too_large"} code @param {number} status @param {number} [retryAfter] */
  constructor(code, status, retryAfter) {
    super(code);
    this.name = "QuotaError";
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

// Every accessed Redis key is explicitly declared in KEYS and shares one hash
// slot. All admission decisions run before writes. TIME is authoritative across
// serverless instances; application clocks cannot reset buckets or UTC quotas.
export const RESERVE_CHAT_QUOTA_LUA = `
if #KEYS ~= 6 or #ARGV ~= 4 then return redis.error_reply('invalid quota arguments') end
local leaseId = ARGV[1]
local charge = tonumber(ARGV[2])
local leaseMs = tonumber(ARGV[4])
local policies = cjson.decode(ARGV[3])
if not charge or charge < 1 or charge > 64000 or charge ~= math.floor(charge) or leaseMs ~= 60000 or #policies ~= 3 then
  return redis.error_reply('invalid quota policy')
end
local clock = redis.call('TIME')
local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2]) / 1000)
local day = math.floor(tonumber(clock[1]) / 86400)
local nextDay = (day + 1) * 86400000
local retryMs = 0
local snapshots = {}
for i = 1, 3 do
  local p = policies[i]
  if type(p) ~= 'table' or not p.requestsPerMinute or not p.tokensPerMinute or not p.requestsPerDay or not p.tokensPerDay or not p.concurrency or
      p.requestsPerMinute < 1 or p.tokensPerMinute < charge or p.requestsPerDay < 0 or p.tokensPerDay < charge or p.concurrency < 1 then
    return redis.error_reply('invalid quota policy')
  end
  local state = redis.call('HMGET', KEYS[i], 'requests', 'requestAt', 'tokens', 'tokenAt', 'day', 'dayRequests', 'dayTokens')
  local exists = redis.call('EXISTS', KEYS[i]) == 1
  local requests = p.requestsPerMinute
  local tokens = p.tokensPerMinute
  local dayRequests = 0
  local dayTokens = 0
  if exists then
    for field = 1, 7 do
      if not state[field] or not tonumber(state[field]) then return redis.error_reply('invalid quota state') end
    end
    local oldRequests = tonumber(state[1])
    local requestAt = tonumber(state[2])
    local oldTokens = tonumber(state[3])
    local tokenAt = tonumber(state[4])
    local oldDay = tonumber(state[5])
    if oldRequests < 0 or oldTokens < 0 or tonumber(state[6]) < 0 or tonumber(state[7]) < 0 or oldDay > day then
      return redis.error_reply('invalid quota state')
    end
    requests = math.min(p.requestsPerMinute, oldRequests + math.max(0, now - requestAt) * p.requestsPerMinute / 60000)
    tokens = math.min(p.tokensPerMinute, oldTokens + math.max(0, now - tokenAt) * p.tokensPerMinute / 60000)
    if oldDay == day then
      dayRequests = tonumber(state[6])
      dayTokens = tonumber(state[7])
    end
  end
  if requests < 1 then retryMs = math.max(retryMs, (1 - requests) * 60000 / p.requestsPerMinute) end
  if tokens < charge then retryMs = math.max(retryMs, (charge - tokens) * 60000 / p.tokensPerMinute) end
  if p.requestsPerDay > 0 and dayRequests + 1 > p.requestsPerDay then retryMs = math.max(retryMs, nextDay - now) end
  if dayTokens + charge > p.tokensPerDay then retryMs = math.max(retryMs, nextDay - now) end
  local active = redis.call('ZCOUNT', KEYS[i + 3], '(' .. tostring(now), '+inf')
  if active >= p.concurrency then
    local expiry = redis.call('ZRANGEBYSCORE', KEYS[i + 3], '(' .. tostring(now), '+inf', 'WITHSCORES', 'LIMIT', active - p.concurrency, 1)
    if #expiry ~= 2 then return redis.error_reply('invalid quota lease') end
    retryMs = math.max(retryMs, tonumber(expiry[2]) - now)
  end
  snapshots[i] = { requests - 1, now, tokens - charge, now, day, dayRequests + 1, dayTokens + charge }
end
if retryMs > 0 then return { 0, math.max(1, math.ceil(retryMs / 1000)) } end
for i = 1, 3 do
  local s = snapshots[i]
  redis.call('HSET', KEYS[i], 'requests', tostring(s[1]), 'requestAt', tostring(s[2]), 'tokens', tostring(s[3]), 'tokenAt', tostring(s[4]), 'day', tostring(s[5]), 'dayRequests', tostring(s[6]), 'dayTokens', tostring(s[7]))
  redis.call('PEXPIREAT', KEYS[i], nextDay + 86400000)
  redis.call('ZREMRANGEBYSCORE', KEYS[i + 3], '-inf', now)
  redis.call('ZADD', KEYS[i + 3], now + leaseMs, leaseId)
  redis.call('PEXPIRE', KEYS[i + 3], leaseMs * 2)
end
return { 1, 0 }
`;

// Removal never refunds request/token reservations and cannot release another
// request's UUID, including after an older caller retries its cleanup.
export const RELEASE_CHAT_QUOTA_LUA = `
if #KEYS ~= 3 or #ARGV ~= 1 then return redis.error_reply('invalid lease release') end
for i = 1, 3 do redis.call('ZREM', KEYS[i], ARGV[1]) end
return 1
`;

/** @param {Record<string, string | undefined>} env */
function redisConfiguration(env) {
  const rawUrl = typeof env.UPSTASH_REDIS_REST_URL === "string" ? env.UPSTASH_REDIS_REST_URL.trim() : undefined;
  const token = typeof env.UPSTASH_REDIS_REST_TOKEN === "string" ? env.UPSTASH_REDIS_REST_TOKEN.trim() : undefined;
  const environment = env.VERCEL_ENV || "development";
  const namespace = env.CHAT_QUOTA_NAMESPACE === undefined ? "law-firm-site-chat"
    : typeof env.CHAT_QUOTA_NAMESPACE === "string" ? env.CHAT_QUOTA_NAMESPACE.trim() : "";
  if (!rawUrl || !token || token.length > 8192 || /[\u0000-\u001F\u007F]/.test(token) ||
      !["development", "preview", "production"].includes(environment) ||
      !/^[a-zA-Z0-9][a-zA-Z0-9-]{0,63}$/.test(namespace)) throw new QuotaError("unavailable", 503);
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("configuration");
    return { url: url.origin, token, prefix: `${namespace}:{${namespace}-quota}:v1:${environment}` };
  } catch {
    throw new QuotaError("unavailable", 503);
  }
}

/** @param {{url: string, token: string}} config @param {unknown[]} command @param {typeof fetch} fetcher */
async function evalRedis(config, command, fetcher) {
  try {
    const response = await fetcher(config.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) throw new Error("store unavailable");
    const payload = await readBoundedJson(response);
    if (!payload || typeof payload !== "object" || Array.isArray(payload) || "error" in payload || !("result" in payload)) {
      throw new Error("store unavailable");
    }
    return payload.result;
  } catch {
    // Never expose upstream messages, credentials, raw identifiers or payloads.
    throw new QuotaError("unavailable", 503);
  }
}

/**
 * Atomically reserve worst-case units in shared Redis before calling the LLM.
 * No successful reservation is refunded on errors/cancellation: this is an
 * abuse budget, not provider billing reconciliation. Missing storage fails closed.
 * @param {{tier: "anonymous" | "authenticated", subjectKey: string, networkKey: string}} identity
 * @param {number} reservedTokens
 * @param {{env?: Record<string, string | undefined>, fetcher?: typeof fetch}} [options]
 * @returns {Promise<{release: () => Promise<void>}>}
 */
export async function reserveChatQuota(identity, reservedTokens, options = {}) {
  if (!Number.isSafeInteger(reservedTokens) || reservedTokens < 1 || reservedTokens > CHAT_QUOTA_POLICY.maxReservedTokens) {
    throw new QuotaError("request_too_large", 413);
  }
  if (!identity || !["anonymous", "authenticated"].includes(identity.tier) ||
      typeof identity.subjectKey !== "string" || typeof identity.networkKey !== "string" ||
      !/^[a-f0-9]{64}$/.test(identity.subjectKey) || !/^[a-f0-9]{64}$/.test(identity.networkKey)) {
    throw new QuotaError("unavailable", 503);
  }
  const config = redisConfiguration(options.env ?? process.env);
  const fetcher = options.fetcher ?? fetch;
  const keys = [
    `${config.prefix}:subject:${identity.tier}:${identity.subjectKey}`,
    `${config.prefix}:network:${identity.networkKey}`,
    `${config.prefix}:global`,
  ];
  const leaseKeys = keys.map((key) => `${key}:leases`);
  const leaseId = randomUUID();
  const policies = [CHAT_QUOTA_POLICY[identity.tier], CHAT_QUOTA_POLICY.network, CHAT_QUOTA_POLICY.global];
  const result = await evalRedis(config, [
    "EVAL", RESERVE_CHAT_QUOTA_LUA, 6, ...keys, ...leaseKeys,
    leaseId, reservedTokens, JSON.stringify(policies), CHAT_QUOTA_POLICY.leaseMilliseconds,
  ], fetcher);
  if (!Array.isArray(result) || result.length !== 2 || !Number.isInteger(result[0]) || !Number.isInteger(result[1]) ||
      ![0, 1].includes(result[0]) || result[1] < 0 || result[1] > 86400 || (result[0] === 1 && result[1] !== 0) ||
      (result[0] === 0 && result[1] < 1)) throw new QuotaError("unavailable", 503);
  if (result[0] === 0) throw new QuotaError("rate_limit", 429, result[1]);

  /** @type {Promise<void> | undefined} */
  let releasePromise;
  return Object.freeze({ release() {
    if (!releasePromise) releasePromise = (async () => {
      const released = await evalRedis(config, ["EVAL", RELEASE_CHAT_QUOTA_LUA, 3, ...leaseKeys, leaseId], fetcher);
      if (released !== 1) throw new QuotaError("unavailable", 503);
    })();
    return releasePromise;
  } });
}
