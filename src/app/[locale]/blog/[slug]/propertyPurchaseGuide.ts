import type { PortableTextBlock } from "@portabletext/react";

const guideSlug = "agora-akiniton-vimata";
const propertyTransfer = "https://www.gov.gr/ipiresies/periousia-kai-phorologia/diakheirise-akinetes-periousias/metavivasi";
const enfiaCertificate = "https://www.aade.gr/egkyrotita-oristikopoiisi-pistopoiitikoy-enfia";
const transferTax = "https://www.gov.gr/el/sdg/residence/purchasing-and-selling-of-immovable-property/real-estate-transfer-tax";

type Section = {
  title: string;
  text: string;
  link?: { href: string; label: string };
};

type GuideTranslation = {
  title: string;
  excerpt: string;
  serviceLabel: string;
  serviceCta: string;
  sections: Section[];
};

const translations: Record<"el" | "en" | "de", GuideTranslation> = {
  el: {
    title: "Αγορά ακινήτου στην Ελλάδα σε 7 βήματα",
    excerpt: "Τι να ελέγξετε πριν δώσετε προκαταβολή, ποια έγγραφα θα χρειαστείτε και πώς προχωρά η αγορά από τον έλεγχο τίτλων έως την καταχώριση του συμβολαίου.",
    serviceLabel: "Νομικός έλεγχος για αγορά ακινήτου στην Ελλάδα",
    serviceCta: "Ζητήστε νομικό έλεγχο ακινήτου",
    sections: [
      {
        title: "1. Έλεγχος τίτλων και βαρών",
        text: "Πριν δώσετε προκαταβολή, ζητήστε νομικό έλεγχο. Ο δικηγόρος εξετάζει τους τίτλους και τις σχετικές εγγραφές στο αρμόδιο Κτηματολογικό Γραφείο, ώστε να διαπιστώσει ποιος έχει δικαίωμα να μεταβιβάσει το ακίνητο και αν εμφανίζονται βάρη ή διεκδικήσεις, όπως υποθήκες, προσημειώσεις και κατασχέσεις.",
      },
      {
        title: "2. Τεχνικός και πολεοδομικός έλεγχος",
        text: "Ζητήστε από μηχανικό να συγκρίνει το ακίνητο με την οικοδομική άδεια και τα εγκεκριμένα σχέδια. Συζητήστε τυχόν αποκλίσεις, αυθαίρετες κατασκευές ή περιορισμούς χρήσης πριν συμφωνήσετε στους όρους της αγοράς.",
      },
      {
        title: "3. Δικαιολογητικά του πωλητή",
        text: "Ο συμβολαιογράφος προσδιορίζει ποια φορολογικά και άλλα δικαιολογητικά απαιτούνται για τη συγκεκριμένη συναλλαγή. Ζητήστε εγκαίρως τη λίστα των εγγράφων και ελέγξτε με τον συμβολαιογράφο ποιο πιστοποιητικό ΕΝΦΙΑ χρειάζεται.",
        link: { href: enfiaCertificate, label: "Έλεγχος πιστοποιητικού ΕΝΦΙΑ στην ΑΑΔΕ" },
      },
      {
        title: "4. Προσύμφωνο και προκαταβολή",
        text: "Αν σας ζητήσουν να υπογράψετε ή να καταβάλετε προκαταβολή, ζητήστε πρώτα να ελεγχθούν το έγγραφο, ο απαιτούμενος τύπος, οι προθεσμίες και οι όροι επιστροφής του ποσού. Διευκρινίστε τι προβλέπεται αν ο έλεγχος αναδείξει πρόβλημα ή αν η αγορά εξαρτάται από στεγαστικό δάνειο.",
      },
      {
        title: "5. Φόρος μεταβίβασης και έξοδα αγοράς",
        text: "Πριν συμφωνήσετε την ημερομηνία υπογραφής, υπολογίστε το συνολικό κόστος. Ζητήστε ενημέρωση για τον φόρο μεταβίβασης, τυχόν απαλλαγή πρώτης κατοικίας, τις αμοιβές και τα τέλη καταχώρισης.",
        link: { href: transferTax, label: "Φορολογία μεταβίβασης ακινήτου στο gov.gr" },
      },
      {
        title: "6. Έλεγχος και υπογραφή συμβολαίου",
        text: "Ζητήστε το σχέδιο του συμβολαίου πριν από την υπογραφή, ώστε ο δικηγόρος σας να εξετάσει την περιγραφή του ακινήτου, τους όρους πληρωμής και τυχόν εκκρεμότητες. Το οριστικό συμβόλαιο υπογράφεται ενώπιον συμβολαιογράφου από τα μέρη ή τους νόμιμους εκπροσώπους τους.",
      },
      {
        title: "7. Καταχώριση στο Κτηματολόγιο",
        text: "Μετά την υπογραφή, βεβαιωθείτε ότι το συμβόλαιο υποβλήθηκε για καταχώριση και παρακολουθήστε το αποτέλεσμα. Όταν η συναλλαγή διεκπεραιώνεται μέσω του Ψηφιακού Φακέλου Μεταβίβασης, το αποτέλεσμα της καταχώρισης είναι διαθέσιμο εκεί.",
        link: { href: propertyTransfer, label: "Ψηφιακός Φάκελος Μεταβίβασης Ακινήτου στο gov.gr" },
      },
      {
        title: "Περιπτώσεις που χρειάζονται πρόσθετο έλεγχο",
        text: "Ενημερώστε τον δικηγόρο από την αρχή αν ο τίτλος προέρχεται από κληρονομιά, αν υπάρχουν περισσότεροι ιδιοκτήτες ή αν το ακίνητο βρίσκεται σε περιοχή με ειδικούς περιορισμούς. Αυτά τα στοιχεία μπορεί να επηρεάσουν τα έγγραφα και το χρονοδιάγραμμα της αγοράς.",
      },
    ],
  },
  en: {
    title: "Buying property in Greece in 7 steps",
    excerpt: "What to check before paying a deposit, which documents to gather, and how a purchase moves from title review to registration of the deed.",
    serviceLabel: "Legal checks when buying property in Greece",
    serviceCta: "Request a legal property check",
    sections: [
      {
        title: "1. Check the title and registered encumbrances",
        text: "Arrange a legal review before paying a deposit. A lawyer examines the title documents and relevant records at the competent Cadastral Office to establish who can transfer the property and whether the records show encumbrances or claims, such as mortgages, mortgage prenotations or attachments.",
      },
      {
        title: "2. Arrange a technical and planning review",
        text: "Ask an engineer to compare the property with the building permit and approved plans. Discuss any discrepancies, unauthorised construction or restrictions on use before agreeing to the terms of the purchase.",
      },
      {
        title: "3. Gather the seller’s documents",
        text: "The notary identifies the tax records and other documents required for the particular transaction. Ask for the list early and confirm with the notary which Greek property tax certificate (ENFIA) is needed.",
        link: { href: enfiaCertificate, label: "Greek tax authority guidance on the ENFIA certificate" },
      },
      {
        title: "4. Review the preliminary agreement and deposit",
        text: "If you are asked to sign an agreement or pay a deposit, have the document, the required form, the deadlines and the refund terms reviewed first. Clarify what happens if a check reveals a problem or the purchase depends on a mortgage loan.",
      },
      {
        title: "5. Budget for transfer tax and purchase costs",
        text: "Work out the full cost before setting a signing date. Ask about transfer tax, any applicable first-home exemption, professional fees and registration charges.",
        link: { href: transferTax, label: "Property transfer tax on gov.gr" },
      },
      {
        title: "6. Review and sign the deed",
        text: "Ask for the draft deed ahead of signing so your lawyer can review the property description, payment terms and any outstanding matters. The parties or their legal representatives sign the final deed before a notary.",
      },
      {
        title: "7. Register the deed with the Greek Cadastre",
        text: "After signing, confirm that the deed has been submitted for registration and follow up on the outcome. If the transaction uses the digital property transfer file, the registration outcome is available there.",
        link: { href: propertyTransfer, label: "Digital property transfer file on gov.gr" },
      },
      {
        title: "Cases that may need additional checks",
        text: "Tell your lawyer early if the title derives from an inheritance, if there are multiple owners or if the property is in an area subject to special restrictions. These circumstances may affect the documents you need and the purchase timeline.",
      },
    ],
  },
  de: {
    title: "Immobilienkauf in Griechenland in 7 Schritten",
    excerpt: "Was Sie vor einer Anzahlung prüfen sollten, welche Unterlagen Sie benötigen und wie der Kauf von der Eigentumsprüfung bis zur Eintragung abläuft.",
    serviceLabel: "Rechtliche Prüfung beim Immobilienkauf in Griechenland",
    serviceCta: "Rechtliche Immobilienprüfung anfragen",
    sections: [
      {
        title: "1. Eigentumstitel und eingetragene Belastungen prüfen",
        text: "Lassen Sie das Grundstück oder die Wohnung vor einer Anzahlung rechtlich prüfen. Der Anwalt prüft die Eigentumsnachweise und die einschlägigen Eintragungen beim zuständigen Katasteramt. Dabei klärt er, wer die Immobilie übertragen kann und ob Belastungen oder Ansprüche wie Hypotheken, Hypothekenvormerkungen oder Pfändungen eingetragen sind.",
      },
      {
        title: "2. Baurechtliche und technische Prüfung veranlassen",
        text: "Bitten Sie einen Ingenieur, den tatsächlichen Zustand der Immobilie mit der Baugenehmigung und den genehmigten Plänen abzugleichen. Klären Sie etwaige Abweichungen, ungenehmigte Bauten oder Nutzungsbeschränkungen, bevor Sie die Kaufbedingungen vereinbaren.",
      },
      {
        title: "3. Unterlagen des Verkäufers zusammentragen",
        text: "Der Notar stellt fest, welche steuerlichen Nachweise und sonstigen Unterlagen für den konkreten Kauf erforderlich sind. Fordern Sie die Liste frühzeitig an und klären Sie, welche Bescheinigung zur griechischen Immobiliensteuer ENFIA benötigt wird.",
        link: { href: enfiaCertificate, label: "Informationen zur ENFIA-Bescheinigung bei der griechischen Steuerbehörde" },
      },
      {
        title: "4. Vorvertrag und Anzahlung prüfen",
        text: "Wenn Sie eine Vereinbarung unterschreiben oder eine Anzahlung leisten sollen, lassen Sie vorab das Dokument, die erforderliche Form, die Fristen und die Rückzahlungsbedingungen prüfen. Klären Sie, was passiert, wenn bei der Prüfung ein Problem auftritt oder der Kauf von einer Finanzierung abhängt.",
      },
      {
        title: "5. Grunderwerbsteuer und Kaufnebenkosten einplanen",
        text: "Ermitteln Sie die Gesamtkosten, bevor Sie einen Termin zur Unterzeichnung vereinbaren. Fragen Sie nach der Grunderwerbsteuer, einer möglichen Steuerbefreiung für den Erwerb einer ersten Wohnung, den Honoraren und den Eintragungsgebühren.",
        link: { href: transferTax, label: "Informationen zur griechischen Grunderwerbsteuer auf gov.gr" },
      },
      {
        title: "6. Kaufvertrag prüfen und unterzeichnen",
        text: "Fordern Sie den Entwurf vor der Unterzeichnung an, damit Ihr Anwalt die Beschreibung der Immobilie, die Zahlungsbedingungen und offene Fragen prüfen kann. Die Parteien oder ihre rechtlichen Vertreter unterzeichnen den endgültigen Kaufvertrag vor dem Notar.",
      },
      {
        title: "7. Kaufvertrag beim griechischen Kataster eintragen lassen",
        text: "Vergewissern Sie sich nach der Unterzeichnung, dass der Vertrag zur Eintragung eingereicht wurde, und verfolgen Sie den Status. Wenn der Kauf über die digitale Akte zur Immobilienübertragung abgewickelt wird, ist das Ergebnis der Eintragung dort abrufbar.",
        link: { href: propertyTransfer, label: "Digitale Akte zur Immobilienübertragung auf gov.gr" },
      },
      {
        title: "Fälle, die eine zusätzliche Prüfung erfordern können",
        text: "Informieren Sie Ihren Anwalt frühzeitig, wenn das Eigentum aus einer Erbschaft stammt, es mehrere Eigentümer gibt oder die Immobilie in einem Gebiet mit besonderen Einschränkungen liegt. Solche Umstände können sich auf die benötigten Unterlagen und den Zeitplan auswirken.",
      },
    ],
  },
};

