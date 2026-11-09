import { prepareChatText } from "./protocol.mjs";

export const MAX_RETRIEVAL_QUERY_LENGTH = 2000;
export const MAX_RETRIEVAL_HISTORY_LENGTH = 800;
const MAX_RECENT_USER_TURNS = 3;
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
  "πεσ πειτε εξηγησε εξηγεισ εξηγησεισ εξηγησετε παρακαλω ναι ποιο ποια ποιοσ περιπτωση δικη δικο " +
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

function isFollowUp(text) {
  if (text.length > MAX_FOLLOW_UP_LENGTH) return false;
  const words = normalizedWords(text);
  return words.length > 0 && words.length <= MAX_FOLLOW_UP_WORDS &&
    words.every((word) => followUpWords.has(word)) && words.some((word) => followUpCues.has(word));
}

function clipHistory(text, limit) {
  // Count UTF-16 units while preserving graphemes where supported. The fallback
  // still preserves complete code points, including surrogate-pair emoji.
  const segments = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("und", { granularity: "grapheme" }).segment(text)
    : Array.from(text);
  let clipped = "";
  for (const item of segments) {
    const segment = typeof item === "string" ? item : item.segment;
    if (clipped.length + segment.length > limit) break;
    clipped += segment;
  }
  return clipped;
}

/** Build one bounded lexical query from already validated conversation turns.
 * History is untrusted search data, never instructions, evidence or permission.
 * Only clearly elliptical follow-ups inherit the nearest substantive user turn;
 * assistant content is never read, and old topics cannot override a new one.
 * @param {readonly {role: string, content: string}[]} messages
 * @returns {string}
 */
export function buildChatRetrievalQuery(messages) {
  const latest = Array.isArray(messages) ? messages[messages.length - 1] : null;
  const question = latest?.role === "user" ? prepareChatText(latest.content, 1200) : null;
  if (!question) throw new TypeError("Invalid chat retrieval input");
  if (!isFollowUp(question)) return question;

  let inspectedUserTurns = 0;
  for (let index = messages.length - 2; index >= 0 && inspectedUserTurns < MAX_RECENT_USER_TURNS; index--) {
    const message = messages[index];
    if (message?.role !== "user") continue;
    inspectedUserTurns++;
    const previous = prepareChatText(message.content, 1200);
    if (!previous || isFollowUp(previous)) continue;
    const room = Math.min(MAX_RETRIEVAL_HISTORY_LENGTH, MAX_RETRIEVAL_QUERY_LENGTH - question.length - 1);
    const anchor = clipHistory(previous, room);
    return anchor ? `${question}\n${anchor}` : question;
  }
  return question;
}
