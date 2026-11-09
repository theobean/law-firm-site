import { assertPublicChatAccess, ChatAccessError, isApprovedPublicChatSourceId } from "./access.mjs";
import { REVIEWED_LEGAL_SOURCES } from "./legal-catalog.mjs";
import { parseChatSourceLink, prepareChatText } from "./protocol.mjs";

export const MAX_LEGAL_SOURCES = 4;
export const MAX_LEGAL_CONTEXT_BYTES = 10000;
const encoder = new TextEncoder();

function words(text) {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/ς/g, "σ").replace(/ß/g, "ss").match(/[\p{L}\p{N}]+/gu) ?? [];
}

function matches(word, stem) {
  // Statute numbers must be exact: 38690 cannot select Law 3869.
  // These complete English terms are not stems for "fundamental"/"willing".
  if (stem === "fund" || stem === "will") return word === stem || word === `${stem}s`;
  return /^\d+$/u.test(stem) ? word === stem : word.startsWith(stem);
}

function relevance(source, queryWords) {
  const covered = new Set();
  let strongest = 0;
  let matchedKeywords = 0;
  for (const keyword of source.keywords) {
    const terms = words(keyword);
    if (!terms.length) continue;
    let found = false;
    for (let offset = 0; offset <= queryWords.length - terms.length; offset++) {
      if (!terms.every((term, index) => matches(queryWords[offset + index], term))) continue;
      found = true;
      terms.forEach((_, index) => covered.add(offset + index));
    }
    if (found) {
      matchedKeywords++;
      strongest = Math.max(strongest, terms.some((term) => /^\d{3,}$/u.test(term)) ? 60 : terms.length > 1 ? 12 + terms.length * 3 : 8);
    }
  }
  return strongest ? strongest + covered.size * 3 + Math.min(matchedKeywords, 3) : 0;
}

/** Count the same JSON/XML-escaped reference fields sent to the provider, plus
 * the selected-ID schema enum. Whole excerpts include their provenance label. */
export function legalContextBytes(sources) {
  const reference = JSON.stringify(sources.map(({ id, title, content }) => ({ id, title, content })))
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return encoder.encode(reference).byteLength + encoder.encode(JSON.stringify(sources.map(({ id }) => id))).byteLength;
}

function project(source) {
  const link = parseChatSourceLink(source);
  const content = prepareChatText(source.content, 6000);
  if (!link || !content) throw new ChatAccessError();
  const label = source.kind === "original-gazette"
    ? "ΠΡΩΤΟΓΕΝΗΣ ΝΟΜΟΘΕΣΙΑ — ΑΡΧΙΚΟ ΦΕΚ"
    : "ΕΠΙΣΗΜΗ ΚΑΘΟΔΗΓΗΣΗ — ΕΛΕΓΜΕΝΟ ΑΠΟΣΠΑΣΜΑ";
  return Object.freeze({ id: source.id, ...link, content: `${label}. Έλεγχος πηγής ${source.reviewedAt}.\n${content}` });
}

/** Deterministic selection from reviewed public metadata, never web research.
 * `sources` is a trusted test/configuration dependency, not HTTP request data.
 * Source approval precedes ranking and every content read. The context factory
 * independently rechecks approval and projects the selected records afterward.
 * @param {unknown} principal
 * @param {unknown} question
 * @param {{sources?: typeof REVIEWED_LEGAL_SOURCES}} [options]
 */
export function selectReviewedLegalSources(principal, question, { sources = REVIEWED_LEGAL_SOURCES } = {}) {
  assertPublicChatAccess(principal, "public");
  const safeQuestion = prepareChatText(question, 2000);
  if (!safeQuestion) return Object.freeze([]);
  const queryWords = words(safeQuestion);
  const eligible = sources.filter((source) => source && typeof source.id === "string" && isApprovedPublicChatSourceId(source.id) &&
    (source.visibility === undefined || source.visibility === "public") &&
    (source.publication === undefined || source.publication === "published") &&
    ["original-gazette", "official-guidance"].includes(source.kind) &&
    /^\d{4}-\d{2}-\d{2}$/u.test(source.reviewedAt) &&
    Array.isArray(source.topics) && source.topics.length && source.topics.every((topic) => typeof topic === "string" && topic) &&
    Array.isArray(source.keywords) && source.keywords.every((keyword) => typeof keyword === "string" && keyword));
  if (new Set(eligible.map(({ id }) => id)).size !== eligible.length) throw new ChatAccessError();
  const scored = eligible.map((source) => ({ source, score: relevance(source, queryWords) }))
    .filter(({ score }) => score > 0);
  const stable = (a, b) => b.score - a.score || a.source.id.localeCompare(b.source.id, "en");
  scored.sort(stable);
  const selected = [];
  const selectedIds = new Set();
  const coveredTopics = new Set();
  const loaded = new Map();
  const sharesTopic = (a, b) => a.topics.some((topic) => b.topics.includes(topic));
  const add = (source) => {
    if (selectedIds.has(source.id) || selected.length >= MAX_LEGAL_SOURCES) return;
    if (!loaded.has(source.id)) loaded.set(source.id, project(source));
    const record = loaded.get(source.id);
    if (legalContextBytes([...selected, record]) > MAX_LEGAL_CONTEXT_BYTES) return;
    selected.push(record);
    selectedIds.add(source.id);
    source.topics.forEach((topic) => coveredTopics.add(topic));
  };

  while (scored.length && selected.length < MAX_LEGAL_SOURCES) {
    // Prefer an equally relevant uncovered topic over repeated explanations.
    const adjusted = ({ source, score }) => score * (source.topics.every((topic) => !coveredTopics.has(topic)) ? 1 : .6);
    scored.sort((a, b) => adjusted(b) - adjusted(a) || stable(a, b));
    const { source } = scored.shift();
    if (selectedIds.has(source.id)) continue;
    const primary = eligible.filter((candidate) => candidate.kind === "original-gazette" && sharesTopic(source, candidate))
      .sort((a, b) => relevance(b, queryWords) - relevance(a, queryWords) || a.id.localeCompare(b.id, "en"))[0];
    if (primary) add(primary);
    add(source);
    if (source.kind === "original-gazette") {
      const guidance = eligible.filter((candidate) => candidate.kind === "official-guidance" && sharesTopic(source, candidate))
        .sort((a, b) => relevance(b, queryWords) - relevance(a, queryWords) || a.id.localeCompare(b.id, "en"))[0];
      if (guidance) add(guidance);
    }
  }
  return Object.freeze(selected);
}
