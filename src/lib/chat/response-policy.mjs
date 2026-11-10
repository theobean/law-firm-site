import { prepareChatText, parseChatResponse } from "./protocol.mjs";
import { containsProceduralDeadline } from "./deadline-policy.mjs";

export const INFORMATION_REPLY_KINDS = Object.freeze([
  "office_hours", "office_contact", "out_of_scope", "foreign_jurisdiction", "action_request", "private_access", "chat_privacy",
]);

const normalize = (text) => text.normalize("NFKC").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
  .replace(/ς/g, "σ").replace(/ß/g, "ss").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

const policeEvents = [
  /(?:^| )με (?:καλεσαν|καλεσε|εχουν καλεσει|εχει καλεσει|ειχαν καλεσει|ειχε καλεσει)(?= |$)/gu,
  /(?:^| )(?:ελαβα|παρελαβα|μου ηρθε|μου εστειλαν) (?:μια |την )?κληση(?= |$)/gu,
  /(?:^| )i (?:was|have been|had been|ve been) (?:(?:just|already|recently) )?(?:called|summoned|invited)(?= |$)/gu,
  /(?:^| )i (?:got|received|have received|ve received) (?:a |the )?(?:police )?(?:summons|invitation)(?= |$)/gu,
  /(?:^| )(?:the )?police (?:(?:have|had|has|just|recently|already) ){0,3}(?:called|summoned|invited) me(?= |$)/gu,
  /(?:^| )ich (?:wurde|bin|war) (?:[\p{L}]+ ){0,8}(?:vorgeladen|geladen|einbestellt|angerufen)(?= |$)/gu,
  /(?:^| )(?:die )?polizei hat mich (?:[\p{L}]+ ){0,5}(?:vorgeladen|geladen|einbestellt|angerufen)(?= |$)/gu,
  /(?:^| )ich habe (?:eine |die )?(?:polizeiliche )?vorladung(?= |$)/gu,
];
const negation = /^(?:δεν|ουτε|μη|μην|not|never|nicht|kein|keine|keinen|keiner)$/u;
const hypothetical = /(?:^| )(?:αν|εαν|θα|if|suppose|imagine|wenn|falls|angenommen|wuerde)(?= |$)/u;
const actionObject = /(?:^| )(?:αιτημ\p{L}*|μηνυμ\p{L}*|καταγγελ\p{L}*|email|e mail|request\p{L}*|message\p{L}*|complaint\p{L}*|antrag\p{L}*|nachricht\p{L}*)(?= |$)/u;

function isAssistantActionRequest(text) {
  if (!actionObject.test(text)) return false;
  // First-person possessives and recipients (μου/me/Sie) are not an actor.
  // Match an imperative or an explicitly addressed second-person request.
  if (/^(?:παρακαλω )?(?:στειλε|στειλτε|υποβαλε|υποβαλετε|αποστειλε|αποστειλτε)(?= |$)/u.test(text)) return true;
  if (/(?:^| )(?:μπορεισ|μπορειτε|θα|θελω να|θελω εσυ να) (?:(?:να|μου|μασ|εσυ|εσεισ|παρακαλω|το|την|τον|ενα|μια|αυτο) ){0,6}(?:στειλεισ|στειλετε|υποβαλεισ|υποβαλετε|αποστειλεισ|αποστειλετε)(?= |$)/u.test(text)) return true;
  if (/^(?:please )?(?:send|submit|forward|email|lodge)(?= |$)/u.test(text)) return true;
  if (/(?:^| )(?:(?:can|could|would|will|do) you|i (?:want|need|ask) you to|i would like you to) (?:(?:please|kindly|just|also|now) ){0,3}(?:send|submit|forward|email|lodge)(?= |$)/u.test(text)) return true;
  const words = text.split(" ");
  const start = words[0] === "bitte" ? 1 : 0;
  const imperative = /^(?:sende|schicke|senden|schicken|einreichen|reiche|reichen)$/u.test(words[start] ?? "") &&
    (!/^(?:senden|schicken|reichen)$/u.test(words[start]) || words[start + 1] === "sie");
  const addressed = /^(?:konnen|konnten|wurden|werden)$/u.test(words[start] ?? "") && words[start + 1] === "sie" ||
    /^(?:kannst|konntest|wurdest|willst)$/u.test(words[start] ?? "") && words[start + 1] === "du";
  const desired = words.slice(start, start + 4).join(" ") === "ich mochte dass sie";
  if (!imperative && !addressed && !desired) return false;
  const action = words.slice(start, start + 16).findIndex((word) => /^(?:sende|schicke|senden|schicken|einreichen|reiche|reichen)$/u.test(word));
  if (action < 0 || words.slice(start, start + action + 1).some((word) => negation.test(word) || /^(?:erklaren|erklarst|sagen|sagst|wissen|wie)$/u.test(word))) return false;
  if (/^(?:reiche|reichen)$/u.test(words[start + action])) return words.slice(start + action + 1, start + 18).includes("ein");
  return !words.slice(start, start + 18).some((word) => negation.test(word));
}

