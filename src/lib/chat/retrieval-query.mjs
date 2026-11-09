import { prepareChatText } from "./protocol.mjs";
import { getPublicChatPrincipal } from "./access.mjs";
import { getReviewedLegalTopicHints, getReviewedLegalTopicMatches } from "./legal-retrieval.mjs";

export const MAX_RETRIEVAL_QUERY_LENGTH = 2000;
export const MAX_RETRIEVAL_HISTORY_LENGTH = 800;
// The validated nine-message conversation has at most four prior user turns.
const MAX_RECENT_USER_TURNS = 4;
const MAX_FOLLOW_UP_LENGTH = 240;
const MAX_FOLLOW_UP_WORDS = 24;

// Only generic follow-up language belongs here. Legal topics, case facts and
// statute numbers deliberately do not: a new named topic must stand alone.
const followUpWords = new Set((
  "και δηλαδη δηλ αρα οποτε τοτε λοιπον επομενωσ εγω εμενα μου με μασ εμεισ εσεισ εσυ " +
  "τι πωσ γιατι τωρα μετα αυτο αυτοσ αυτη αυτα εκεινο εκεινη εκεινα ετσι " +
  "κανω κανωμε κανουμε κανετε γινεται γινει σημαινει εννοεισ εννοειτε εννοω " +
  "να θα πρεπει μπορω μπορει μπορουμε μπορεισ μπορειτε ειναι ισχυει αφορα " +
  "το τον την τα του τησ στο στη στην σε για απο με αυτο τοσο πιο λιγο απλα λογια περισσοτερα " +
  "πεσ πεισ πειτε εξηγησε εξηγεισ εξηγησεισ εξηγησετε παρακαλω ναι ποιο ποια ποιοσ περιπτωση δικη δικο " +
  "and so then now what how why i me my we us you it this that these those " +
  "do does did should can could would will am is are be mean means apply work works " +
  "to for about in on of the a an next more please explain tell put simply simple simpler plain words yes " +
  "und also dann jetzt was wie warum ich mich mir mein meine wir uns sie du " +
  "das dies diese dieser dazu damit es bedeutet heisst gilt geht weiter machen mache " +
  "tun soll sollte kann kannst konnen konnt konnte konntest bitte mehr erklaren erklarst einfach einfacher fur mit zu " +
  "in auf den dem der die ein eine einer noch nochmal nochmals ja"
).split(" "));
const followUpCues = new Set((
  "τι πωσ γιατι δηλαδη δηλ τωρα μετα απλα σημαινει εννοεισ εννοειτε περισσοτερα εξηγησε εξηγεισ εξηγησεισ εξηγησετε " +
  "what how why now next more simply simpler explain mean means then " +
  "was wie warum jetzt weiter mehr einfach einfacher erklaren bedeutet heisst dann"
).split(" "));

function normalizedWords(text) {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/ς/g, "σ").replace(/ß/g, "ss").match(/[\p{L}\p{N}]+/gu) ?? [];
}

function isDiscourseReset(text) {
  return /αλλαζ\p{L}* θεμα|ασχετο|αλλο θεμα|different topic|another topic|unrelated|anderes thema|themenwechsel/u.test(normalizedWords(text).join(" "));
}

function isFollowUp(text) {
  if (text.length > MAX_FOLLOW_UP_LENGTH) return false;
  const words = normalizedWords(text);
  return words.length > 0 && words.length <= MAX_FOLLOW_UP_WORDS &&
    words.every((word) => followUpWords.has(word)) && words.some((word) => followUpCues.has(word));
}

function isContextualFollowUp(text) {
  if (isFollowUp(text)) return true;
  if (text.length > MAX_FOLLOW_UP_LENGTH) return false;
  const words = normalizedWords(text);
  if (!words.length || words.length > MAX_FOLLOW_UP_WORDS) return false;
  const normalized = words.join(" ");
  // An explicit discourse reset is a barrier even if it contains a pronoun or
  // process word. Canonical new legal topics are handled independently above.
  if (isDiscourseReset(text)) return false;
  // Natural clarification phrases need not consist entirely of generic words.
  if (/πιο απλα|απλα λογια|more simply|simpler words|plain words|einfacher|einfach erklar/u.test(normalized)) return true;
  // Roles and immediate questions about the same process do not establish a
  // different legal topic. Explicit approved-topic matches take priority above.
  const contextualStem = /^(?:δικηγορ|συμβολαιογραφ|συμφων|συναινε|υπογρα|απαντη|lawyer|attorney|notar|agree|sign|respond|reply|anwalt|zustimm|einig|unterschreib|antwort)/u;
  const questionLike = /[;?;]/u.test(text) || /^(?:και|δηλαδη|αρα|ποιο|ποια|τι|πωσ|που|χρειαζ|πρεπει|μπορ|θελει|and|so|do|does|is|are|can|should|how|what|who|where|und|also|brauche|muss|kann|was|wie|wer|wo)/u.test(normalized);
  if (words.some((word) => contextualStem.test(word)) && questionLike) return true;

  // Dependent questions can introduce a process detail without repeating the
  // legal topic: actors, effects, partial access and language needs. These are
  // semantic categories across the reviewed topics, not complete prompt strings.
  const deictic = /^(?:αυτο|αυτοσ|αυτη|αυτα|αυτεσ|εκ(?:εινο|εινη|εινα)|ετσι|that|this|it|those|these|das|dies|diese|dessen)$/u;
  const processEntity = /^(?:διαδικασ|αιτησ|αποφασ|κρισ|υπηρεσ|εγγραφ|φακελ|δικαστηρ|πληρωμ|process|procedure|application|decision|authority|document|file|court|payment|verfahren|antrag|entscheidung|behorde|dokument|akte|gericht|zahlung)/u;
  const processDetail = /^(?:ξεκιν|εκκιν|αρχιζ|υποβαλ|ολοκληρ|διορθω|δεσμευ|υποχρεωτικ|αυτοματ|σταματ|κομματ|μερικ|μιλ|καταλαβαιν|γλωσσ|μεταφρα|διερμην|initiat|start|begin|submit|complet|finish|correct|binding|compulsory|automatic|partial|speak|understand|language|translat|interpret|beginn|einreich|abschliess|korrigier|verbindlich|automatisch|teilweis|sprech|versteh|sprache|ubersetz|dolmetsch)/u;
  const otherPeople = /(?:^| )(?:των αλλων|σε αλλουσ|αλλων ανθρωπων|other people|others|anderen|anderer)(?: |$)/u.test(normalized);
  const possessive = /(?:^| )(?:του|τησ|τουσ|its|their|dessen|deren)(?: |$)/u.test(normalized);
  const contextualRelation = words.some((word) => deictic.test(word)) || otherPeople ||
    (words.some((word) => processEntity.test(word)) && (possessive || questionLike)) ||
    (words.some((word) => processDetail.test(word)) && questionLike);
  return questionLike && contextualRelation;
}

