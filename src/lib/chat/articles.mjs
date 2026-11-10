import { assertPublicChatAccess } from "./access.mjs";
import { APPROVED_OFFICE_ARTICLES } from "./article-catalog.mjs";
import { prepareChatText, readBoundedJson } from "./protocol.mjs";

const endpoint = "https://hwu5yvsr.api.sanity.io/v2024-01-01/data/query/production";
const catalog = new Map(APPROVED_OFFICE_ARTICLES.map((article) => [article.documentId, article]));
const maxResponseBytes = 512 * 1024;
const maxArticleCharacters = 100_000;
const requestTimeoutMs = 3000;

// The identity, slug and author must match the SAME approved binding, before
// fetching any content. Parameters and endpoint are application-owned constants.
const query = `*[
  _type == "article" && !(_id in path("drafts.**")) && !(_id in path("versions.**")) &&
  defined(publishedAt) && dateTime(publishedAt) <= dateTime($now) && _id in $approved[].documentId &&
  count($approved[documentId == ^._id && slug == ^.slug.current && authorId == ^.author._ref]) > 0
] | order(_id asc) {
  _id, "slug": slug.current, publishedAt, "authorId": author._ref,
  title, excerpt, "content": pt::text(body)
}`;

const stopwords = new Set((
  "και για την των τον του της τις τους στο στη στην στον στα ειναι ενα μια εχω πως ποιος ποια ποιο τι " +
  "θελω μπορω μπορει χρειαζεται αυτο αυτη αυτα απο που νομοσ δικαιο " +
  "the and for with this that what which have does can about law legal " +
  "der die das den dem des ein eine einer eines und ist sind mit fur von wie was kann ich recht"
).split(" "));

// Small retrieval vocabulary bridges the site's Greek articles and its English
// and German chat interfaces. This supplies search terms, never legal facts.
const topicTerms = [
  [["κατσελ", "katsel", "3869"], ["κατσελ", "3869"]],
  [["εξωδικασ", "εξοδικασ", "extrajudic", "aussergericht", "schuldenregulier", "schuldenregel", "4738", "debt settlement"], ["εξωδικασ", "4738"]],
  [["πλειστηριασ", "auction", "foreclos", "zwangsversteiger"], ["πλειστηριασ"]],
  [["fund", "servicer", "debt", "schuld", "χρεο", "οφειλ"], ["fund", "servicer", "χρε", "οφειλ"]],
  [["ανακοπ", "objection", "payment order", "zahlungsbefehl", "widerspruch"], ["ανακοπ", "διαταγ", "πληρωμ"]],
  [["κατασχ", "seiz", "garnish", "pfand", "bank account", "bankkonto", "λογαριασ"], ["κατασχ", "λογαριασ"]],
  [["ακινητ", "property", "real estate", "immobil", "αγορα"], ["ακινητ", "αγορα"]],
  [["εταιρ", "company", "business", "corporat", "gesellschaft", "unternehmen", "ιδρυσ"], ["εταιρ", "ιδρυσ"]],
];

function normalize(text) {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/ς/g, "σ").replace(/ß/g, "ss");
}

function searchTerms(question) {
  const normalized = normalize(question);
  const tokens = (normalized.match(/[\p{L}\p{N}]+/gu) || [])
    .filter((word) => word.length >= 3 && !stopwords.has(word))
    .map((word) => /[α-ω]/u.test(word) && word.length > 5 ? word.slice(0, 5) : word);
  for (const [triggers, additions] of topicTerms) {
    if (triggers.some((term) => normalized.includes(term))) tokens.push(...additions);
  }
  return [...new Set(tokens)].slice(0, 80);
}

function relevance(text, terms) {
  const words = normalize(text).match(/[\p{L}\p{N}]+/gu) || [];
  return terms.reduce((score, term) => score + (words.some((word) => word.startsWith(term)) ? 1 : 0), 0);
}

function clipText(text, maxCharacters, maxBytes) {
  let result = "";
  let bytes = 0;
  let characters = 0;
  for (const character of text) {
    const nextBytes = new TextEncoder().encode(character).byteLength;
    if (characters === maxCharacters || bytes + nextBytes > maxBytes) break;
    result += character;
    characters += 1;
    bytes += nextBytes;
  }
  return result;
}

function bestExcerpt(content, terms) {
  const characters = Array.from(content);
  let best = { text: "", score: -1 };
  // Overlapping windows cover the entire body, including a single large span
  // pasted from Word. A useful paragraph near the end must remain discoverable.
  for (let offset = 0; offset < characters.length; offset += 900) {
    const text = characters.slice(offset, offset + 1200).join("");
    const score = relevance(text, terms);
    if (score > best.score) best = {
      text: `${offset ? "…" : ""}${text}${offset + 1200 < characters.length ? "…" : ""}`,
      score,
    };
  }
  return best;
}