function hasExternalUploadDestination(text) {
  return /(?:κτηματολογ|e υμσ|e yms|gov gr|taxisnet|mydata|dropbox|onedrive|google drive|cloud)/u.test(text) ||
    /(?:^| )(?:στο|στη|στην|στον|σε|to|into|in|on|auf|im) (?:[\p{L}]+ ){0,4}(?:portal\p{L}*|platform\p{L}*|website\p{L}*|ιστοσελ\p{L}*|πλατφορμ\p{L}*)(?= |$)/u.test(text);
}

function isOtherPersonsConversation(text) {
  return /(?:^| )(?:συνομιλ\p{L}*|συζητησ\p{L}*) (?:[\p{L}]+ ){0,2}με (?!(?:εσενα|εσασ|σενα|ai|το ai|chatbot|το chatbot|δικaisis)(?: |$))[\p{L}]+/u.test(text) ||
    /(?:^| )(?:chat|conversation) (?:[\p{L}]+ ){0,2}with (?!(?:you|ai|the ai|an ai|chatbot|the chatbot|this assistant)(?: |$))[\p{L}]+/u.test(text) ||
    /(?:^| )(?:gesprach|chat|unterhaltung) (?:[\p{L}]+ ){0,2}mit (?!(?:dir|ihnen|ki|der ki|dem chatbot|diesem chatbot)(?: |$))[\p{L}]+/u.test(text) ||
    /(?:^| )(?:lawyer|company|employer|anwalt|firma) (?:s )?(?:chat|conversation|gesprach)(?= |$)/u.test(text);
}

function isOfficeContactQuestion(text) {
  // Conservative current-question scope: an office mention cannot turn a
  // bank/court/company's contact details into this law office's details.
  if (/(?:τραπεζ|δικαστηρι|κτηματολογ|αστυνομ|εφορι|ααδε|εργοδοτ|προμηθευτ|εταιρει|εταιρι|καταστημ|fund|servicer|cepal|dovalue|intrum|bank|court|police|employer|supplier|company|store|land registry|gericht|finanzamt|behord|arbeitgeber|unternehmen|lieferant)/u.test(text) ||
      /(?:αλλου|αλλησ|other|another|anderen|andere) (?:[\p{L}]+ ){0,2}(?:γραφει|δικηγο|office|lawyer|kanzlei|anwalt)/u.test(text) ||
      /registered office|statutory seat|εταιρικ.*εδρ|καταστατικ.*εδρ|συγκαταθε|παρενοχλ|δικαιω|καταγγελ/u.test(text)) return false;
  const contact = /διευθυν|τοποθεσι|τηλεφων|email|e mail|επικοινων|address|location|phone|telephone|contact|adresse|anschrift|telefon|kontakt|erreich/u.test(text);
  const office = /γραφει|παπαιωανν|papaioann|office|law firm|kanzlei/u.test(text);
  const addressed = /(?:^| )(?:σασ|σου|εσασ|εσενα|your|you|ihre|ihrer|ihr|sie|euch|dir)(?= |$)/u.test(text);
  const location = /που (?:βρισκεστε|ειστε|στεγαζεστε)|που.*(?:βρισκ|γραφει)|where (?:are you|is your)|where.*(?:office|located|based)|wo.*(?:kanzlei|befind|sind sie)/u.test(text);
  const bare = /^(?:(?:ποιο ειναι το|ποια ειναι η|ποιο το|what is the|what s the|wie lautet die) )?(?:τηλεφωνο|email|e mail|διευθυνση|στοιχεια επικοινωνιασ|phone number|email address|contact details|adresse|anschrift|telefonnummer)(?: σασ)?$/u.test(text);
  const request = /^(?:που|πωσ|ποια|ποιο|τι|εχετε|where|what|how|which|do you have|wo|wie|welche|haben sie)(?= |$)|(?:δωσε|δωστε|πες|πειτε|γραψε|θελω|χρειαζομαι|give me|tell me|show me|i need|i want|nennen|gib|geben|mochte|brauche)/u.test(text);
  const shortDetails = /^(?:(?:το|η|τα) )?(?:email|e mail|τηλεφωνο|διευθυνση|στοιχεια επικοινωνιασ)(?: (?:του γραφειου|σασ|σου))?$/u.test(text);
  return location && (office || addressed || /που (?:βρισκεστε|ειστε|στεγαζεστε)|where are you|wo sind sie/u.test(text)) ||
    contact && (bare || shortDetails || request && (office || addressed));
}

