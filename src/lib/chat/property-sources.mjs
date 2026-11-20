import el from "../../../messages/el.json" with { type: "json" };
import en from "../../../messages/en.json" with { type: "json" };
import de from "../../../messages/de.json" with { type: "json" };
import {
  PROPERTY_PURCHASE_GUIDES, PROPERTY_DEPOSIT_GUIDES,
  PROPERTY_ATHENS_PAGES, PROPERTY_NEW_BUILD_PAGES,
} from "../property-content.mjs";
import { assertPublicChatAccess, ChatAccessError, isApprovedPublicChatSourceId } from "./access.mjs";
import { prepareChatText } from "./protocol.mjs";
import { PROPERTY_SOURCE_METADATA, getPropertyTopicMatches } from "./property-topics.mjs";

export const MAX_PROPERTY_SOURCES = 2;
export const MAX_PROPERTY_CONTEXT_BYTES = 10000;
const translations = { el, en, de };
const origin = "https://ioannispapaioannou.lawyer";
const encoder = new TextEncoder();
const reviewLabel = "Έλεγχος επιλογής περιεχομένου 2026-11-20.";
const commentaryLabel = "ΔΗΜΟΣΙΕΥΜΕΝΟΣ ΟΔΗΓΟΣ ΤΟΥ ΓΡΑΦΕΙΟΥ — ενημερωτικός σχολιασμός, όχι επίσημο κείμενο νόμου ή επαλήθευση του ισχύοντος δικαίου.";

/** Same escaped reference fields and source-ID bytes used by legal retrieval. */
export function propertyContextBytes(sources) {
  const references = JSON.stringify(sources.map(({ id, title, content }) => ({ id, title, content })))
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return encoder.encode(references).byteLength + encoder.encode(JSON.stringify(sources.map(({ id }) => id))).byteLength;
}

// Explicit field selection excludes contact CTAs, intake prompts, calendars,
// marketing promises and unsupported rules about an individual agreement.
// Guide prose comes from the same data objects used by the public pages.
function readPropertyCard(id, locale) {
  if (id === "office-property-services") {
    const page = translations[locale].practiceAreas.areas.realEstate;
    return { title: page.purchase.heading, body: [page.desc, page.longDesc,
      ...page.purchase.steps.flatMap(({ title, text }) => [title, text])], guide: false };
  }
  if (id === "office-property-athens") {
    const page = PROPERTY_ATHENS_PAGES[locale];
    return { title: page.title, body: [page.description, page.intro], guide: false };
  }
  if (id === "office-property-new-build") {
    const page = PROPERTY_NEW_BUILD_PAGES[locale];
    return { title: page.title, body: [page.description, page.intro,
      ...page.checks.flatMap(({ title, text }) => [title, text])], guide: false };
  }
  if (id === "office-property-deposit-guide") {
    const page = PROPERTY_DEPOSIT_GUIDES[locale];
    return { title: page.title, body: [page.description, page.intro, page.checklistTitle, ...page.checklist,
      // The last scenario's extra notarial-form assertion is not promoted into
      // this general-information excerpt without a separate official review.
      ...page.scenarios.flatMap(({ title, paragraphs }, index) => [title, ...paragraphs.slice(0, index === 2 ? 1 : 2)])], guide: true };
  }
  if (id === "office-article-d1fca9c5-06ac-4185-a2fd-6b00f82589bb") {
    const page = PROPERTY_PURCHASE_GUIDES[locale];
    return { title: page.title, body: [page.excerpt,
      ...page.sections.flatMap(({ title, text }) => [title, text])], guide: true };
  }
  throw new ChatAccessError();
}

/** Select only reviewed public page fields; never crawl arbitrary URLs or CMS
 * records. Authentication and independent ID approval precede content readers.
 * @param {unknown} principal
 * @param {"el" | "en" | "de"} locale
 * @param {unknown} question
 */
export function getPublicPropertySources(principal, locale, question) {
  assertPublicChatAccess(principal, "public");
  if (!["el", "en", "de"].includes(locale)) throw new TypeError("Invalid property source locale");
  const safeQuestion = prepareChatText(question, 2000);
  if (!safeQuestion) return Object.freeze([]);
  const matches = getPropertyTopicMatches(principal, safeQuestion);
  const metadata = new Map(PROPERTY_SOURCE_METADATA.filter(({ id }) => isApprovedPublicChatSourceId(id))
    .map((source) => [source.id, source]));
  const selected = [];
  for (const match of matches) {
    if (selected.length >= MAX_PROPERTY_SOURCES) break;
    const source = metadata.get(match.id);
    if (!source) continue;
    const card = readPropertyCard(source.id, locale);
    const title = prepareChatText(card.title, 200);
    const content = prepareChatText([
      card.guide ? commentaryLabel : "ΠΛΗΡΟΦΟΡΙΕΣ ΓΡΑΦΕΙΟΥ — δημοσιευμένη περιγραφή υπηρεσιών ακινήτων, όχι νομική γνωμοδότηση.",
      reviewLabel, ...card.body,
    ].join("\n"), 6000);
    if (!title || !content) throw new ChatAccessError();
    const projected = Object.freeze({ id: source.id, title, url: `${origin}/${locale}${source.path}`, content });
    // Preserve complete selected paragraphs/qualifications instead of clipping.
    if (propertyContextBytes([...selected, projected]) <= MAX_PROPERTY_CONTEXT_BYTES) selected.push(projected);
  }
  return Object.freeze(selected);
}
