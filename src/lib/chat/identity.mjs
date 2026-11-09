import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { readVerifiedVisitor } from "./visitor.mjs";

/** @typedef {{tier: "anonymous" | "authenticated", subjectKey: string, networkKey: string}} QuotaIdentity */
/** @typedef {{env?: Record<string, string | undefined>, visitor?: unknown, now?: number, verifyToken?: (token: string, policy: object) => Promise<unknown>}} TrustedIdentityOptions */

export class QuotaIdentityError extends Error {
  /** @param {"unauthorized" | "unavailable"} code */
  constructor(code) {
    super(code);
    this.name = "QuotaIdentityError";
    this.code = code;
    this.status = code === "unauthorized" ? 401 : 503;
  }
}

const ALGORITHMS = Object.freeze(["RS256", "ES256"]);
const TOKEN_FAILURES = new Set([
  "ERR_JWT_EXPIRED", "ERR_JWT_INVALID", "ERR_JWT_CLAIM_VALIDATION_FAILED",
  "ERR_JWS_INVALID", "ERR_JWS_SIGNATURE_VERIFICATION_FAILED", "ERR_JOSE_ALG_NOT_ALLOWED",
  "ERR_JOSE_NOT_SUPPORTED", "ERR_JWKS_NO_MATCHING_KEY",
]);
/** @type {Map<string, ReturnType<typeof createRemoteJWKSet>>} */
const keySets = new Map();

/** @param {string} value @param {boolean} [issuer] */
function httpsUrl(value, issuer = false) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.hash || (issuer && url.search)) throw new Error();
    return url;
  } catch {
    throw new QuotaIdentityError("unavailable");
  }
}

/** IPv4-mapped IPv6 addresses share the IPv4 quota, and native IPv6 shares a /64.
 * @param {string} address
 */
function networkAddress(address) {
  const family = isIP(address);
  if (family === 4) return address;
  if (family !== 6 || address.includes("%")) return "unknown";
  let ipv6 = address.toLowerCase();
  if (ipv6.includes(".")) {
    const lastColon = ipv6.lastIndexOf(":");
    const octets = ipv6.slice(lastColon + 1).split(".").map(Number);
    ipv6 = `${ipv6.slice(0, lastColon)}:${((octets[0] << 8) | octets[1]).toString(16)}:${((octets[2] << 8) | octets[3]).toString(16)}`;
  }
  const sides = ipv6.split("::");
  const left = sides[0] ? sides[0].split(":") : [];
  const right = sides.length === 2 && sides[1] ? sides[1].split(":") : [];
  const parts = sides.length === 2
    ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right]
    : left;
  if (parts.length !== 8) return "unknown";
  const numbers = parts.map((part) => Number.parseInt(part, 16));
  if (numbers.slice(0, 5).every((part) => part === 0) && numbers[5] === 0xffff) {
    return `${numbers[6] >> 8}.${numbers[6] & 255}.${numbers[7] >> 8}.${numbers[7] & 255}`;
  }
  return `${numbers.slice(0, 4).map((part) => part.toString(16).padStart(4, "0")).join(":")}::/64`;
}

/** @param {Request} request @param {Record<string, string | undefined>} env */
function requestNetwork(request, env) {
  // Vercel owns this header. Other hosts must add a trusted platform adapter;
  // arbitrary X-Forwarded-For/X-User-ID values never choose an identity here.
  if (env.VERCEL !== "1") return "untrusted-network";
  const address = request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() || "";
  return networkAddress(address);
}

/** @param {string} secret @param {string} domain @param {string[]} values */
function pseudonym(secret, domain, values) {
  return createHmac("sha256", secret).update(JSON.stringify(["chat-quota-v1", domain, ...values])).digest("hex");
}

/** Resolve only verified server identities. Options are trusted server/test
 * dependencies, never request data. Authentication changes quota tier only;
 * it grants no private context, RBAC permission, or model tool capability.
 * @param {Request} request
 * @param {TrustedIdentityOptions} [options]
 * @returns {Promise<QuotaIdentity>}
 */
