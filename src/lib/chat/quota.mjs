import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

/** Shared, conservative reservation units; these are not measured usage bills.
 * SQL owns the matching policy. A policy change must update its version too.
 */
export const CHAT_QUOTA_POLICY = Object.freeze({
  anonymous: Object.freeze({ requestsPerMinute: 6, tokensPerMinute: 100000, requestsPerDay: 30, tokensPerDay: 500000, concurrency: 1 }),
  authenticated: Object.freeze({ requestsPerMinute: 20, tokensPerMinute: 300000, requestsPerDay: 300, tokensPerDay: 5000000, concurrency: 2 }),
  network: Object.freeze({ requestsPerMinute: 30, tokensPerMinute: 500000, requestsPerDay: 0, tokensPerDay: 5000000, concurrency: 3 }),
  global: Object.freeze({ requestsPerMinute: 60, tokensPerMinute: 1000000, requestsPerDay: 1000, tokensPerDay: 10000000, concurrency: 8 }),
  leaseMilliseconds: 60000,
  maxReservedTokens: 64000,
});

export const CHAT_MONEY_BUDGET_EUR_MICROS = 5000000;
export const RESERVE_CHAT_QUOTA_SQL = "SELECT allowed, retry_after, policy_version, money_policy_version FROM chat_quota.reserve($1::text, $2::text, $3::text, $4::text, $5::bigint, $6::uuid, $7::bigint)";
export const RELEASE_CHAT_QUOTA_SQL = "SELECT chat_quota.release($1::text, $2::uuid) AS released";
const POLICY_VERSION = 1;
const MONEY_POLICY_VERSION = 1;
const RESERVE_TIMEOUT_MS = 5000;
const RELEASE_TIMEOUT_MS = 3000;

/** @typedef {(sql: string, parameters: Array<string | number>) => Promise<unknown>} QuotaQuery */

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

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** Only a SQL-created quota role may be deployed. The database additionally
 * maps session_user to one provisioned namespace/environment; the role name
 * alone is not the authorization boundary. No owner/admin URL is accepted.
 * @param {Record<string, string | undefined>} env
 */
function databaseConfiguration(env) {
  const environment = env.VERCEL_ENV === undefined ? "development" : env.VERCEL_ENV;
  const rawUrl = typeof env.CHAT_DATABASE_URL === "string" ? env.CHAT_DATABASE_URL.trim() : "";
  if (!rawUrl || rawUrl.length > 8192 || /\s|\p{Cc}/u.test(rawUrl) ||
      !["development", "preview", "production"].includes(environment)) {
    throw new QuotaError("unavailable", 503);
  }
  try {
    const url = new URL(rawUrl);
    const username = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password);
    const database = decodeURIComponent(url.pathname.slice(1));
    const expectedRole = new RegExp(`^chat_quota_${environment}(?:_(?:test_?)?[0-9a-f]{8,32})?$`);
    const labels = url.hostname.split(".");
    if (!["postgres:", "postgresql:"].includes(url.protocol) ||
        !url.hostname.endsWith(".neon.tech") || url.hostname.length > 253 ||
        labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ||
        (url.port !== "" && url.port !== "5432") || url.hash ||
        !expectedRole.test(username) || password.length < 16 || password.length > 4096 ||
        /\s|\p{Cc}/u.test(password) || !/^[A-Za-z0-9_][A-Za-z0-9_-]{0,62}$/.test(database) ||
        url.pathname !== `/${encodeURIComponent(database)}`) {
      throw new Error("configuration");
    }
    // Reject connection overrides such as options, host, role or insecure TLS.
    // The Neon console's optional channel_binding=require value is supported.
    const parameters = url.searchParams;
    if (parameters.getAll("sslmode").length !== 1 ||
        !["require", "verify-full"].includes(parameters.get("sslmode") ?? "") ||
        parameters.getAll("channel_binding").length > 1 ||
        (parameters.has("channel_binding") && parameters.get("channel_binding") !== "require") ||
        [...parameters.keys()].some((key) => !["sslmode", "channel_binding"].includes(key))) {
      throw new Error("configuration");
    }
    return Object.freeze({ connectionString: url.toString(), environment });
  } catch {
    throw new QuotaError("unavailable", 503);
  }
}

/** Trusted dependency injection is for tests only, never an HTTP input. The
 * default transport executes one parameterized function call over Neon HTTPS.
 * A timeout has an ambiguous write outcome, so it must never be retried or
 * refunded automatically. The owned lease still expires in the database.
 * @param {{connectionString: string}} config
 * @param {QuotaQuery | undefined} suppliedQuery
 */