export function getPropertyPurchaseGuide(slug: string, locale: string) {
  if (slug !== guideSlug) return null;

  const lang = locale === "en" || locale === "de" ? locale : "el";
  const { title, excerpt, serviceCta, serviceLabel, sections } = translations[lang];
  const body = sections.flatMap<PortableTextBlock>((section, index) => {
    const key = `guide-${index}`;
    const link = index === 0
      ? { href: `/${lang}/practice-areas/realEstate`, label: serviceLabel }
      : section.link;
    const blocks: PortableTextBlock[] = [
      { _key: `${key}-heading`, _type: "block", style: "h2", children: [
        { _key: `${key}-heading-text`, _type: "span", text: section.title },
      ] },
      { _key: `${key}-paragraph`, _type: "block", style: "normal", children: [
        { _key: `${key}-paragraph-text`, _type: "span", text: section.text },
      ] },
    ];

    if (link) {
      blocks.push({
        _key: `${key}-link`,
        _type: "block",
        style: "normal",
        markDefs: [{ _key: `${key}-href`, _type: "link", href: link.href }],
        children: [{ _key: `${key}-link-text`, _type: "span", text: link.label, marks: [`${key}-href`] }],
      });
    }

    return blocks;
  });

  return {
    article: { title, excerpt, seoTitle: title, seoDescription: excerpt, body },
    serviceCta,
  };
}