export async function resolveQuotaIdentity(request, options = {}) {
  const env = options.env ?? process.env;
  const secret = env.CHAT_RATE_LIMIT_SECRET;
  if (typeof secret !== "string" || secret.length < 32 || secret.length > 1024 || secret !== secret.trim()) {
    throw new QuotaIdentityError("unavailable");
  }
  const network = requestNetwork(request, env);
  const networkKey = pseudonym(secret, "network", [network]);
  if (env.CHAT_TURNSTILE_ENABLED === "true") {
    const visitorId = readVerifiedVisitor(options.visitor, { env, now: options.now });
    if (!visitorId) throw new QuotaIdentityError("unauthorized");
    // A browser proof changes the anonymous quota key, never its tier or public
    // context permissions. VPN changes still share this browser's subject quota.
    return Object.freeze({ tier: "anonymous", subjectKey: pseudonym(secret, "anonymous-visitor", [visitorId]), networkKey });
  }
  const issuer = env.CHAT_AUTH_ISSUER?.trim() || "";
  const audience = env.CHAT_AUTH_AUDIENCE?.trim() || "";
  const jwksUrl = env.CHAT_AUTH_JWKS_URL?.trim() || "";
  const configured = [issuer, audience, jwksUrl].filter(Boolean).length;
  if (configured && configured !== 3) throw new QuotaIdentityError("unavailable");
  if (configured) {
    httpsUrl(issuer, true);
    httpsUrl(jwksUrl);
    if (issuer.length > 2048 || jwksUrl.length > 2048 || audience.length > 500) throw new QuotaIdentityError("unavailable");
  }
  const authorization = request.headers.get("authorization");
  if (authorization === null) {
    return Object.freeze({ tier: "anonymous", subjectKey: pseudonym(secret, "anonymous", [network]), networkKey });
  }
  const bearer = authorization.length <= 8192
    ? /^Bearer[ \t]+([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(authorization)
    : null;
  if (!bearer || !configured) throw new QuotaIdentityError("unauthorized");

  const policy = {
    issuer, audience, algorithms: [...ALGORITHMS],
    requiredClaims: ["iss", "aud", "sub", "exp"], clockTolerance: 5,
  };
  let result;
  try {
    if (options.verifyToken) {
      result = await options.verifyToken(bearer[1], policy);
    } else {
      let keySet = keySets.get(jwksUrl);
      if (!keySet) {
        keySet = createRemoteJWKSet(new URL(jwksUrl), { timeoutDuration: 2500, cooldownDuration: 30000, cacheMaxAge: 600000 });
        if (keySets.size >= 8) keySets.delete(keySets.keys().next().value);
        keySets.set(jwksUrl, keySet);
      }
      result = await jwtVerify(bearer[1], keySet, policy);
    }
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : "";
    throw new QuotaIdentityError(TOKEN_FAILURES.has(code) ? "unauthorized" : "unavailable");
  }
  const payload = result && typeof result === "object" && "payload" in result ? result.payload : null;
  const header = result && typeof result === "object" && "protectedHeader" in result ? result.protectedHeader : null;
  const tokenAudience = payload && typeof payload === "object" && "aud" in payload ? payload.aud : null;
  const hasAudience = tokenAudience === audience ||
    (Array.isArray(tokenAudience) && tokenAudience.length <= 16 && tokenAudience.every((item) => typeof item === "string") && tokenAudience.includes(audience));
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || !header ||
      typeof header !== "object" || !("alg" in header) || !ALGORITHMS.includes(header.alg) ||
      !("iss" in payload) || payload.iss !== issuer || !hasAudience ||
      !("sub" in payload) || typeof payload.sub !== "string" || !payload.sub.trim() || payload.sub.length > 200 ||
      /[\u0000-\u001F\u007F-\u009F]/u.test(payload.sub) ||
      !("exp" in payload) || typeof payload.exp !== "number" || !Number.isFinite(payload.exp) || payload.exp <= Date.now() / 1000 - 5) {
    throw new QuotaIdentityError("unauthorized");
  }
  return Object.freeze({ tier: "authenticated", subjectKey: pseudonym(secret, "authenticated", [issuer, payload.sub]), networkKey });
}