/** Preserve the reviewed immediate-contact qualification for a concrete police
 * call. This is not a general urgency classifier or a case assessment.
 * @param {readonly {role:string, content:string}[]} messages
 */
export function needsPersonalLawyerContact(messages) {
  const latest = Array.isArray(messages) ? messages.at(-1) : null;
  const question = latest?.role === "user" ? prepareChatText(latest.content, 1200) : null;
  if (!question) return false;
  if (/(?:υποθετικ|παραδειγμ|ασ πουμε|hypothetic|for example|suppose|imagine|angenommen|zum beispiel)/u.test(normalize(question))) return false;
  for (const rawClause of question.split(/[.!?;\n]+/u)) {
    // Preserve German conditional würde separately from indicative wurde.
    const text = normalize(rawClause.replace(/würde(n|st)?/giu, "wuerde$1"));
    if (!/(?:^| )(?:αστυνομ\p{L}*|police|polizei\p{L}*)(?= |$)/u.test(text)) continue;
    for (const pattern of policeEvents) {
      for (const match of text.matchAll(pattern)) {
        const before = text.slice(0, match.index).trim().split(" ");
        if (hypothetical.test(text.slice(0, match.index + match[0].length)) ||
            negation.test(before.at(-1) ?? "") || match[0].trim().split(" ").some((word) => negation.test(word))) continue;
        return true;
      }
    }
  }
  return false;
}

/** High-confidence current-question policies only. This grants no capability,
 * uses no assistant history as evidence and leaves ambiguous legal questions
 * to authorized retrieval. Deadline/appointment policy has priority upstream.
 * @param {readonly {role:string, content:string}[]} messages
 */
