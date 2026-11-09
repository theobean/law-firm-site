import { prepareChatText } from "./protocol.mjs";

const intents = new Set(["request", "change", "cancel"]);
const appointmentWord = /^(?:(?:beratungs)?termin(?:e|en|s|anfrage|buchung|vereinbarung|anderung|absage|verschiebung)?|ραντεβου|συναντησ\p{L}*|appointment(?:s)?|meeting(?:s)?|consultation(?:s)?|besprechung(?:en)?|sprechstunde(?:n)?)$/u;
const feeWord = /^(?:κοστ\p{L}*|αμοιβ\p{L}*|χρεωσ\p{L}*|τιμη|τιμεσ|cost(?:s)?|fee(?:s)?|price(?:s)?|charg(?:e|es|ed|ing)|kost\p{L}*|preis\p{L}*|gebuhr\p{L}*|honorar\p{L}*)$/u;
const negations = new Set(["δεν", "μη", "μην", "not", "never", "nicht", "kein", "keine", "keinen"]);
const negationBridge = new Set((
  "θελω ηθελα να μου μασ το ενα εναν μια μην please want need like would to do you me my our an a the " +
  "ich mochte will bitte einen eine ein meinen meine mein den das sie wir"
).split(" "));
const completedWord = /^(?:εκλεισα|κανονισα|προγραμματισα|ζητησα|ακυρωσα|ακυρωθηκε|αλλαξα|μετεφερα|booked|scheduled|arranged|requested|cancelled|canceled|changed|rescheduled|gebucht|vereinbart|abgesagt|verschoben|storniert)$/u;
const requestCue = /^(?:θελ\p{L}*|ηθελ\p{L}*|μπορ\p{L}*|πωσ|χρειαζ\p{L}*|παρακαλω|want|need|can|could|may|would|please|how|possible|able|mocht\p{L}*|wunsch\p{L}*|brauch\p{L}*|will|kann\p{L}*|konnt\p{L}*|wie|bitte|moglich)$/u;

function normalize(text) {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/ς/g, "σ").replace(/ß/g, "ss")
    .replace(/\b(?:don't|don’t)\b/gu, "do not").replace(/\b(?:can't|can’t|cannot)\b/gu, "can not");
}

function negated(words, index) {
  for (let offset = Math.max(0, index - 5); offset < index; offset++) {
    if (negations.has(words[offset]) && words.slice(offset + 1, index).every((word) => negationBridge.has(word) || appointmentWord.test(word))) return true;
  }
  return false;
}

function action(word) {
  if (/^(?:ακυρω\p{L}*|cancel|cancelling|canceling|cancellation|absag\p{L}*|stornier\p{L}*)$/u.test(word)) return "cancel";
  if (/^(?:αλλαξ\p{L}*|αλλαγ\p{L}*|μεταφερ\p{L}*|μετακιν\p{L}*|αναβαλ\p{L}*|μεταθε\p{L}*|change|changing|reschedule|rescheduling|move|postpone|rebook|verschieb\p{L}*|ander\p{L}*|verleg\p{L}*|umbuch\p{L}*)$/u.test(word)) return "change";
  if (/^(?:κλει[σν]\p{L}*|κανονι[σζ]\p{L}*|προγραμματισ\p{L}*|ζητη[σθ]\p{L}*|επικοινων\p{L}*|book|booking|schedule|scheduling|arrange|arranging|request|requesting|make|get|reserve|contact|vereinbar\p{L}*|buch(?:e|en|st|t)?|ausmach\p{L}*|anfrag\p{L}*|reservier\p{L}*|kontaktier\p{L}*)$/u.test(word)) return "request";
  return null;
}

/** Recognize current explicit appointment requests only. The caller supplies
 * already validated conversation messages. Earlier USER and all assistant text
 * are deliberately ignored: a time-only follow-up is not booking authority.
 * This classifier never parses dates, collects details or performs an action.
 * @param {readonly {role: string, content: string}[]} messages
 * @returns {"request" | "change" | "cancel" | null}
 */
export function classifyAppointmentRequest(messages) {
  const latest = Array.isArray(messages) ? messages[messages.length - 1] : null;
  const question = latest?.role === "user" ? prepareChatText(latest.content, 1200) : null;
  if (!question) return null;
  const words = normalize(question).match(/[\p{L}\p{N}]+/gu) ?? [];
  if (!words.some((word) => appointmentWord.test(word)) || words.some((word) => feeWord.test(word))) return null;
  const normalized = words.join(" ");
  const cue = words.some((word) => requestCue.test(word));
  if (words.some((word) => completedWord.test(word)) && !cue) return null;

  // Specific current actions precede the general desire to request a meeting.
  for (const intent of ["cancel", "change", "request"]) {
    const found = words.some((word, index) => action(word) === intent && !negated(words, index) &&
      (cue || index === 0 || (index === 1 && (["please", "bitte", "παρακαλω"].includes(words[0]) || (words.length <= 3 && appointmentWord.test(words[0]))))));
    if (found) return /** @type {"request" | "change" | "cancel"} */ (intent);
  }
  // German separable "einen Termin absagen": "Wie sage ich ... ab?"
  if (cue && words.includes("ab") && words.some((word, index) => /^(?:sage|sagen|sag|sagst)$/u.test(word) && !negated(words, index))) return "cancel";
  if (words.some((word) => negations.has(word))) return null;
  if (/(?:^| )(?:θελω|θελουμε|ηθελα|want|need|would like|d like|mochte|wunsche|brauche|brauchen|ich will|hatte gern)(?: |$)/u.test(normalized)) return "request";
  if (cue && words.some((word) => /^(?:εχω|εχουμε|εχετε|have|haben|bekommen)$/u.test(word))) return "request";
  if (words.some((word) => /^(?:διαθεσιμ\p{L}*|available|availability|verfugbar\p{L}*|frei)$/u.test(word))) return "request";
  if (cue && words.some((word) => /^(?:terminvereinbarung|terminanfrage|terminbuchung)$/u.test(word))) return "request";
  return null;
}

const copy = Object.freeze({
  el: "Δεν μπορώ να κλείσω, να αλλάξω ή να ακυρώσω ραντεβού, ούτε να ελέγξω διαθεσιμότητα. Για συνεννόηση, καλέστε απευθείας το γραφείο στο +30 2310 545 261.",
  en: "I cannot book, change or cancel appointments, or check availability. Please call the office directly at +30 2310 545 261 to make arrangements.",
  de: "Ich kann keine Termine buchen, ändern oder absagen und keine Verfügbarkeit prüfen. Zur Abstimmung rufen Sie die Kanzlei direkt unter +30 2310 545 261 an.",
});

/** Application-owned wording; no date, name or other question text is echoed.
 * All intents have the same safe manual-contact response and no action result.
 * @param {"el" | "en" | "de"} locale
 * @param {"request" | "change" | "cancel"} [intent]
 * @returns {{answer: string, sources: {title: string, url: string}[], suggestContact: boolean}}
 */
export function appointmentReply(locale, intent = "request") {
  if (!Object.hasOwn(copy, locale) || !intents.has(intent)) throw new TypeError("Invalid appointment reply context");
  return { answer: copy[locale], sources: [], suggestContact: true };
}
