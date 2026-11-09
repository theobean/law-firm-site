import { assertPublicChatAccess, ChatAccessError, isApprovedPublicChatSourceId } from "./access.mjs";
import { REVIEWED_LEGAL_SOURCES } from "./legal-catalog.mjs";
import { parseChatSourceLink, prepareChatText } from "./protocol.mjs";

export const MAX_LEGAL_SOURCES = 4;
export const MAX_LEGAL_CONTEXT_BYTES = 10000;
const encoder = new TextEncoder();
const ambiguousKeywords = new Set([
  "συμβολαιογραφ", "notar", "notary", "δικηγορ", "lawyer", "anwalt",
  "εταιρει", "company", "gesellschaft", "συσταση", "ιδρυση", "εγγραφ", "διορθωσ", "παραπον", "αρμοδιοτ",
]);
const exactTerms = new Set(["δεδ", "δεκ", "ααδε", "απδπχ", "γκπδ", "gdpr", "γεμη", "υμσ", "ικε", "επε", "κμπ", "κευδ", "γευδ"]);
const phraseGlue = new Set((
  "ο η το οι τα τον την του τησ των ενα εναν μια στο στον στη στην σε να με για απο μου μασ τουσ " +
  "a an the of to for my our your " +
  "der die das den dem des ein eine einen einer einem fur von zu mein meine meinen"
).split(" "));

function words(text) {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/ς/g, "σ").replace(/ß/g, "ss").match(/[\p{L}\p{N}]+/gu) ?? [];
}

function matches(word, stem) {
  // Statute numbers must be exact: 38690 cannot select Law 3869.
  // These complete English terms are not stems for "fundamental"/"willing".
  if (stem === "fund" || stem === "will") return word === stem || word === `${stem}s`;
  if (["φαντ", "φουντ", "intrum", "cepal", "dovalue", "qquant"].includes(stem)) return word === stem;
  if (exactTerms.has(stem) || phraseGlue.has(stem)) return word === stem;
  // μίσθωση/μισθωτής concern tenancy, not the salary/employee sense of μισθός.
  if (stem === "μισθ" && /^μισθω(?:σ|μ|τ[ηρ])/u.test(word)) return false;
  if (stem === "μισθω" && (word === "μισθων" || /^μισθωτ[οω]/u.test(word))) return false;
  return /^\d+$/u.test(stem) ? word === stem : word.startsWith(stem);
}

function phraseMatch(queryWords, terms, offset) {
  if (!matches(queryWords[offset], terms[0])) return null;
  const positions = [offset];
  let cursor = offset + 1;
  let gaps = 0;
  for (const term of terms.slice(1)) {
    let localGaps = 0;
    while (cursor < queryWords.length && !matches(queryWords[cursor], term) &&
        phraseGlue.has(queryWords[cursor]) && localGaps < 2 && gaps < 4) {
      cursor++;
      localGaps++;
      gaps++;
    }
    if (cursor >= queryWords.length || !matches(queryWords[cursor], term)) return null;
    positions.push(cursor++);
  }
  return positions;
}

function matchMetadata(source, queryWords) {
  const covered = new Set();
  let strongest = 0;
  const matchedKeywords = [];
  for (const keyword of source.keywords) {
    const terms = words(keyword);
    if (!terms.length) continue;
    let found = false;
    for (let offset = 0; offset <= queryWords.length - terms.length; offset++) {
      const positions = phraseMatch(queryWords, terms, offset);
      if (!positions) continue;
      found = true;
      positions.forEach((index) => covered.add(index));
    }
    if (found) {
      matchedKeywords.push(terms.join(" "));
      strongest = Math.max(strongest, terms.some((term) => /^\d{3,}$/u.test(term)) ? 60 : terms.length > 1 ? 12 + terms.length * 3 : 8);
    }
  }
  return {
    score: strongest ? strongest + covered.size * 3 + Math.min(matchedKeywords.length, 3) : 0,
    explicit: matchedKeywords.some((keyword) => !ambiguousKeywords.has(keyword)),
  };
}

const relevance = (source, queryWords) => matchMetadata(source, queryWords).score;

function approvedMetadata(principal, sources) {
  assertPublicChatAccess(principal, "public");
  const eligible = sources.filter((source) => source && typeof source.id === "string" && isApprovedPublicChatSourceId(source.id) &&
    (source.visibility === undefined || source.visibility === "public") &&
    (source.publication === undefined || source.publication === "published") &&
    ["original-gazette", "official-guidance"].includes(source.kind) &&
    /^\d{4}-\d{2}-\d{2}$/u.test(source.reviewedAt) &&
    Array.isArray(source.topics) && source.topics.length && source.topics.every((topic) => typeof topic === "string" && topic) &&
    Array.isArray(source.keywords) && source.keywords.every((keyword) => typeof keyword === "string" && keyword));
  if (new Set(eligible.map(({ id }) => id)).size !== eligible.length) throw new ChatAccessError();
  return eligible;
}

/** Approved public topic metadata only: no factual content or reader is used.
 * Ambiguous role words cannot establish a new topic or authorize a source.
 * @param {unknown} principal
 * @param {unknown} question
 * @param {{sources?: typeof REVIEWED_LEGAL_SOURCES}} [options]
 */
export function getReviewedLegalTopicMatches(principal, question, { sources = REVIEWED_LEGAL_SOURCES } = {}) {
  const eligible = approvedMetadata(principal, sources);
  const safeQuestion = prepareChatText(question, 2000);
  if (!safeQuestion) return Object.freeze([]);
  const queryWords = words(safeQuestion);
  return Object.freeze(eligible.map((source) => ({ source, ...matchMetadata(source, queryWords) }))
    .filter(({ score, explicit }) => score > 0 && explicit)
    .sort((a, b) => b.score - a.score || a.source.id.localeCompare(b.source.id, "en"))
    .map(({ source, score }) => Object.freeze({ id: source.id, topics: Object.freeze([...source.topics]), score })));
}

/** Partial compound-keyword metadata can resolve a dependent user question only
 * against an existing topic. It never selects factual context on its own.
 * @param {unknown} principal
 * @param {unknown} question
 * @param {{sources?: typeof REVIEWED_LEGAL_SOURCES}} [options]
 */
export function getReviewedLegalTopicHints(principal, question, { sources = REVIEWED_LEGAL_SOURCES } = {}) {
  const eligible = approvedMetadata(principal, sources);
  const safeQuestion = prepareChatText(question, 2000);
  if (!safeQuestion) return Object.freeze([]);
  const queryWords = words(safeQuestion);
  return Object.freeze(eligible.filter((source) => source.keywords.some((keyword) => {
    const terms = words(keyword);
    return terms.length > 1 && terms.some((term) => term.length >= 4 && !/^\d+$/u.test(term) &&
      !phraseGlue.has(term) && !ambiguousKeywords.has(term) && queryWords.some((word) => matches(word, term)));
  })).map((source) => Object.freeze({ id: source.id, topics: Object.freeze([...source.topics]) })));
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
  const eligible = approvedMetadata(principal, sources);
  const safeQuestion = prepareChatText(question, 2000);
  if (!safeQuestion) return Object.freeze([]);
  const queryWords = words(safeQuestion);
  const scored = eligible.map((source) => ({ source, ...matchMetadata(source, queryWords) }))
    .filter(({ score, explicit }) => score > 0 && explicit);
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
