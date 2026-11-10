/** @typedef {{title: string, url: string}} ChatSourceLink */
/** @typedef {{answer: string, sources: ChatSourceLink[], suggestContact: boolean}} ChatResponse */

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/**
 * Prepare plain text, not HTML. Keep accents, emoji and meaningful joiners.
 * Reject malformed UTF-16; remove non-printing controls and direction overrides.
 * This is text hygiene, not a defense against semantic prompt injection.
 * @param {unknown} value
 * @param {number} maxLength
 * @returns {string | null}
 */
export function prepareChatText(value, maxLength) {
  if (typeof value !== "string" || value.length > maxLength || /[\uD800-\uDFFF]/u.test(value)) return null;
  const text = value.normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2028\u2029]/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00AD\u061C\u200B\u200E\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g, "")
    .trim();
  if (!text || text.length > maxLength || !text.replace(/[\s\u200C\u200D]/gu, "")) return null;
  return text;
}

/** @param {unknown} value @returns {string | null} */
function sourceUrl(value) {
  // Do not let URL() silently discard controls or whitespace in a URL.
  if (typeof value !== "string" || value.length > 2048 || /[\s\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/u.test(value)) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

/** @param {unknown} value @returns {ChatSourceLink | null} */
export function parseChatSourceLink(value) {
  if (!isRecord(value)) return null;
  const title = prepareChatText(value.title, 200);
  const url = sourceUrl(value.url);
  return title && url ? { title, url } : null;
}

/** Validate both server output and the browser's received payload.
 * @param {unknown} value
 * @returns {ChatResponse | null}
 */
export function parseChatResponse(value) {
  if (!isRecord(value) || typeof value.suggestContact !== "boolean" ||
      !Array.isArray(value.sources) || value.sources.length > 4) return null;
  const answer = prepareChatText(value.answer, 4000);
  if (!answer) return null;
  /** @type {ChatSourceLink[]} */
  const sources = [];
  for (const source of value.sources) {
    const link = parseChatSourceLink(source);
    if (!link) return null;
    sources.push(link);
  }
  // Select fields explicitly; extra provider/client properties never become props.
  return { answer, sources, suggestContact: value.suggestContact };
}

/** Read JSON with a bound on actual streamed bytes, including chunked responses.
 * Shared by the incoming proxy request, provider response, and browser response.
 * @param {Request | Response} message
 * @param {number} [maxBytes]
 * @returns {Promise<unknown>}
 */
export async function readBoundedJson(message, maxBytes = 64 * 1024) {
  if (message.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new Error("invalid_request");
  }
  const declaredLength = message.headers.get("content-length");
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > maxBytes)) {
    if (message.body) await message.body.cancel();
    throw new Error("request_too_large");
  }
  if (!message.body) throw new Error("invalid_request");
  const reader = message.body.getReader();
  /** @type {Uint8Array[]} */
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error("request_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new Error("invalid_request");
  }
}
