import { assertPublicChatAccess, isApprovedPublicChatSourceId } from "./access.mjs";
import { prepareChatText } from "./protocol.mjs";

// Search metadata only. Public-page wording is read separately, after source
// authorization; these terms never supply legal facts or grant permissions.
export const PROPERTY_SOURCE_METADATA = Object.freeze([
  { id: "office-property-services", path: "/practice-areas/realEstate", topics: ["property-purchase"] },
  { id: "office-property-athens", path: "/practice-areas/realEstate/agora-akinitou-athina", topics: ["property-purchase", "property-athens"] },
  { id: "office-property-new-build", path: "/practice-areas/realEstate/agora-neodmitou", topics: ["property-purchase", "property-new-build"] },
  { id: "office-property-deposit-guide", path: "/blog/prokatavoli-agora-akinitou", topics: ["property-purchase", "property-deposit"] },
  { id: "office-article-d1fca9c5-06ac-4185-a2fd-6b00f82589bb", path: "/blog/agora-akiniton-vimata", topics: ["property-purchase"] },
].map((source) => Object.freeze({ ...source, topics: Object.freeze(source.topics) })));

function words(text) {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/ς/g, "σ").replace(/ß/g, "ss").match(/[\p{L}\p{N}]+/gu) ?? [];
}

function cues(question) {
  const safe = prepareChatText(question, 2000);
  if (!safe) return null;
  const tokens = words(safe);
  const text = tokens.join(" ");
  const has = (pattern) => tokens.some((word) => pattern.test(word));
  // εργολαβικό alone can mean a lawyer's contingency-fee agreement; only the
  // unambiguous new-build vocabulary establishes this property topic.
  const newBuild = has(/^(?:νεοδμητ|νεοκτιστ|neubau)/u) || /(?:^| )new build(?: |$)/u.test(text);
  const property = newBuild || has(/^(?:property|properties|house|houses|apartment|apartments|flat|flats|home|homes|haus|hauser|hauskauf)$/u) ||
    has(/^(?:ακινητ|διαμερισ|οικοπεδ|σπιτ|κατοικ|immobil|wohnung|grundstuck|hauser)/u) || /(?:^| )real estate(?: |$)/u.test(text);
  const purchase = has(/^(?:αγορ|αγοραπωλη|πωλησ|purchase|buy|buying|kauf|kaufen|erwerb|hauskauf|immobilienkauf)/u);
  const titleCheck = has(/^(?:τιτλ|βαρ|υποθηκ|προσυμφων|σχεδι|encumbrance|title|mortgage|draft|eigentumstitel|belastung|hypothek|vertragsentwurf)/u);
  const service = has(/^(?:γραφει|αναλαμβαν|υπηρεσ|ελεγχ|office|firm|service|handle|assist|review|check|kanzlei|ubernehm|leistung|begleit|pruf)/u);
  const otherContext = has(/^(?:ενοικ|μισθω|rental|renting|lease|tenancy|miet|bail|ποινικ|φυλακ|αστυνομ|hotel|ξενοδοχ|διακοπ|salary|μισθο|καιρ|weather|wetter|fund|servicer|debt|οφειλ|χρεο|πλειστηριασ|κατασχ|foreclos|auction|zwangs|pfand|κληρονομ|διαθηκ|inherit|succession|erbsch|κτηματολογ|cadastre|cadastr|grundbuch|φορο|tax|ενφια|enfia|steuer)/u);
  const deposit = has(/^(?:προκαταβολ|αρραβων|deposit|anzahlung)/u) || /(?:^| )advance payment(?: |$)/u.test(text);
  const guide = has(/^(?:οδηγ|βημα|steps|guide|schritt|leitfaden)/u);
  const engineerWord = /^(?:μηχανικ\p{L}*|engineers?|ingenieur(?:e|en|in|innen)?)$/u;
  const engineer = has(engineerWord);
  // A short dependent role question can borrow an established purchase topic;
  // a career/education question mentioning an engineer cannot do so.
  const roleWords = /^(?:και|ο|η|οι|το|του|τησ|των|τι|ποιοσ|ποια|ποιο|πωσ|γιατι|κανει|κανουν|ελεγχει|ελεγχουν|ρολοσ|ρολο|and|the|what|does|do|check|checks|role|is|his|her|their|und|der|die|den|des|was|pruft|prufen|macht|machen|rolle|ist|seine|ihre)$/u;
  const engineerHint = engineer && tokens.length <= 12 && tokens.every((word) => engineerWord.test(word) || roleWords.test(word));
  return {
    explicit: property && (purchase || newBuild || titleCheck || service || deposit || guide) && (!otherContext || purchase),
    otherContext,
    athens: has(/^(?:αθην|αττικ|athens|attica|athen|attika)/u),
    newBuild,
    deposit,
    guide,
    titleCheck,
    engineer,
    engineerHint,
  };
}

function eligible(principal) {
  assertPublicChatAccess(principal, "public");
  return PROPERTY_SOURCE_METADATA.filter(({ id }) => isApprovedPublicChatSourceId(id));
}

function project(source, score) {
  return Object.freeze({ id: source.id, topics: source.topics, score });
}

/** Explicit property-purchase metadata only. A deposit or a place name alone
 * cannot establish a purchase topic. @param {unknown} principal @param {unknown} question */
export function getPropertyTopicMatches(principal, question) {
  const metadata = eligible(principal);
  const found = cues(question);
  if (!found?.explicit) return Object.freeze([]);
  return Object.freeze(metadata.map((source) => {
    const score = source.id === "office-property-athens" ? (found.athens ? 85 : 0)
      : source.id === "office-property-new-build" ? (found.newBuild ? 90 : 0)
        : source.id === "office-property-deposit-guide" ? (found.deposit ? 95 : 0)
          : source.id === "office-property-services" ? 30 + (found.titleCheck ? 5 : 0)
            : 25 + (found.guide || found.engineer ? 20 : 0);
    return project(source, score);
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)));
}

/** Ambiguous details may retain only a compatible preceding USER topic. They
 * never select factual context on their own. @param {unknown} principal @param {unknown} question */
export function getPropertyTopicHints(principal, question) {
  const metadata = eligible(principal);
  const found = cues(question);
  if (!found || found.otherContext) return Object.freeze([]);
  return Object.freeze(metadata.filter((source) =>
    source.id === "office-property-athens" ? found.athens
      : source.id === "office-property-new-build" ? found.newBuild
        : source.id === "office-property-deposit-guide" ? found.deposit
          : found.titleCheck || found.engineerHint,
  ).map((source) => project(source, 1)));
}