function clipHistory(text, limit, fromEnd = false) {
  // Count UTF-16 units while preserving graphemes where supported. The fallback
  // still preserves complete code points, including surrogate-pair emoji.
  const segments = typeof Intl.Segmenter === "function"
    ? Array.from(new Intl.Segmenter("und", { granularity: "grapheme" }).segment(text), ({ segment }) => segment)
    : Array.from(text);
  if (fromEnd) segments.reverse();
  let clipped = "";
  for (const segment of segments) {
    if (clipped.length + segment.length > limit) break;
    clipped = fromEnd ? segment + clipped : clipped + segment;
  }
  return clipped;
}

/** Build one bounded lexical query from already validated conversation turns.
 * History is untrusted search data, never instructions, evidence or permission.
 * Approved metadata establishes topics without reading factual source content.
 * Clarification/role follow-ups retain that user-established topic, while a new
 * explicit topic or unrelated substantive turn replaces it. Assistant content
 * is never read, and history cannot authorize sources or grant permissions.
 * @param {readonly {role: string, content: string}[]} messages
 * @returns {string}
 */
export function buildChatRetrievalQuery(messages) {
  const latest = Array.isArray(messages) ? messages[messages.length - 1] : null;
  const question = latest?.role === "user" ? prepareChatText(latest.content, 1200) : null;
  if (!question) throw new TypeError("Invalid chat retrieval input");
  if (isDiscourseReset(question)) return question;
  const principal = getPublicChatPrincipal();
  const topicCache = new Map();
  const hintCache = new Map();
  const topics = (text) => {
    if (!topicCache.has(text)) topicCache.set(text, getReviewedLegalTopicMatches(principal, text));
    return topicCache.get(text);
  };
  const hintedTopics = (text) => {
    if (!hintCache.has(text)) hintCache.set(text, new Set(getReviewedLegalTopicHints(principal, text).flatMap(({ topics }) => topics)));
    return hintCache.get(text);
  };
  // Canonical current topics always win, even after "and/και/und". A bare
  // notary/lawyer/company term is not a canonical topic in the approved catalog.
  if (topics(question).length) return question;
  const contextual = isContextualFollowUp(question);
  let requiredTopics = contextual ? null : hintedTopics(question);
  if (!contextual && (question.length > MAX_FOLLOW_UP_LENGTH || normalizedWords(question).length > MAX_FOLLOW_UP_WORDS || !requiredTopics.size)) return question;

  let inspectedUserTurns = 0;
  for (let index = messages.length - 2; index >= 0 && inspectedUserTurns < MAX_RECENT_USER_TURNS; index--) {
    const message = messages[index];
    if (message?.role !== "user") continue;
    inspectedUserTurns++;
    const previous = prepareChatText(message.content, 1200);
    if (!previous) continue;
    const previousTopics = topics(previous);
    if (!previousTopics.length && isDiscourseReset(previous)) return question;
    if (previousTopics.length) {
      if (requiredTopics && !previousTopics.some(({ topics }) => topics.some((topic) => requiredTopics.has(topic)))) return question;
    } else {
      if (isContextualFollowUp(previous)) continue;
      const hints = hintedTopics(previous);
      if (hints.size) {
        requiredTopics = requiredTopics ? new Set([...requiredTopics].filter((topic) => hints.has(topic))) : hints;
        if (!requiredTopics.size) return question;
        continue;
      }
      // A substantive unrelated user turn remains a barrier. A partial-topic
      // question cannot borrow that unrelated text as if it established its topic.
      if (requiredTopics) return question;
    }
    const room = Math.min(MAX_RETRIEVAL_HISTORY_LENGTH, MAX_RETRIEVAL_QUERY_LENGTH - question.length - 1);
    let anchor = clipHistory(previous, room);
    if (previousTopics.length && previous.length > room) {
      // A long user turn may name its topic near the end. Retain a bounded
      // user-text window containing that topic instead of silently losing it.
      const relevantIds = new Set(previousTopics.map(({ id }) => id));
      const score = (text) => topics(text).reduce((sum, match) => sum + (relevantIds.has(match.id) ? match.score : 0), 0);
      const suffix = clipHistory(previous, room, true);
      if (score(suffix) > score(anchor)) anchor = suffix;
    }
    return anchor ? `${question}\n${anchor}` : question;
  }
  return question;
}
