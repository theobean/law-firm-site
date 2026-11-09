import "server-only";
import { assertPublicChatAccess, createAuthorizedChatContext } from "./access.mjs";
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

/**
 * Curated explanatory excerpts; review dates are recorded in docs/chatbot-content.md.
 * These are a bounded snapshot, not live legal research. Keep amounts,
 * deadlines, eligibility decisions and case-specific remedies out of this data.
 */
const legalKnowledge: readonly KnowledgeSource[] = [
  {
    // Reviewed 2026-11-09; a general explanation, not current eligibility advice.
    id: "legal-katseli-law",
    title: "ΑΑΔΕ — Ν. 3869/2010 και απαλλαγή οφειλετών",
    url: "https://aade.gr/egkyklioi-kai-apofaseis/e-2041-08-07-2025",
    content:
      "Ο νόμος Κατσέλη είναι η συνήθης ονομασία του Ν. 3869/2010 για τη ρύθμιση οφειλών υπερχρεωμένων φυσικών προσώπων. Πρόκειται για δικαστικό πλαίσιο ρύθμισης χρεών, με δυνατότητα απαλλαγής από το υπόλοιπο των οφειλών υπό τις νόμιμες προϋποθέσεις. Διαφέρει από τον εξωδικαστικό μηχανισμό ρύθμισης οφειλών. Η γενική αυτή περιγραφή εξηγεί το αντικείμενο του νόμου: δεν επιβεβαιώνει δυνατότητα σημερινής υπαγωγής ή υποβολής νέας αίτησης, προστασία κατοικίας, διαγραφή χρέους, συγκεκριμένες δόσεις ή προθεσμίες. Για την εφαρμογή του σε υφιστάμενη αίτηση, δικαστική απόφαση ή προσωπική υπόθεση απαιτείται έλεγχος από δικηγόρο.",
  },
  {
    id: "legal-debt-settlement",
    title: "Υπουργείο Οικονομικών — Εξωδικαστικός μηχανισμός",
    url: "https://minfin.gov.gr/diacheirisi-idiotikou-xreous/rythmisi-ofeilon/exodikastikos-michanismos-rythmisis-ofeilon/",
    content:
      "Ο εξωδικαστικός μηχανισμός είναι ηλεκτρονική διαδικασία για τη ρύθμιση οφειλών προς Δημόσιο, φορείς κοινωνικής ασφάλισης, τράπεζες και διαχειριστές πιστώσεων. Η εφαρμογή του εξαρτάται από τις ισχύουσες προϋποθέσεις και τα στοιχεία του αιτούντος. Η παρούσα σύνοψη εξηγεί μόνο τον σκοπό του μηχανισμού: δεν επιβεβαιώνει επιλεξιμότητα, αριθμό δόσεων, διαγραφή χρέους ή αναστολή πλειστηριασμού.",
  },
  {
    id: "legal-banking-code",
    title: "Υπουργείο Οικονομικών — Κώδικας Δεοντολογίας",
    url: "https://minfin.gov.gr/diacheirisi-idiotikou-xreous/rythmisi-ofeilon/rythmisi-ofeilon-meso-tou-kodika-deontologias/",
    content:
      "Ο τραπεζικός Κώδικας Δεοντολογίας οργανώνει την επικοινωνία και την ανταλλαγή πληροφοριών μεταξύ δανειολήπτη και χρηματοδοτικού ιδρύματος για την εξέταση λύσεων ρύθμισης ή οριστικής διευθέτησης οφειλών. Δεν αποτελεί υπόσχεση συγκεκριμένης πρότασης ή αποδοχής μιας ρύθμισης. Η εφαρμογή του σε συγκεκριμένο δάνειο και οι συνέπειες κάθε ενέργειας χρειάζονται έλεγχο των πραγματικών στοιχείων και του ισχύοντος πλαισίου.",
  },
  {
    id: "legal-credit-servicers",
    title: "Τράπεζα της Ελλάδος — Εταιρείες διαχείρισης απαιτήσεων",
    url: "https://www.bankofgreece.gr/statistika/nomismatikh-kai-trapezikh-statistiki/etaireies-diaxeirishs-apaithsewn-apo-daneia-kai-pistwseis-(edadp)",
    content:
      "Οι εταιρείες διαχείρισης απαιτήσεων από δάνεια και πιστώσεις, που συχνά ονομάζονται servicers, διαχειρίζονται χαρτοφυλάκια δανειακών απαιτήσεων. Η ιδιότητα του διαχειριστή διακρίνεται από την ιδιοκτησία της απαίτησης. Αυτή η γενική εξήγηση δεν αποδεικνύει ποιος δικαιούται να ενεργήσει σε συγκεκριμένη υπόθεση ούτε ότι μια απαίτηση είναι έγκυρη ή άκυρη· αυτά προϋποθέτουν έλεγχο των σχετικών εγγράφων.",
  },
  {
    id: "legal-payment-order",
    title: "Ευρωπαϊκή Πύλη e-Justice — Διαταγή πληρωμής στην Ελλάδα",
    url: "https://e-justice.europa.eu/topics/money-monetary-claims/european-payment-order/el_en",
    content:
      "Στην Ελλάδα η διαταγή πληρωμής αφορά ειδική διαδικασία για χρηματικές απαιτήσεις ή απαιτήσεις από αξιόγραφα που αποδεικνύονται εγγράφως. Η ελληνική εθνική διαδικασία διακρίνεται από την ευρωπαϊκή διαταγή πληρωμής. Η παρούσα καταχώριση περιορίζεται στον γενικό χαρακτήρα της διαδικασίας: δεν αναφέρει σημερινή αρμοδιότητα έκδοσης, προθεσμίες ανακοπής ή συγκεκριμένες ενέργειες. Αν έχει επιδοθεί έγγραφο, χρειάζεται άμεση εξέταση από δικηγόρο χωρίς υπολογισμό προθεσμίας μέσω της συνομιλίας.",
  },
  {
    id: "legal-mediation",
    title: "Υπουργείο Δικαιοσύνης — Τι είναι η διαμεσολάβηση",
    url: "https://www.diamesolavisi.gov.gr/syxnes-erotiseis",
    content:
      "Η διαμεσολάβηση είναι μέθοδος εξωδικαστικής επίλυσης ιδιωτικών διαφορών. Ένας ανεξάρτητος, ουδέτερος διαμεσολαβητής βοηθά τα μέρη να επικοινωνήσουν και να διαπραγματευθούν μια συμφωνία. Δεν επιβάλλει δικαστική απόφαση ούτε εγγυάται επίτευξη συμφωνίας. Το αν μια διαφορά υπάγεται σε συγκεκριμένη διαδικασία ή απαιτεί αρχική συνεδρία δεν κρίνεται από αυτή τη γενική περιγραφή.",
  },
  {
    id: "legal-labor-disputes",
    title: "Επιθεώρηση Εργασίας — Εργατική διαφορά",
    url: "https://www.hli.gov.gr/ergasiakes-scheseis/ergazomenoi-ergasiakes-scheseis/ergatiki-diafora/ergatiki-diafora-2/",
    content:
      "Η Επιθεώρηση Εργασίας διαθέτει διαδικασία εργατικής διαφοράς, στην οποία εξετάζονται διαφωνίες μεταξύ εργαζομένου και εργοδότη με συμμετοχή επιθεωρητή. Η υποβολή σχετικού αιτήματος διαφέρει από την άσκηση αγωγής σε δικαστήριο. Η παρούσα γενική ενημέρωση δεν υπολογίζει αποζημίωση, δεδουλευμένα ή προθεσμίες ούτε κρίνει τη νομιμότητα απόλυσης ή άλλης πράξης εργοδότη.",
  },
  {
    id: "legal-land-registry",
    title: "Ελληνικό Κτηματολόγιο — Κτηματολογικό φύλλο",
    url: "https://www.ktimatologio.gr/pliroforiako-yliko/ktimatologio-se-leitourgia/21",
    content:
      "Το αντίγραφο κτηματολογικού φύλλου αποτυπώνει τις καταχωρίσεις για συγκεκριμένο ακίνητο, όπως δικαιώματα, ποσοστά ιδιοκτησίας και τυχόν βάρη. Αποτελεί πηγή πληροφοριών για τον έλεγχο ακινήτου. Μια γενική συνομιλία δεν επαληθεύει τίτλους, την πληρότητα των εγγραφών ή τη δυνατότητα μεταβίβασης συγκεκριμένου ακινήτου. Ο νομικός έλεγχος απαιτεί εξέταση των κατάλληλων εγγράφων.",
  },
  {
    id: "legal-inheritance-tax",
    title: "ΑΑΔΕ — Δήλωση φόρου κληρονομιάς",
    url: "https://www.aade.gr/exypiretisi-enimerosi/hristikoi-odigoi/hristikos-odigos-taktopoiisis-forologikon-ypohreoseon-poy-prokyptoyn-apo-tin-apoleia-2",
    content:
      "Η κληρονομική διαδοχή μπορεί να δημιουργήσει φορολογικές υποχρεώσεις για τους κληρονόμους, μεταξύ των οποίων δήλωση φόρου κληρονομιάς. Η φορολογική αντιμετώπιση εξαρτάται από τα περιουσιακά στοιχεία και τα δεδομένα της κληρονομιάς. Η παρούσα καταχώριση δεν προσδιορίζει κληρονόμους, μερίδες, προθεσμίες, φορολογικό ποσό ή επιλογή αποδοχής ή αποποίησης· απαιτείται εξατομικευμένος έλεγχος.",
  },
];

export function getPublicChatContext(principal: unknown, locale: "el" | "en" | "de") {
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
  };

  // Each entry in this source-controlled catalog is a reviewed public snapshot.
  // Readers remain lazy so policy denial happens before reading source content.
  const readers = [
    ...Object.entries(officeLoaders).map(([id, load]) => ({ id, load })),
    ...legalKnowledge.map((source) => ({ id: source.id, load: () => source })),
  ];
  return createAuthorizedChatContext(principal, "public", readers.map(({ id, load }) => ({
    id,
    visibility: "public",
    publication: "published",
    load: () => ({ ...load(), visibility: "public", publication: "published" }),
  })));
}
