import { createHash } from "node:crypto";
import { readAuthorizedChatSources } from "./access.mjs";
import { buildChatRetrievalQuery } from "./retrieval-query.mjs";
import { isProceduralDeadlineQuestion } from "./deadline-policy.mjs";
import { informationReply, needsPersonalLawyerContact } from "./response-policy.mjs";
import { parseChatResponse, prepareChatText } from "./protocol.mjs";

// Manually reviewed against the complete production-projected source text,
// including provenance/review date. A changed URL or any changed text disables
// the corresponding brief until its wording and binding are reviewed together.
const bindings = Object.freeze({
  harassment: Object.freeze({ id: "legal-workplace-harassment", url: new URL("https://www.hli.gov.gr/wp-content/uploads/2026/03/ΕΤΗΣΙΑ-ΕΚΘΕΣΗ-ΑΥΤΟΤΕΛΟΥΣ-2025.pdf").href, sha256: "2257521efa6ae5fe4e869b5f414a3e32dab4869fbd6f1c077df9ff4212bf803e" }),
  tax: Object.freeze({ id: "legal-tax-administrative-appeal", url: "https://www.aade.gr/endikofaneis-prosfyges", sha256: "d41443d0fbdc321757296da2788a13635deb172aa1d6fda95ce02d508ed6ee6e" }),
  rights: Object.freeze({ id: "legal-criminal-defence-rights", url: "https://e-justice.europa.eu/topics/your-rights/defendants-criminal-proceedings/1-my-rights-during-investigation/el_en", sha256: "bacdaf6928894cd5674abfb921a35c32ee75e80acf00702a73bbb34d1de034f0" }),
});
const text = Object.freeze({
  el: Object.freeze({
    harassment: "Εργασιακή παρενόχληση είναι συμπεριφορά με στόχο ή αποτέλεσμα την προσβολή της ανθρώπινης αξιοπρέπειας και τη δημιουργία εκφοβιστικού, εχθρικού, εξευτελιστικού, ταπεινωτικού ή επιθετικού περιβάλλοντος. Αυτός ο γενικός ορισμός δεν κρίνει το δικό σας περιστατικό.",
    tax: "Η προσφυγή δεν σημαίνει ότι παύει οριστικά κάθε υποχρέωση πληρωμής. Η προσφυγή και το αίτημα αναστολής είναι διαφορετικά, και η κατάθεση αιτήματος δεν σημαίνει έγκριση. Οι συνέπειες στην καταβολή ή είσπραξη εξαρτώνται από την πράξη και τις προϋποθέσεις και μπορεί να είναι προσωρινές.",
    rights: "Γενικά, ο ύποπτος έχει δικαίωμα σε συνήγορο, ενημέρωση για την κατηγορία και πρόσβαση στη δικογραφία στο προβλεπόμενο στάδιο. Αν δεν κατανοεί επαρκώς ελληνικά, προβλέπονται διερμηνεία και μετάφραση ουσιωδών εγγράφων. Ισχύει το τεκμήριο αθωότητας μέχρι να αποδειχθεί νόμιμα η ενοχή.",
  }),
  en: Object.freeze({
    harassment: "Workplace harassment is conduct with the purpose or effect of violating human dignity and creating an intimidating, hostile, degrading, humiliating or offensive environment. This general definition does not determine whether your particular situation qualifies.",
    tax: "An appeal does not mean that all payment obligations end permanently. An appeal and a stay request are different, and filing a request does not mean approval. Effects on payment or collection depend on the act and applicable conditions and may be temporary.",
    rights: "Generally, a suspect has access to a lawyer, information about the accusation and access to the case file at the applicable stage. Interpretation and translation of essential documents are provided when the person does not understand Greek sufficiently. The presumption of innocence applies until guilt is lawfully established.",
  }),
  de: Object.freeze({
    harassment: "Belästigung am Arbeitsplatz ist ein Verhalten, das die Menschenwürde verletzen und ein einschüchterndes, feindliches, erniedrigendes, entwürdigendes oder beleidigendes Umfeld schaffen soll oder dies bewirkt. Diese allgemeine Definition entscheidet nicht, ob Ihr konkreter Fall darunter fällt.",
    tax: "Ein Einspruch bedeutet nicht, dass alle Zahlungspflichten endgültig entfallen. Einspruch und Aussetzungsantrag sind verschieden; die Antragstellung bedeutet keine Genehmigung. Die Auswirkungen auf Zahlung oder Einziehung hängen vom Bescheid und den Voraussetzungen ab und können vorübergehend sein.",
    rights: "Allgemein bestehen Rechte auf einen Rechtsanwalt, Informationen über den Vorwurf und Akteneinsicht im vorgesehenen Verfahrensstadium. Wer Griechisch nicht ausreichend versteht, hat Anspruch auf Dolmetschen und Übersetzung wesentlicher Dokumente. Die Unschuldsvermutung gilt bis zum rechtmäßigen Nachweis der Schuld.",
  }),
});
const normalize = (value) => value.normalize("NFKC").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
  .replace(/ς/g, "σ").replace(/ß/g, "ss").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const foreign = /(?:^| )(?:γερμαν\p{L}*|γαλλ\p{L}*|αγγλι\p{L}*|κυπρ\p{L}*|ηπα|εξωτερικο|germany|german law|france|french law|england|britain|cyprus|usa|uk|deutschland|frankreich|zypern|osterreich|austria)(?= |$)/u;
