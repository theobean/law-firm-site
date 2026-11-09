import { isApprovedPublicChatSourceId } from "./access.mjs";
import { prepareChatText } from "./protocol.mjs";

export const MAX_EVIDENCE_PASSAGE_CHARACTERS = 300;
export const MIN_EVIDENCE_PASSAGE_CHARACTERS = 20;
export const MAX_EVIDENCE_SOURCES = 12;
export const MAX_EVIDENCE_PASSAGES_PER_SOURCE = 64;
export const MAX_EVIDENCE_ENUM_CHARACTERS = 90000;

/** Exact passages only: source content is never rewritten or shortened. The
 * request keeps the full source alongside these generation-time choices.
 * Prefer sentence endings, then word boundaries, within the character ceiling.
 * A short final tail overlaps the preceding text instead of being discarded.
 * @param {string} content
 * @returns {readonly string[]}
 */
export function evidencePassages(content) {
  if (typeof content !== "string" || prepareChatText(content, 6000) !== content || content.length < MIN_EVIDENCE_PASSAGE_CHARACTERS) {
    throw new Error("invalid_evidence_source");
  }
  const passages = new Set();
  let start = 0;
  while (start < content.length) {
    while (start < content.length && /\s/u.test(content[start])) start++;
    if (start === content.length) break;
    let end = Math.min(content.length, start + MAX_EVIDENCE_PASSAGE_CHARACTERS);
    // Do not cut a UTF-16 surrogate pair in the hard fallback for long words.
    if (end < content.length && /[\uD800-\uDBFF]/u.test(content[end - 1])) end--;
    if (end < content.length) {
      const window = content.slice(start, end);
      const sentences = [...window.matchAll(/[.!?;\u037E\u00B7](?=\s|$)|\n+/gu)]
        .map((match) => match.index + match[0].length)
        .filter((offset) => offset >= MIN_EVIDENCE_PASSAGE_CHARACTERS);
      const sentenceEnd = sentences.at(-1);
      const words = [...window.matchAll(/\s+/gu)].map((match) => match.index)
        .filter((offset) => offset >= MIN_EVIDENCE_PASSAGE_CHARACTERS);
      end = start + (sentenceEnd ?? words.at(-1) ?? window.length);
    }
    let passage = content.slice(start, end).trim();
    if (passage.length < MIN_EVIDENCE_PASSAGE_CHARACTERS) {
      // Retain the entire tail as an exact, overlapping source substring.
      let overlap = Math.max(0, end - MIN_EVIDENCE_PASSAGE_CHARACTERS);
      while (overlap > 0 && end - overlap < MAX_EVIDENCE_PASSAGE_CHARACTERS && !/\s/u.test(content[overlap - 1])) overlap--;
      if (overlap > 0 && /[\uDC00-\uDFFF]/u.test(content[overlap])) overlap++;
      passage = content.slice(overlap, end).trim();
    }
    if (passage.length < MIN_EVIDENCE_PASSAGE_CHARACTERS || passage.length > MAX_EVIDENCE_PASSAGE_CHARACTERS) {
      throw new Error("invalid_evidence_passage");
    }
    passages.add(passage);
    if (passages.size > MAX_EVIDENCE_PASSAGES_PER_SOURCE) throw new Error("evidence_schema_too_large");
    start = end;
  }
  if (!passages.size) throw new Error("invalid_evidence_source");
  return Object.freeze([...passages]);
}

/** Nested anyOf pairs each quote enum with its own authorized source ID.
 * Strict output cannot invent a quote or attach another source's passage.
 * Bounds leave room below the provider's aggregate enum/string limits; the
 * complete serialized request is independently subject to the 64K byte guard.
 * This constrains provenance, not semantic entailment of the model's answer.
 * @param {readonly {id: string, content: string}[]} sources
 */
export function buildEvidenceSchema(sources) {
  if (!Array.isArray(sources) || !sources.length || sources.length > MAX_EVIDENCE_SOURCES ||
      new Set(sources.map((source) => source?.id)).size !== sources.length) throw new Error("invalid_evidence_sources");
  let enumCharacters = 0;
  const anyOf = sources.map((source) => {
    if (!source || !isApprovedPublicChatSourceId(source.id)) throw new Error("invalid_evidence_source");
    const quotes = evidencePassages(source.content);
    enumCharacters += source.id.length + quotes.reduce((total, quote) => total + quote.length, 0);
    if (enumCharacters > MAX_EVIDENCE_ENUM_CHARACTERS) throw new Error("evidence_schema_too_large");
    return {
      type: "object", additionalProperties: false,
      properties: {
        sourceId: { type: "string", enum: [source.id] },
        quote: { type: "string", enum: [...quotes] },
      },
      required: ["sourceId", "quote"],
    };
  });
  return { type: "array", maxItems: 4, items: { anyOf } };
}