function validateArticles(payload, nowMs) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.result) ||
      payload.result.length > APPROVED_OFFICE_ARTICLES.length) throw new Error("invalid_articles");
  const seen = new Set();
  return payload.result.map((record) => {
    const binding = record && typeof record === "object" ? catalog.get(record._id) : undefined;
    if (!binding || seen.has(record._id) || record.slug !== binding.slug || record.authorId !== binding.authorId ||
        typeof record.publishedAt !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(record.publishedAt)) {
      throw new Error("invalid_articles");
    }
    const publishedMs = Date.parse(record.publishedAt);
    if (!Number.isFinite(publishedMs) || publishedMs > nowMs ||
        new Date(publishedMs).toISOString().slice(0, 19) !== record.publishedAt.slice(0, 19)) {
      throw new Error("invalid_articles");
    }
    const title = prepareChatText(record.title, 200);
    const content = prepareChatText(record.content, maxArticleCharacters);
    const excerpt = record.excerpt == null || record.excerpt === "" ? "" : prepareChatText(record.excerpt, 2000);
    if (!title || !content || excerpt === null) throw new Error("invalid_articles");
    seen.add(record._id);
    return { binding, title, content, excerpt, publishedAt: record.publishedAt };
  });
}

/**
 * Tokenless public reads only. The caller must hold the server-issued public
 * principal before this function constructs a request. Unknown, changed or
 * unpublished identity bindings fail closed; outages leave static sources usable.
 * `now` and `fetcher` are server-bound test dependencies, never request fields.
 * @param {unknown} principal
 * @param {unknown} question
 * @param {{fetcher?: typeof fetch, now?: (() => number) | number}} [options]
 * @returns {Promise<Array<{id: string, title: string, url: string, content: string}>>}
 */
export async function getPublicArticleSources(principal, question, { fetcher = fetch, now = Date.now } = {}) {
  assertPublicChatAccess(principal, "public");
  const safeQuestion = prepareChatText(question, 2000);
  if (!safeQuestion) return [];
  const terms = searchTerms(safeQuestion);
  if (!terms.length) return [];

  const controller = new AbortController();
  let timer;
  try {
    const nowMs = typeof now === "function" ? now() : now;
    if (typeof nowMs !== "number" || !Number.isFinite(nowMs)) return [];
    const url = new URL(endpoint);
    url.searchParams.set("perspective", "published");
    url.searchParams.set("query", query);
    url.searchParams.set("$now", JSON.stringify(new Date(nowMs).toISOString()));
    url.searchParams.set("$approved", JSON.stringify(APPROVED_OFFICE_ARTICLES.map(({ documentId, slug, authorId }) =>
      ({ documentId, slug, authorId }))));

    const payload = await Promise.race([
      (async () => {
        const response = await fetcher(url.href, {
          method: "GET", headers: { Accept: "application/json" }, credentials: "omit",
          cache: "no-store", redirect: "error", signal: controller.signal,
        });
        if (!response.ok || response.redirected) throw new Error("article_fetch_failed");
        return readBoundedJson(response, maxResponseBytes);
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error("article_timeout"));
        }, requestTimeoutMs);
      }),
    ]);
    const articles = validateArticles(payload, nowMs);
    return articles.map((article) => {
      const excerpt = bestExcerpt(article.content, terms);
      const score = excerpt.score + relevance(article.title, terms) * 3 + relevance(article.excerpt, terms);
      return { ...article, excerpt: excerpt.text, score };
    }).filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || b.publishedAt.localeCompare(a.publishedAt) || a.binding.documentId.localeCompare(b.binding.documentId))
      .slice(0, 2)
      .map(({ binding, title, excerpt, publishedAt }) => ({
        id: binding.sourceId,
        title,
        url: `https://ioannispapaioannou.lawyer/el/blog/${binding.slug}`,
        content: clipText(
          `ΑΡΘΡΟ ΤΟΥ ΓΡΑΦΕΙΟΥ — του δικηγόρου Ιωάννη Παπαϊωάννου. Δημοσίευση ${publishedAt.slice(0, 10)}. Απόσπασμα σχολιασμού/άποψης του συντάκτη, όχι επίσημο κείμενο νόμου ή επαλήθευση του ισχύοντος δικαίου.\n${excerpt}`,
          1500, 3000,
        ),
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
