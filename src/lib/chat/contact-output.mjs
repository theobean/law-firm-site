const CONTACT_COPY = Object.freeze({
  el: Object.freeze({
    full: "Για τη συγκεκριμένη κλήση, επικοινωνήστε άμεσα με δικηγόρο στο +30 2310 545 261 ή μέσω της σελίδας επικοινωνίας.",
    short: "Για τη συγκεκριμένη κλήση χρειάζεται άμεση συνεννόηση με δικηγόρο.",
    observed: "Για συγκεκριμένη κλήση απαιτείται άμεση συνεννόηση με δικηγόρο.",
  }),
  en: Object.freeze({
    full: "For this police call, contact a lawyer promptly at +30 2310 545 261 or through the contact page.",
    short: "For this police call, consult a lawyer promptly.",
  }),
  de: Object.freeze({
    full: "Wenden Sie sich wegen dieser polizeilichen Ladung umgehend an einen Rechtsanwalt unter +30 2310 545 261 oder über die Kontaktseite.",
    short: "Wenden Sie sich wegen dieser polizeilichen Ladung umgehend an einen Rechtsanwalt.",
  }),
});

const OFFICE_PHONE = /(?:^|[^\d])2310[ \u00A0]+545[ \u00A0]+261(?!\d)/u;
const SENTENCE_BOUNDARY = /(?:[.!?;\u037E]\s+|\n[ \t]*\n[ \t]*)$/u;

/** Normalize only known affirmative closing contact sentences. This is called
 * after the server has independently established the personal police-call
 * qualification; it does not classify a visitor's question or legal rights.
 * Unknown, negated, quoted and non-final prose remains intact. Never clip the
 * result: the existing final response validator must still reject overflow.
 * @param {string} answer
 * @param {"el" | "en" | "de"} locale
 * @returns {string}
 */
export function qualifyPoliceContactAnswer(answer, locale) {
  const copy = CONTACT_COPY[locale];
  if (typeof answer !== "string" || !copy) throw new TypeError("invalid_contact_output");
  const knownTails = Object.values(copy);
  let body = answer.trimEnd();
  for (;;) {
    const tail = knownTails.find((candidate) => {
      if (!body.endsWith(candidate)) return false;
      const prefix = body.slice(0, -candidate.length);
      return !prefix.trim() || SENTENCE_BOUNDARY.test(prefix);
    });
    if (!tail) break;
    body = body.slice(0, -tail.length).trimEnd();
  }
  // A phone number chooses the shorter directive; it never suppresses the
  // mandatory case-specific lawyer-contact qualification itself.
  const contact = OFFICE_PHONE.test(body) ? copy.short : copy.full;
  return body ? `${body}\n\n${contact}` : contact;
}