const personalDecision = /(?:ποσα|τι ποσο|πρεπει να|να μην πληρωσω|να πληρωσω|με συμφερ|δικη μου περιπτωση|δικη μου υποθεση|τι να κανω|να αποδειξ|should i|how much|my case|recommend|prove my|soll ich|wie viel|meinem fall|meinen fall|beweisen|raten sie)/u;
const negatedGeneralRequest = /δεν (?:ρωτω|ρωταω|ρωτησα|θελω να μαθω)|not asking|do not ask|don t ask|frage nicht|nicht wissen/u;
const otherRemedy = /(?:ανακοπ|εφεσ|ενστασ|τροχαι|πολεοδομ|υδομ|εφκα|δημοτικ|traffic|parking|court judgment|judicial appeal|berufung|gerichtsurteil|bussgeld)|δικαστικ\p{L}* προσφυγ|προσφυγ\p{L}* (?:[\p{L}]+ ){0,3}δικαστηρ/u;

function hasUnknownDestination(value) {
  // Positive scope, rather than an ever-growing list of foreign countries or
  // courts. Unrecognized destinations defer to the ordinary authorized path.
  const known = /(?:^| )(?:στη δουλεια(?: μου)?|στην? εργασια|στην? αστυνομια|στο τμημα|απο την αστυνομια|στην? ααδε|στην? δεδ|ενωπιον τησ δεδ|ενωπιον τησ διευθυνσησ επιλυσησ διαφορων|στην ελλαδα|at work|in the workplace|by the police|in greece|(?:to|with|at|before) (?:the )?aade|(?:to|with|at|before) (?:the )?ded|am arbeitsplatz|(?:von|bei) der polizei|in griechenland|bei (?:der )?aade|bei (?:der )?ded)(?= |$)/gu;
  const remainder = value.replace(known, " ");
  return /(?:^| )(?:στο|στη|στην|στον|σε|στουσ|στισ|ενωπιον|απο|in|at|under|to|with|before|by|bei|beim|im|nach|unter|aus|von) \p{L}/u.test(remainder);
}

function taxAppealAnchor(value) {
  return /(?:^| )(?:ααδε|δεδ|aade|ded)(?= |$)/u.test(value) &&
    /ενδικοφαν|προσφυγ|appeal|einspruch|aussetzung/u.test(value);
}

/** A pure, bounded user-only query may identify a topic, never supply facts.
 * Mere AADE membership (e.g. a rental declaration) is not a tax-appeal anchor.
 * @param {readonly {role:string,content:string}[]} messages
 * @param {string} question
 */
function isTaxEffectsQuestion(messages, question) {
  if (otherRemedy.test(question) || !/προσφυγ|αιτημα αναστολ|appeal|stay request|einspruch|aussetzung/u.test(question) ||
      !/πληρωμ|καταβολ|εισπραξ|payment|paying|collection|zahlung|zahlen|einziehung/u.test(question) ||
      !/αυτοματ|σταματ|αναστελλ|automat|stop|suspend|halt|aussetz/u.test(question)) return false;
  const query = buildChatRetrievalQuery(messages);
  if (foreign.test(normalize(query)) || hasUnknownDestination(normalize(query))) return false;
  return messages.some((message) => {
    if (message?.role !== "user") return false;
    const userText = prepareChatText(message.content, 1200);
    return userText && query.includes(userText) && taxAppealAnchor(normalize(userText));
  });
}

