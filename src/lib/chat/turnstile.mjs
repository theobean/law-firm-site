import { isIP } from "node:net";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 5000;
const MAX_RESPONSE_BYTES = 32768;
const EXPECTED_ACTION = "lexi_chat";

export class TurnstileError extends Error {
  /** @param {"unauthorized" | "unavailable"} code */
  constructor(code) {
    super(code);
    this.name = "TurnstileError";
    this.code = code;
    this.status = code === "unauthorized" ? 401 : 503;
  }
}

/** @param {Record<string, string | undefined>} env */
function configuration(env) {
  const secret = env.CHAT_TURNSTILE_SECRET_KEY;
  const configuredHosts = env.CHAT_TURNSTILE_HOSTNAMES;
  if (typeof secret !== "string" || !secret || secret.length > 2048 || /\s|[\u0000-\u001f\u007f]/u.test(secret) ||
      typeof configuredHosts !== "string" || !configuredHosts || configuredHosts.length > 4096) {
    throw new TurnstileError("unavailable");
  }
  const hostnames = configuredHosts.split(",").map((host) => host.trim());
  // Exact ASCII hostnames only. No wildcard, URL, port, path or implicit suffix.
  if (!hostnames.length || hostnames.length > 32 || new Set(hostnames).size !== hostnames.length ||
      hostnames.some((host) => host.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/.test(host))) {
    throw new TurnstileError("unavailable");
  }
  return { secret, hostnames };
}

/** @param {Response} response @returns {Promise<unknown>} */
async function readBoundedJson(response) {
  const length = response.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_RESPONSE_BYTES)) throw new TurnstileError("unavailable");
  if (!response.body) throw new TurnstileError("unavailable");
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) throw new TurnstileError("unavailable");
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } finally {
    // Cancel on size/read/parse failures and release the stream's lock.
    try { await reader.cancel(); } catch { /* Provider body details stay private. */ }
    reader.releaseLock();
  }
}

/** Verify each submitted token with the fixed Cloudflare endpoint. Tokens are
 * single-use at Siteverify; failures, including replay, never mint a cookie.
 * @param {unknown} token
 * @param {{env?: Record<string, string | undefined>, fetcher?: typeof fetch, remoteIp?: string}} [options]
 * @returns {Promise<void>}
 */
export async function verifyTurnstileToken(token, options = {}) {
  if (typeof token !== "string" || !token || token.length > 2048 || token !== token.trim() || /[\u0000-\u0020\u007f]/u.test(token)) {
    throw new TurnstileError("unauthorized");
  }
  const { secret, hostnames } = configuration(options.env ?? process.env);
  const payload = new URLSearchParams({ secret, response: token });
  // The caller may supply an address only from its trusted hosting adapter.
  if (typeof options.remoteIp === "string" && isIP(options.remoteIp)) payload.set("remoteip", options.remoteIp);
  const controller = new AbortController();
  let timeout;
  const deadline = new Promise((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new TurnstileError("unavailable"));
    }, TIMEOUT_MS);
  });
  try {
    const verification = (async () => {
      const response = await (options.fetcher ?? fetch)(SITEVERIFY_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
        body: payload.toString(),
        credentials: "omit",
        redirect: "error",
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok || response.redirected) throw new TurnstileError("unavailable");
      if (response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") throw new TurnstileError("unavailable");
      const result = await readBoundedJson(response);
      if (!result || typeof result !== "object" || Array.isArray(result) || !("success" in result) || typeof result.success !== "boolean") {
        throw new TurnstileError("unavailable");
      }
      if (!result.success) {
        const codes = "error-codes" in result && Array.isArray(result["error-codes"]) ? result["error-codes"] : [];
        const unavailable = codes.some((code) => ["missing-input-secret", "invalid-input-secret", "internal-error"].includes(code));
        throw new TurnstileError(unavailable ? "unavailable" : "unauthorized");
      }
      if (!("hostname" in result) || typeof result.hostname !== "string" || !hostnames.includes(result.hostname) ||
          !("action" in result) || result.action !== EXPECTED_ACTION ||
          ("error-codes" in result && (!Array.isArray(result["error-codes"]) || result["error-codes"].length))) {
        throw new TurnstileError("unauthorized");
      }
    })();
    await Promise.race([verification, deadline]);
  } catch (error) {
    // Do not expose tokens, secrets, provider messages or network errors.
    throw error instanceof TurnstileError ? error : new TurnstileError("unavailable");
  } finally {
    clearTimeout(timeout);
  }
}