function quotaQuery(config, suppliedQuery) {
  if (suppliedQuery !== undefined && typeof suppliedQuery !== "function") throw new QuotaError("unavailable", 503);
  const sql = suppliedQuery === undefined ? neon(config.connectionString) : undefined;
  /** @param {string} text @param {Array<string | number>} parameters @param {number} timeoutMs */
  return async function execute(text, parameters, timeoutMs) {
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timer;
    try {
      const request = suppliedQuery
        ? Promise.resolve().then(() => suppliedQuery(text, parameters))
        : sql.query(text, parameters, {
          fullResults: false,
          arrayMode: false,
          fetchOptions: { signal: AbortSignal.timeout(timeoutMs), cache: "no-store", redirect: "error" },
        });
      return await Promise.race([
        request,
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("quota timeout")), timeoutMs); }),
      ]);
    } catch {
      // Never expose SQL errors, database credentials, identifiers or payloads.
      throw new QuotaError("unavailable", 503);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  };
}

/**
 * Reserve worst-case units atomically in PostgreSQL before calling the LLM.
 * The database controls namespace, policy, time and all three admission scopes.
 * No successful reservation is refunded on errors/cancellation. There is no
 * Redis, in-memory fallback or caller-chosen SQL/policy/namespace.
 * @param {{tier: "anonymous" | "authenticated", subjectKey: string, networkKey: string}} identity
 * @param {number} reservedTokens
 * @param {{env?: Record<string, string | undefined>, query?: QuotaQuery, reservedCostEurMicros?: number}} [options]
 * @returns {Promise<{release: () => Promise<void>}>}
 */
export async function reserveChatQuota(identity, reservedTokens, options = {}) {
  if (!Number.isSafeInteger(reservedTokens) || reservedTokens < 1 || reservedTokens > CHAT_QUOTA_POLICY.maxReservedTokens) {
    throw new QuotaError("request_too_large", 413);
  }
  const moneyCost = options.reservedCostEurMicros;
  if (!Number.isSafeInteger(moneyCost) || moneyCost < 1 || moneyCost > CHAT_MONEY_BUDGET_EUR_MICROS) {
    // A missing/invalid server-calculated cost must never bypass the financial
    // guard or silently reserve zero. HTTP request data cannot choose this cost.
    throw new QuotaError("unavailable", 503);
  }
  if (!identity || !["anonymous", "authenticated"].includes(identity.tier) ||
      typeof identity.subjectKey !== "string" || typeof identity.networkKey !== "string" ||
      !/^[a-f0-9]{64}$/.test(identity.subjectKey) || !/^[a-f0-9]{64}$/.test(identity.networkKey)) {
    throw new QuotaError("unavailable", 503);
  }
  const config = databaseConfiguration(options.env ?? process.env);
  const query = quotaQuery(config, options.query);
  const leaseId = randomUUID();
  const result = await query(RESERVE_CHAT_QUOTA_SQL, [
    config.environment, identity.tier, identity.subjectKey, identity.networkKey, reservedTokens, leaseId, moneyCost,
  ], RESERVE_TIMEOUT_MS);
  if (!Array.isArray(result) || result.length !== 1 || !isRecord(result[0])) throw new QuotaError("unavailable", 503);
  const row = result[0];
  if (Object.keys(row).length !== 4 || typeof row.allowed !== "boolean" ||
      !Number.isInteger(row.retry_after) || row.policy_version !== POLICY_VERSION ||
      row.money_policy_version !== MONEY_POLICY_VERSION ||
      row.retry_after < 0 || row.retry_after > 86400 ||
      (row.allowed && row.retry_after !== 0) || (!row.allowed && row.retry_after < 1)) {
    throw new QuotaError("unavailable", 503);
  }
  if (!row.allowed) throw new QuotaError("rate_limit", 429, row.retry_after);

  /** @type {Promise<void> | undefined} */
  let releasePromise;
  return Object.freeze({ release() {
    if (!releasePromise) releasePromise = (async () => {
      const released = await query(RELEASE_CHAT_QUOTA_SQL, [config.environment, leaseId], RELEASE_TIMEOUT_MS);
      if (!Array.isArray(released) || released.length !== 1 || !isRecord(released[0]) ||
          Object.keys(released[0]).length !== 1 || ![0, 1].includes(released[0].released)) {
        throw new QuotaError("unavailable", 503);
      }
    })();
    return releasePromise;
  } });
}