/** Curated public general explanations only. The opaque authorized context is
 * checked before source reads. No model kind, request field or history fact can
 * replace the exact reviewed source URL/text binding or grant any action.
 * @param {{locale:"el"|"en"|"de",consent:true,messages:readonly {role:"user"|"assistant",content:string}[]}} input
 * @param {import("./access.mjs").AuthorizedChatContext} context
 * @returns {{answer:string,sources:{title:string,url:string}[],suggestContact:boolean}|null}
 */
export function getReviewedGeneralBrief(input, context) {
  const sources = readAuthorizedChatSources(context);
  const latest = Array.isArray(input?.messages) ? input.messages.at(-1) : null;
  const question = latest?.role === "user" ? prepareChatText(latest.content, 1200) : null;
  if (!question || input.consent !== true || input.messages.length > 9 || !Object.hasOwn(text, input.locale)) return null;
  const normalized = normalize(question);
  if (foreign.test(normalized) || hasUnknownDestination(normalized) || /\p{N}/u.test(normalized) || personalDecision.test(normalized) || negatedGeneralRequest.test(normalized) || isProceduralDeadlineQuestion(input.messages)) return null;
  let kind;
  if (/τι (?:ειναι|σημαινει) (?:η )?(?:εργασιακη παρενοχληση|παρενοχληση (?:στην|στη) εργασια|mobbing)|what is (?:workplace harassment|workplace bullying|mobbing)|was (?:ist|bedeutet) (?:mobbing|belastigung am arbeitsplatz)/u.test(normalized)) kind = "harassment";
  else if (/τι δικαιωματα εχει (?:γενικα )?(?:ενασ )?υποπτοσ|ποια (?:ειναι )?(?:τα )?(?:γενικα )?δικαιωματα (?:ενοσ )?υποπτου|what (?:general )?rights (?:does (?:a |the )?suspect (?:generally )?have|do suspects have)|welche (?:allgemeinen )?rechte hat (?:ein |der )?verdachtiger/u.test(normalized)) kind = "rights";
  else if (isTaxEffectsQuestion(input.messages, normalized)) kind = "tax";
  if (!kind) return null;
  const binding = bindings[kind];
  const source = sources.find((entry) => entry.id === binding.id);
  if (!source || source.url !== binding.url || createHash("sha256").update(source.content).digest("hex") !== binding.sha256) return null;
  let answer = text[input.locale][kind];
  const links = [{ title: source.title, url: source.url }];
  let suggestContact = false;
  if (kind === "rights" && needsPersonalLawyerContact(input.messages)) {
    const office = sources.find((entry) => entry.id === "office-contact");
    if (!office || !informationReply("office_contact", [office], input.locale)) return null;
    const phone = /\. Τηλέφωνο: ([^\n]{7,40})\. Email:/u.exec(office.content)?.[1];
    if (!phone) return null;
    answer += "\n\n" + {
      el: `Για τη συγκεκριμένη κλήση, επικοινωνήστε άμεσα με δικηγόρο στο ${phone} ή μέσω της σελίδας επικοινωνίας.`,
      en: `For this police call, contact a lawyer promptly at ${phone} or through the contact page.`,
      de: `Wenden Sie sich wegen dieser polizeilichen Ladung umgehend an einen Rechtsanwalt unter ${phone} oder über die Kontaktseite.`,
    }[input.locale];
    links.push({ title: office.title, url: office.url });
    suggestContact = true;
  } else if (kind === "rights") {
    // Preserve the source qualification even for an unclassified detention
    // narrative, without adding an arrest/urgency classifier or case finding.
    answer += "\n\n" + {
      el: "Για συγκεκριμένη κλήση ή κράτηση χρειάζεται άμεση συνεννόηση με δικηγόρο.",
      en: "For a specific police call or detention, consult a lawyer promptly.",
      de: "Bei einer konkreten polizeilichen Ladung oder Haft ist umgehend ein Rechtsanwalt hinzuzuziehen.",
    }[input.locale];
  }
  return parseChatResponse({ answer, sources: links, suggestContact });
}