export function classifyInformationQuestion(messages) {
  const latest = Array.isArray(messages) ? messages.at(-1) : null;
  const question = latest?.role === "user" ? prepareChatText(latest.content, 1200) : null;
  if (!question) return null;
  const text = normalize(question);
  const legal = /νομ|δικαιω|δικασ|κληρονομ|διαζυγ|φορολ|εργασ|ευθυν|law|legal|rights|divorce|inherit|recht|scheidung|erbschaft/u;
  const thirdPartyHours = /δικαστηρι|τραπεζ|καταστημ|εφορι|ωραριο εργασ|court|bank|store|working hours|gericht|laden|arbeitszeit/u;
  if (/ωραριο|ωρεσ λειτουργ|ωρεσ.*ανοιχτ|ποτε.*ανοιγετε|ποτε.*κλεινετε|opening hours|office hours|when.*open|offnungszeiten|wann.*geoffnet/u.test(text) &&
      !thirdPartyHours.test(text)) return "office_hours";
  const chatTarget = /(?:^| )(?:εδω|σου|here|hier|dir|ihnen|chatbot|ai)(?= |$)|(?:μαζι σου|to you|mit dir|mit ihnen|this chat|our chat|dieser chat|diesen chat|unser chat)/u.test(text);
  const uploadHere = /ανεβασ|ανεβαζ|upload|hochlad/u.test(text) && chatTarget && !hasExternalUploadDestination(text);
  const privateChat = /(?:^| )(?:συνομιλ\p{L}*|chat|chatbot|gesprach|unterhaltung)(?= |$)/u.test(text) &&
    /εμπιστευ|απορρητ|confidential|private|vertraulich/u.test(text) && !isOtherPersonsConversation(text);
  if (uploadHere || privateChat) return "chat_privacy";
  if (/δειξε|δεις|προσβαση|show|access|zeige|zugriff/u.test(text) &&
      /φακελ.*πελατ|στοιχεια.*πελατ|υποθεσ.*πελατ|client.*files|customer.*data|mandanten|kundendaten/u.test(text)) return "private_access";
  if (question.split(/[.!?;\n]+/u).some((clause) => isAssistantActionRequest(normalize(clause)))) return "action_request";
  const foreignCountry = /γερμαν|γαλλ|αγγλι|κυπρ|ηπα|german|france|french|england|british|cyprus|usa|deutschland|frankreich|zypern/u.test(text);
  const greekContext = /ελλαδ|ελληνικ|greece|greek|griechenland|griechisch/u.test(text);
  if (foreignCountry && legal.test(text) && !greekContext &&
      /ισχυ|δικαιο|εκει|νομο|appl|there|law|dort|gilt|recht/u.test(text)) return "foreign_jurisdiction";
  if (!legal.test(text) && /συνταγη|recipe|rezept/u.test(text) && /πιτσα|παστιτσι|μουσακ|φαγητ|pizza|cook|kochen|pasta/u.test(text)) return "out_of_scope";
  if (isOfficeContactQuestion(text)) return "office_contact";
  return null;
}

const copy = {
  el: {
    out_of_scope: "Μπορώ να βοηθήσω με πληροφορίες για το γραφείο και γενικές νομικές έννοιες. Η ερώτηση αυτή είναι εκτός της θεματολογίας μου.",
    foreign_jurisdiction: "Το υλικό που διαθέτω αφορά την Ελλάδα. Δεν μπορώ να το εφαρμόσω στο δίκαιο άλλης χώρας ή να επιβεβαιώσω ότι ισχύουν εκεί οι ίδιοι κανόνες.",
    action_request: "Δεν μπορώ να στείλω μηνύματα ή να υποβάλω αιτήματα. Μπορείτε να επικοινωνήσετε με το γραφείο στο +30 2310 545 261 ή μέσω της σελίδας επικοινωνίας.",
    private_access: "Δεν έχω πρόσβαση σε φακέλους ή στοιχεία πελατών. Για πληροφορίες σχετικά με δική σας υπόθεση, επικοινωνήστε απευθείας με το γραφείο ή μέσω της σελίδας επικοινωνίας.",
    chat_privacy: "Δεν μπορείτε να ανεβάσετε έγγραφα εδώ. Μην καταχωρίζετε προσωπικά στοιχεία ή λεπτομέρειες υπόθεσης· η συνομιλία με παρόχους AI δεν αποτελεί εγγύηση απόλυτης εμπιστευτικότητας. Για να συνεννοηθείτε με το γραφείο σχετικά με την αποστολή εγγράφων, χρησιμοποιήστε τη σελίδα επικοινωνίας.",
  },
  en: {
    out_of_scope: "I can help with information about the office and general legal concepts. This question is outside that scope.",
    foreign_jurisdiction: "The material available to me concerns Greece. I cannot apply it to another country's law or confirm that the same rules apply there.",
    action_request: "I cannot send messages or submit requests. You can contact the office at +30 2310 545 261 or through the contact page.",
    private_access: "I have no access to client files or personal records. For information about your own case, contact the office directly or use the contact page.",
    chat_privacy: "You cannot upload documents here. Please do not enter personal information or case details; this AI conversation does not guarantee absolute confidentiality. Use the contact page to arrange a suitable way to communicate with the office.",
  },
  de: {
    out_of_scope: "Ich helfe mit Informationen zur Kanzlei und allgemeinen Rechtsbegriffen. Diese Frage liegt außerhalb dieses Bereichs.",
    foreign_jurisdiction: "Das verfügbare Material betrifft Griechenland. Ich kann es nicht auf das Recht eines anderen Landes übertragen oder bestätigen, dass dort dieselben Regeln gelten.",
    action_request: "Ich kann keine Nachrichten senden oder Anträge einreichen. Sie erreichen die Kanzlei unter +30 2310 545 261 oder über die Kontaktseite.",
    private_access: "Ich habe keinen Zugriff auf Mandantenakten oder persönliche Unterlagen. Für Informationen zu Ihrem eigenen Fall wenden Sie sich direkt an die Kanzlei oder nutzen Sie die Kontaktseite.",
    chat_privacy: "Hier können Sie keine Dokumente hochladen. Geben Sie keine persönlichen Angaben oder Falldetails ein; dieses KI-Gespräch garantiert keine absolute Vertraulichkeit. Über die Kontaktseite können Sie einen geeigneten Kommunikationsweg mit der Kanzlei vereinbaren.",
  },
};

