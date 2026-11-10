import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const VISITOR_COOKIE_NAME = "__Host-lexi-visitor";
export const VISITOR_MAX_AGE_SECONDS = 86400;

/** @typedef {Readonly<{kind: "anonymous-chat-visitor"}>} VerifiedVisitor */
/** @typedef {{env?: Record<string, string | undefined>, now?: number}} VisitorOptions */
/** @type {WeakMap<object, {nonce: string, expires: number, signature: string}>} */
const verifiedVisitors = new WeakMap();

export class VisitorCookieError extends Error {
  code = "unavailable";
  status = 503;
  constructor() {
    super("unavailable");
    this.name = "VisitorCookieError";
  }
}

/** @param {Record<string, string | undefined>} env */
function signingSecret(env) {
  const secret = env.CHAT_RATE_LIMIT_SECRET;
  if (typeof secret !== "string" || secret.length < 32 || secret.length > 1024 || secret !== secret.trim()) {
    throw new VisitorCookieError();
  }
  return secret;
}

/** @param {VisitorOptions} options */
function currentSeconds(options) {
  const now = options.now ?? Date.now();
  if (!Number.isSafeInteger(now) || now < 0) throw new VisitorCookieError();
  return Math.floor(now / 1000);
}

/** @param {string} secret @param {string} nonce @param {number} expires */
function signatureFor(secret, nonce, expires) {
  // Separate the cookie signature from every quota-key HMAC domain.
  return createHmac("sha256", secret)
    .update(JSON.stringify(["lexi-anonymous-visitor-cookie-v1", nonce, expires]))
    .digest("base64url");
}

/** @param {string} value */
function canonicalBase64(value) {
  return /^[A-Za-z0-9_-]{43}$/.test(value) && Buffer.from(value, "base64url").toString("base64url") === value;
}

/** @param {string} actual @param {string} expected */
function validSignature(actual, expected) {
  // Both values have the fixed canonical SHA-256 encoding before comparison.
  return canonicalBase64(actual) && timingSafeEqual(Buffer.from(actual, "base64url"), Buffer.from(expected, "base64url"));
}

/** @param {number} expires @param {number} now */
function validExpiry(expires, now) {
  return Number.isSafeInteger(expires) && expires > now && expires <= now + VISITOR_MAX_AGE_SECONDS;
}

/** @param {{nonce: string, expires: number, signature: string}} record @returns {VerifiedVisitor} */
function ownVisitor(record) {
  /** @type {VerifiedVisitor} */
  const visitor = Object.freeze({ kind: "anonymous-chat-visitor" });
  verifiedVisitors.set(visitor, record);
  return visitor;
}

/** Read a signed browser identity without refreshing its expiry. A changed,
 * expired, duplicated or malformed cookie requires a fresh challenge.
 * @param {Request} request
 * @param {VisitorOptions} [options]
 * @returns {VerifiedVisitor | null}
 */
export function readVisitorCookie(request, options = {}) {
  const env = options.env ?? process.env;
  if (env.CHAT_TURNSTILE_ENABLED !== "true") return null;
  const secret = signingSecret(env);
  const now = currentSeconds(options);
  const header = request.headers.get("cookie");
  if (!header || header.length > 16384) return null;
  const matches = header.split(";").map((part) => part.trim()).filter((part) => part.split("=", 1)[0] === VISITOR_COOKIE_NAME);
  if (matches.length !== 1) return null;
  const value = matches[0].slice(VISITOR_COOKIE_NAME.length + 1);
  const parts = /^v1\.([A-Za-z0-9_-]{43})\.([1-9][0-9]{0,11})\.([A-Za-z0-9_-]{43})$/.exec(value);
  if (!parts || !canonicalBase64(parts[1])) return null;
  const expires = Number(parts[2]);
  if (!validExpiry(expires, now) || !validSignature(parts[3], signatureFor(secret, parts[1], expires))) return null;
  return ownVisitor({ nonce: parts[1], expires, signature: parts[3] });
}

/** Called only by the server handler after successful Turnstile verification.
 * No sliding refresh: existing valid cookies retain their original expiry.
 * @param {VisitorOptions} [options]
 * @returns {{visitor: VerifiedVisitor, header: string}}
 */
export function createVisitorCookie(options = {}) {
  const env = options.env ?? process.env;
  if (env.CHAT_TURNSTILE_ENABLED !== "true") throw new VisitorCookieError();
  const secret = signingSecret(env);
  const nonce = randomBytes(32).toString("base64url");
  const expires = currentSeconds(options) + VISITOR_MAX_AGE_SECONDS;
  const signature = signatureFor(secret, nonce, expires);
  const visitor = ownVisitor({ nonce, expires, signature });
  return {
    visitor,
    header: `${VISITOR_COOKIE_NAME}=v1.${nonce}.${expires}.${signature}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=${VISITOR_MAX_AGE_SECONDS}`,
  };
}

/** Process-owned proof check used by quota identity resolution. JSON and object
 * clones cannot choose a visitor ID; a proof also remains bound to its signing
 * secret and original expiry. Never accept a raw visitor ID from request data.
 * @param {unknown} visitor
 * @param {VisitorOptions} [options]
 * @returns {string | null}
 */
export function readVerifiedVisitor(visitor, options = {}) {
  const env = options.env ?? process.env;
  if (env.CHAT_TURNSTILE_ENABLED !== "true") return null;
  const record = visitor && typeof visitor === "object" ? verifiedVisitors.get(visitor) : undefined;
  if (!record) return null;
  if (!validExpiry(record.expires, currentSeconds(options)) ||
      !validSignature(record.signature, signatureFor(signingSecret(env), record.nonce, record.expires))) return null;
  return record.nonce;
}
