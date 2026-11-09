import "server-only";
import { assertPublicChatAccess, createAuthorizedChatContext, readAuthorizedChatSources } from "./access.mjs";
import { getPublicArticleSources } from "./articles.mjs";
import { selectReviewedLegalSources } from "./legal-retrieval.mjs";
import el from "../../../messages/el.json";
import en from "../../../messages/en.json";
import de from "../../../messages/de.json";

export type KnowledgeSource = {
  id: string;
  title: string;
  url: string;
  content: string;
};

const translations = { el, en, de };
const officeOrigin = "https://ioannispapaioannou.lawyer";

export function getStaticPublicChatContext(principal: unknown, locale: "el" | "en" | "de", question = "") {
  assertPublicChatAccess(principal, "public");
  const messages = translations[locale];
  const page = (path: string) => `${officeOrigin}/${locale}${path}`;

  // Select explicit fields. Do not pass complete FAQ/marketing text to the model:
  // it includes broad confidentiality and response-time promises not made here.
  const officeLoaders: Record<string, () => KnowledgeSource> = {
    "office-identity": () => ({
      id: "office-identity",
      title: messages.about.title,
      url: page("/about"),
      content: `Όνομα δικηγόρου: ${messages.about.name}. Γραφείο: ${messages.contact.firmName}. Έδρα: ${messages.contact.addressLine2}. Πρόκειται για πληροφορίες του δικηγορικού γραφείου στην Ελλάδα, ανεξάρτητα από τη γλώσσα της συνομιλίας.`,
    }),
    "office-contact": () => ({
      id: "office-contact",
      title: messages.contact.title,
      url: page("/contact"),
      content: `Διεύθυνση: ${messages.contact.addressLine1}, ${messages.contact.addressLine2}. Τηλέφωνο: +30 2310 545 261. Email: iopapaio@gmail.com. Ωράριο γραφείου, τοπική ώρα Ελλάδας: ${messages.contact.hoursValue}. Η συνομιλία δεν έχει πρόσβαση σε πρόγραμμα δικηγόρου ή διαθεσιμότητα ραντεβού.`,
    }),
    "office-appointments": () => ({
      id: "office-appointments",
      title: messages.faq.q1,
      url: page("/contact"),
      content:
        "Για αίτημα επικοινωνίας ή ραντεβού μπορεί κανείς να καλέσει στο +30 2310 545 261, να στείλει email στο iopapaio@gmail.com ή να χρησιμοποιήσει τη φόρμα επικοινωνίας της ιστοσελίδας. Το chatbot μπορεί μόνο να παραπέμψει στους διαθέσιμους τρόπους επικοινωνίας. Δεν υποβάλλει αιτήματα, δεν επιβεβαιώνει κράτηση, δεν αναλαμβάνει υπόθεση και δεν εγγυάται χρόνο απάντησης. Η διαθέσιμη βάση δεν περιέχει εγκεκριμένο τιμοκατάλογο ή υπόσχεση δωρεάν συνεδρίας.",
    }),
    "office-services": () => ({
      id: "office-services",
      title: messages.nav.practiceAreas,
      url: page("/practice-areas"),
      content: `Κύρια εξειδίκευση του γραφείου: ${messages.practiceAreas.areas.banking.title} και ${messages.practiceAreas.areas.extrajudicial.title}. Δημοσιευμένοι τομείς: ${Object.values(messages.practiceAreas.areas).map((area) => area.title).join("; ")}. Η αναφορά υπηρεσίας δεν συνεπάγεται αποδοχή συγκεκριμένης υπόθεσης ή εγγύηση αποτελέσματος.`,
    }),
    "office-nationwide": () => ({
      id: "office-nationwide",
      title: messages.faq.q3,
      url: page("/faq"),
      content: messages.faq.a3,
    }),
    "office-faq-guidance": () => ({
      id: "office-faq-guidance",
      title: messages.faq.title,
      url: page("/faq"),
      content: "ΠΛΗΡΟΦΟΡΙΕΣ ΓΡΑΦΕΙΟΥ — ΕΠΙΛΕΓΜΕΝΗ ΣΥΝΟΨΗ FAQ. Η διάρκεια μιας υπόθεσης εξαρτάται από τον τύπο της, τη δικαιοδοσία και τη ροή των δικαστηρίων· δεν υπάρχει ενιαίος χρόνος ολοκλήρωσης. Για ενημέρωση σχετικά με ανατεθειμένη υπόθεση το γραφείο αναφέρει επικοινωνία μέσω email, τηλεφώνου ή προσωπικής συνάντησης, κατόπιν συνεννόησης. Ο ψηφιακός βοηθός δεν έχει πρόσβαση σε φακέλους ή στην πορεία υποθέσεων και δεν δίνει προσωπική εκτίμηση χρόνου. Οι αναφορές του γραφείου στο επαγγελματικό απόρρητο δεν αποτελούν υπόσχεση απόλυτης εμπιστευτικότητας αυτής της συνομιλίας με τρίτους παρόχους AI.",
    }),
  };

  // Legal retrieval checks the principal and source ID before content reads.
  // The context factory independently checks each selected descriptor again.
  const readers = [
    ...Object.entries(officeLoaders).map(([id, load]) => ({ id, load })),
    ...selectReviewedLegalSources(principal, question).map((source) => ({ id: source.id, load: () => source })),
  ];
  return createAuthorizedChatContext(principal, "public", readers.map(({ id, load }) => ({
    id,
    visibility: "public",
    publication: "published",
    load: () => ({ ...load(), visibility: "public", publication: "published" }),
  })));
}

export async function getPublicChatContext(principal: unknown, locale: "el" | "en" | "de", question = "") {
  const baseline = getStaticPublicChatContext(principal, locale, question);
  // The caller reserves a shared quota lease before entering this live reader.
  // The reader also authorizes before its published-only, tokenless CMS query.
  const articleSources = await getPublicArticleSources(principal, question);
  return createAuthorizedChatContext(principal, "public", [
    ...readAuthorizedChatSources(baseline), ...articleSources,
  ].map((source) => ({
    id: source.id,
    visibility: "public",
    publication: "published",
    load: () => ({ ...source, visibility: "public", publication: "published" }),
  })));
}