/** Office details are read from the one authorized office-contact fact, not from
 * model prose. Missing or changed framing fails closed rather than guessing.
 * @param {string} kind
 * @param {readonly {id:string,title:string,url:string,content:string}[]} sources
 * @param {"el"|"en"|"de"} locale
 */
export function informationReply(kind, sources, locale) {
  if (kind === "office_contact") {
    const source = sources.find((source) => source.id === "office-contact");
    const fields = source && /^Διεύθυνση: ([^\n]{3,320})\. Τηλέφωνο: ([^\n]{7,40})\. Email: ([^\s]{3,254})\. Ωράριο γραφείου,/u.exec(source.content);
    if (!source || !fields) return null;
    const [, address, phone, email] = fields;
    if (prepareChatText(address, 320) !== address || address.length < 5 || /Διεύθυνση:|Τηλέφωνο:|Email:|Ωράριο/u.test(address) ||
        !/^\+[0-9][0-9 ()-]{5,38}$/u.test(phone) || !/^[0-9]{7,15}$/u.test(phone.replace(/\D/gu, "")) ||
        !/^[A-Za-z0-9][A-Za-z0-9._%+-]{0,63}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/u.test(email) || email.includes("..") ||
        containsProceduralDeadline(address)) return null;
    const answer = {
      el: `Το γραφείο βρίσκεται στη ${address}. Τηλέφωνο: ${phone}. Email: ${email}.`,
      en: `The office is at ${address}. Phone: ${phone}. Email: ${email}.`,
      de: `Die Kanzlei befindet sich in ${address}. Telefon: ${phone}. E-Mail: ${email}.`,
    }[locale];
    return parseChatResponse({ answer, sources: [{ title: source.title, url: source.url }], suggestContact: true });
  }
  if (kind === "office_hours") {
    const source = sources.find((source) => source.id === "office-contact");
    const hours = source && /Ωράριο γραφείου, τοπική ώρα Ελλάδας: ([^\n]{1,160})\. Η συνομιλία/u.exec(source.content)?.[1];
    if (!source || !hours || containsProceduralDeadline(hours)) return null;
    const prefix = { el: "Το γραφείο λειτουργεί", en: "Office opening hours:", de: "Öffnungszeiten der Kanzlei:" }[locale];
    const suffix = { el: "(τοπική ώρα Ελλάδας)", en: "(local time in Greece)", de: "(Ortszeit Griechenland)" }[locale];
    return parseChatResponse({ answer: `${prefix} ${hours} ${suffix}.`, sources: [{ title: source.title, url: source.url }], suggestContact: false });
  }
  const answer = copy[locale]?.[kind];
  return answer ? { answer, sources: [], suggestContact: !["out_of_scope", "foreign_jurisdiction"].includes(kind) } : null;
}
