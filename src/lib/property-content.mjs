// Public website content shared with the server-side chatbot source catalog.
// Keep factual projections separate from calls to action and personal-case intake.

const depositGuidePath = "/blog/prokatavoli-agora-akinitou";
const propertyTransfer = "https://www.gov.gr/ipiresies/periousia-kai-phorologia/diakheirise-akinetes-periousias/metavivasi";
const enfiaCertificate = "https://www.aade.gr/egkyrotita-oristikopoiisi-pistopoiitikoy-enfia";
const transferTax = "https://www.gov.gr/el/sdg/residence/purchasing-and-selling-of-immovable-property/real-estate-transfer-tax";
const cadastreCertificates = "https://www.ktimatologio.gr/pliroforiako-yliko/ktimatologio-se-leitourgia/21";

/**
 * @typedef {{ title: string, text: string, link?: { href: string, label: string } }} PropertyGuideSection
 * @typedef {{ title: string, excerpt: string, serviceLabel: string, serviceCta: string, sections: PropertyGuideSection[] }} PropertyPurchaseGuide
 */
/** @type {Record<"el" | "en" | "de", PropertyPurchaseGuide>} */
export const PROPERTY_PURCHASE_GUIDES = {
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
        link: { href: depositGuidePath, label: "Τι να ελέγξετε πριν δώσετε προκαταβολή" },
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
        link: { href: depositGuidePath, label: "What to check before paying a property deposit" },
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
        link: { href: depositGuidePath, label: "Was Sie vor der Anzahlung beim Immobilienkauf prüfen sollten" },
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

/**
 * @typedef {{
 * title: string, firmName: string, description: string, intro: string,
 * checklistTitle: string, checklist: string[],
 * scenarios: { title: string, paragraphs: string[], source?: { href: string, label: string } }[],
 * contactTitle: string, contactText: string, contactLabel: string, propertyServiceLabel: string
 * }} PropertyDepositGuide
 */
/** @type {Record<"el" | "en" | "de", PropertyDepositGuide>} */
export const PROPERTY_DEPOSIT_GUIDES = {
  el: {
    title: "Τι να ελέγξετε πριν δώσετε προκαταβολή για ακίνητο",
    firmName: "Παπαϊωάννου & Συνεργάτες",
    description: "Τι ζητάτε πριν πληρώσετε προκαταβολή για αγορά ακινήτου στη Θεσσαλονίκη. Τίτλος πωλητή, υποθήκη, στεγαστικό δάνειο και όροι του συμφωνητικού.",
    intro: "Βρήκατε ακίνητο στη Θεσσαλονίκη και σας ζητούν προκαταβολή. Ζητήστε πρώτα τον τίτλο του πωλητή και το σχέδιο του συμφωνητικού. Από αυτά ξεκινά ο έλεγχος για το ποιος μπορεί να πουλήσει, ποιο ακίνητο αφορά η πληρωμή και τι γίνεται με τα χρήματα αν η αγορά δεν προχωρήσει.",
    checklistTitle: "Τι να έχετε πριν πληρώσετε",
    checklist: [
      "Τη διεύθυνση, τον δήμο και τον ΚΑΕΚ του ακινήτου, αν είναι διαθέσιμος. Σε διαμέρισμα, ζητήστε να προσδιοριστούν ο όροφος και τυχόν αποθήκη ή θέση στάθμευσης που περιλαμβάνεται στην αγορά.",
      "Τον τίτλο του πωλητή και τα στοιχεία που χρειάζονται για τον έλεγχο τίτλων και βαρών στο αρμόδιο Κτηματολογικό Γραφείο.",
      "Το σχέδιο της συμφωνίας με το ποσό, τον αποδέκτη της πληρωμής και τον τρόπο με τον οποίο η προκαταβολή υπολογίζεται στο τίμημα.",
      "Τις ημερομηνίες για τον έλεγχο, τη χρηματοδότηση και την υπογραφή. Δείτε τι γράφει η συμφωνία για την επιστροφή ή την παρακράτηση της προκαταβολής σε κάθε περίπτωση.",
    ],
    scenarios: [
      {
        title: "Ο πωλητής λέει ότι θα εξαλειφθεί η υποθήκη",
        paragraphs: [
          "Ελέγχουμε τι εμφανίζεται στο κτηματολογικό φύλλο και ποιο δικαίωμα αφορά η εγγραφή. Ζητάμε να διευκρινιστεί ποια έγγραφα χρειάζονται για την εξάλειψη, ποιος θα τα εξασφαλίσει και πότε αναμένεται να ολοκληρωθεί η διαδικασία.",
          "Αν ο πωλητής ζητά να πληρώσετε νωρίτερα, εξετάζουμε τι προβλέπει το συμφωνητικό για τα χρήματά σας εάν η εξάλειψη δεν ολοκληρωθεί μέχρι την ημερομηνία που έχετε συμφωνήσει.",
        ],
        source: { href: cadastreCertificates, label: "Ελληνικό Κτηματολόγιο για το κτηματολογικό φύλλο και τα πιστοποιητικά" },
      },
      {
        title: "Η τράπεζα δεν έχει εγκρίνει ακόμη το στεγαστικό",
        paragraphs: [
          "Κρατήστε διαθέσιμη τη γραπτή ενημέρωση της τράπεζας για το στάδιο του δανείου. Η ημερομηνία που προτείνει ο πωλητής για την υπογραφή πρέπει να εξεταστεί μαζί με τον χρόνο που χρειάζεται η τράπεζα για έγκριση και εκταμίευση.",
          "Στο συμφωνητικό κοιτάζουμε τι γίνεται με την προκαταβολή αν η τράπεζα καθυστερήσει ή απορρίψει το δάνειο. Ελέγχουμε επίσης ποιος πρέπει να ενημερώσει τον πωλητή, με ποιον τρόπο και μέχρι πότε.",
        ],
      },
      {
        title: "Σας έστειλαν ήδη σχέδιο συμφωνητικού",
        paragraphs: [
          "Διαβάστε τι δεσμεύεται να κάνει κάθε πλευρά, πότε οφείλεται το ποσό και τι ισχύει αν ο έλεγχος τίτλων αποκαλύψει πρόβλημα. Ζητήστε να ελεγχθεί το ίδιο το κείμενο πριν υπογράψετε ή πληρώσετε.",
          "Αν πρόκειται για προσύμφωνο που δεσμεύει τα μέρη να συνάψουν σύμβαση μεταβίβασης ακινήτου, απαιτείται συμβολαιογραφικό έγγραφο. Το αν η συμφωνία έχει αυτό το περιεχόμενο κρίνεται από τους όρους της.",
        ],
      },
    ],
    contactTitle: "Σας έχουν δώσει ημερομηνία για την προκαταβολή;",
    contactText: "Πείτε μας πού βρίσκεται το ακίνητο, μέχρι πότε σας ζητούν να πληρώσετε και αν έχετε ήδη υπογράψει ή πληρώσει. Κρατήστε διαθέσιμα το σχέδιο της συμφωνίας, τον τίτλο του πωλητή και τυχόν απόδειξη πληρωμής.",
    contactLabel: "Ζητήστε έλεγχο πριν από την προκαταβολή",
    propertyServiceLabel: "Νομικός έλεγχος για αγορά ακινήτου στη Θεσσαλονίκη",
  },
  en: {
    title: "What to check before paying a property deposit in Greece",
    firmName: "Papaioannou & Associates",
    description: "Buying property in Thessaloniki? Check the seller’s title, any mortgage, your financing and the deposit terms before you pay.",
    intro: "You have found a property in Thessaloniki and the seller is asking for a deposit. Ask for the seller’s deed and a draft of the agreement. These are the starting points for checking who can sell the property, what the payment covers and what happens to the money if the purchase falls through.",
    checklistTitle: "What to have before you pay",
    checklist: [
      "The address, municipality and cadastral reference, if available. For an apartment, confirm the floor and any storage room or parking space included in the sale.",
      "The seller’s deed and the information needed to check title and registered encumbrances with the relevant Cadastral Office.",
      "A draft agreement that states the amount, who receives it and how the deposit is credited towards the price.",
      "Dates for the legal checks, financing and signing. Read when the agreement provides for a refund and when the deposit may be kept.",
    ],
    scenarios: [
      {
        title: "The seller says the mortgage will be discharged",
        paragraphs: [
          "We check what appears on the cadastral record and which property right the entry affects. Ask which documents will be needed to discharge the mortgage, who will obtain them and when the process is expected to finish.",
          "If the seller wants you to pay sooner, we check what the agreement says about your deposit if the mortgage has not been discharged by the date you agreed.",
        ],
        source: { href: cadastreCertificates, label: "Hellenic Cadastre guidance on cadastral records and certificates" },
      },
      {
        title: "You are still waiting for mortgage approval",
        paragraphs: [
          "Keep the bank’s written update on your application. Check whether the seller’s proposed signing date gives the bank enough time to approve the loan and release the money.",
          "We check what the agreement says about the deposit if the bank takes longer than expected or declines the loan. We also look at who must notify the seller, how and by what date.",
        ],
      },
      {
        title: "The seller has already sent you a draft agreement",
        paragraphs: [
          "Read what each side is agreeing to, when the deposit is due and what the agreement says if the title check reveals a problem. Have the wording reviewed before you sign or pay.",
          "Greek law requires a notarial document for a preliminary agreement that binds the parties to enter into a property transfer. Whether the draft amounts to that kind of agreement depends on its terms.",
        ],
      },
    ],
    contactTitle: "Has the seller given you a deadline for the deposit?",
    contactText: "Tell us where the property is, when payment is due and whether you have already signed or paid. Have the draft, the seller’s deed and any proof of payment ready.",
    contactLabel: "Request a review before paying a deposit",
    propertyServiceLabel: "Legal checks for buying property in Thessaloniki",
  },
  de: {
    title: "Was Sie vor einer Anzahlung beim Immobilienkauf in Griechenland prüfen sollten",
    firmName: "Papaioannou & Partner",
    description: "Sie kaufen eine Immobilie in Thessaloniki? Prüfen Sie vor der Anzahlung den Eigentumstitel, eingetragene Hypotheken, die Finanzierung und den Vertragsentwurf.",
    intro: "Sie haben eine Immobilie in Thessaloniki gefunden und der Verkäufer verlangt eine Anzahlung. Bitten Sie um seine Eigentumsurkunde und um den Entwurf der Vereinbarung. Anhand dieser Unterlagen prüfen wir, wer verkaufen darf, worauf sich die Zahlung bezieht und was mit dem Geld geschieht, wenn der Kauf nicht zustande kommt.",
    checklistTitle: "Was Sie vor der Zahlung vorliegen haben sollten",
    checklist: [
      "Die Adresse, die Gemeinde und, falls verfügbar, die Katasternummer. Klären Sie bei einer Wohnung das Stockwerk und ob ein Abstellraum oder Stellplatz mitverkauft wird.",
      "Die Eigentumsurkunde des Verkäufers und die Angaben für die Prüfung des Eigentumstitels und der eingetragenen Belastungen beim zuständigen Katasteramt.",
      "Den Entwurf der Vereinbarung mit der Höhe der Anzahlung, dem Zahlungsempfänger und der Regelung zur Anrechnung auf den Kaufpreis.",
      "Die Termine für die rechtliche Prüfung, die Finanzierung und die Unterzeichnung. Lesen Sie, wann die Vereinbarung eine Rückzahlung vorsieht und wann die Anzahlung einbehalten werden kann.",
    ],
    scenarios: [
      {
        title: "Der Verkäufer sagt, dass die Hypothek gelöscht wird",
        paragraphs: [
          "Wir prüfen, was im Katasterblatt eingetragen ist und welches Recht der Eintrag betrifft. Klären Sie, welche Unterlagen für die Löschung nötig sind, wer sie beschafft und wann die Löschung voraussichtlich abgeschlossen ist.",
          "Wenn der Verkäufer die Zahlung schon vorher verlangt, prüfen wir, was die Vereinbarung für Ihre Anzahlung vorsieht, falls die Hypothek zum vereinbarten Termin noch eingetragen ist.",
        ],
        source: { href: cadastreCertificates, label: "Griechisches Kataster zu Katasterblättern und Bescheinigungen" },
      },
      {
        title: "Sie warten noch auf die Kreditzusage",
        paragraphs: [
          "Halten Sie die schriftliche Auskunft der Bank zum Stand Ihres Antrags bereit. Prüfen Sie, ob der vom Verkäufer vorgeschlagene Termin der Bank genügend Zeit für die Zusage und Auszahlung lässt.",
          "Wir prüfen, was mit der Anzahlung passiert, wenn die Bank länger braucht oder den Kredit ablehnt. Dazu gehört auch, wer den Verkäufer wie und bis wann informieren muss.",
        ],
      },
      {
        title: "Der Verkäufer hat Ihnen bereits einen Entwurf geschickt",
        paragraphs: [
          "Lesen Sie, wozu sich jede Seite verpflichtet, wann die Anzahlung fällig ist und was bei einem Problem mit dem Eigentumstitel gilt. Lassen Sie den Wortlaut prüfen, bevor Sie unterschreiben oder zahlen.",
          "Nach griechischem Recht ist für einen Vorvertrag, der die Parteien zum Abschluss eines Vertrags über die Übertragung einer Immobilie verpflichtet, eine notarielle Urkunde erforderlich. Ob der Entwurf als solcher Vorvertrag einzuordnen ist, hängt von seinem Inhalt ab.",
        ],
      },
    ],
    contactTitle: "Hat der Verkäufer eine Frist für die Anzahlung gesetzt?",
    contactText: "Sagen Sie uns, wo die Immobilie liegt, wann die Zahlung fällig ist und ob Sie schon unterschrieben oder gezahlt haben. Halten Sie den Entwurf, die Urkunde des Verkäufers und einen etwaigen Zahlungsbeleg bereit.",
    contactLabel: "Prüfung vor der Anzahlung anfragen",
    propertyServiceLabel: "Rechtliche Prüfung beim Immobilienkauf in Thessaloniki",
  },
};

export const PROPERTY_ATHENS_PAGES = {
  el: {
    seoTitle: "Δικηγόρος για αγορά ακινήτου στην Αθήνα | Παπαϊωάννου",
    description: "Αγορά ακινήτου στην Αθήνα και την Αττική. Ελέγχουμε τίτλους, βάρη, όρους προκαταβολής και το σχέδιο του συμβολαίου από το γραφείο μας στη Θεσσαλονίκη.",
    title: "Νομικός έλεγχος για αγορά ακινήτου στην Αθήνα",
    intro: "Αν ο πωλητής σάς έχει στείλει τον τίτλο για ακίνητο στην Αθήνα, μπορούμε να ξεκινήσουμε από αυτόν. Από τον τίτλο και τις εγγραφές του Κτηματολογίου βλέπουμε τι ακριβώς μεταβιβάζεται. Αν υπάρχει και σχέδιο συμφωνίας, εξετάζουμε πότε σας ζητούν να πληρώσετε και τι προβλέπεται για την προκαταβολή αν ο έλεγχος δείξει πρόβλημα. Χειριζόμαστε αγορές στην Αθήνα και την Αττική από το γραφείο μας στη Θεσσαλονίκη.",
    back: "Αγορά ακινήτου και έλεγχος τίτλων",
    contact: "Μιλήστε μας για το ακίνητο στην Αθήνα",
    identificationTitle: "Ποιο ακίνητο αγοράζετε σύμφωνα με τους τίτλους;",
    identification: "Ξεκινάμε από τον δήμο και την πλήρη διεύθυνση για να βρούμε το αρμόδιο Κτηματολογικό Γραφείο στην Αττική. Αν έχετε τον τίτλο του πωλητή ή τον ΚΑΕΚ, τον κωδικό του ακινήτου στο Κτηματολόγιο, δώστε μας και αυτά τα στοιχεία. Από τους τίτλους και τις εγγραφές ελέγχουμε ποιος έχει δικαίωμα να πουλήσει και αν υπάρχουν υποθήκες, προσημειώσεις ή άλλες εκκρεμότητες που επηρεάζουν τη μεταβίβαση.",
    cadastreLink: "Βρείτε το αρμόδιο Κτηματολογικό Γραφείο",
    apartment: "Αν στη συμφωνία για το διαμέρισμα περιλαμβάνεται αποθήκη ή θέση στάθμευσης, ζητήστε από τον πωλητή να σας δείξει πού αναφέρεται στον τίτλο. Ελέγχουμε αν μεταβιβάζεται μαζί με το διαμέρισμα και ποιο δικαίωμα αποκτάτε.",
    preparationTitle: "Τι χρειαζόμαστε για να ξεκινήσει ο έλεγχος",
    checklist: [
      "Τον δήμο, τη διεύθυνση και τον ΚΑΕΚ, αν τον έχετε.",
      "Τον τίτλο του πωλητή και τυχόν σχέδιο συμφωνίας που σας έδωσαν.",
      "Το ποσό που σας ζήτησαν για προκαταβολή και τυχόν ημερομηνία πληρωμής ή υπογραφής.",
    ],
    feeTitle: "Αμοιβή για τον νομικό έλεγχο ακινήτου",
    fee: "Για την αμοιβή έχει σημασία πόσο πίσω χρειάζεται να φτάσει η έρευνα στους τίτλους και αν υπάρχουν εγγραφές στο Κτηματολόγιο που χρειάζονται διερεύνηση. Στην εκτίμηση συνυπολογίζεται τυχόν έλεγχος του συμφωνητικού για την προκαταβολή ή του σχεδίου του συμβολαίου.",
    coordinationTitle: "Μένετε εκτός Αθήνας;",
    coordination: "Αν βρίσκεστε σε άλλη πόλη ή στο εξωτερικό, μπορούμε πρώτα να δούμε όσα έγγραφα έχετε. Θα σας πούμε τι λείπει από τον φάκελο και τι χρειάζεται να ζητήσουμε από τον πωλητή ή τον συμβολαιογράφο πριν οριστεί η υπογραφή.",
    representation: "Αν δυσκολεύεστε να έρθετε για την υπογραφή, πείτε μας από την πρώτη επικοινωνία. Θα εξετάσουμε με τον συμβολαιογράφο αν μπορείτε να εκπροσωπηθείτε με πληρεξούσιο και τι χρειάζεται να ετοιμάσετε.",
    guideLink: "Δείτε τα 7 βήματα για αγορά ακινήτου στην Ελλάδα",
  },
  en: {
    seoTitle: "Lawyer for Buying Property in Athens | Papaioannou",
    description: "Buying in Athens or Attica? Our Thessaloniki office checks title, encumbrances, deposit terms and the draft deed.",
    title: "Legal checks for buying property in Athens",
    intro: "If the seller has sent you the deed for a property in Athens, we can start there. We read it alongside the cadastral records to see exactly what is being transferred. If there is a draft agreement, we check when payment is due and what happens to the deposit if the title check uncovers a problem. We handle purchases in Athens and across Attica from our office in Thessaloniki.",
    back: "Property purchase and title checks",
    contact: "Talk to us about the property in Athens",
    identificationTitle: "What do the title documents say you are buying?",
    identification: "Give us the municipality and full address so we can find the right Cadastral Office in Attica. If you know the property's cadastral reference (KAEK), provide it with the seller's deed. We review the deeds and register to see who has the right to sell and whether any mortgages, other registered charges or outstanding issues affect the transfer.",
    cadastreLink: "Find the relevant Cadastral Office",
    apartment: "If the deal includes a storage unit or parking space, ask the seller where it appears in the deed. We check whether it transfers with the flat and what rights you acquire.",
    preparationTitle: "What we need to start the checks",
    checklist: [
      "The municipality, address and cadastral reference (KAEK), if you have it.",
      "The seller's deed and any draft agreement you were given.",
      "The amount of the deposit and the date you have been asked to pay or sign.",
    ],
    feeTitle: "Legal fees for a property title check",
    fee: "The fee depends on how far back the title search needs to go and whether any cadastral entries need further investigation. It also takes into account any review of the deposit agreement or draft deed.",
    coordinationTitle: "Based outside Athens?",
    coordination: "If you are in another city or abroad, we can start with the documents you already have. We will tell you what is missing and what we need to request from the seller or notary before a signing date is set.",
    representation: "Tell us early if you may have trouble attending the signing. We will check with the notary whether you can be represented under a power of attorney and what you need to prepare.",
    guideLink: "Read the seven steps to buying property in Greece",
  },
  de: {
    seoTitle: "Anwalt für den Immobilienkauf in Athen | Papaioannou",
    description: "Prüfung von Eigentumstiteln, Belastungen und Kaufvertrag in Athen und Attika durch unsere Kanzlei in Thessaloniki.",
    title: "Rechtliche Prüfung beim Immobilienkauf in Athen",
    intro: "Hat Ihnen der Verkäufer die Eigentumsurkunde für eine Immobilie in Athen geschickt, können wir damit beginnen. Anhand der Urkunde und der Katastereinträge prüfen wir, was genau übertragen wird. Liegt ein Vertragsentwurf vor, prüfen wir die Zahlungsfrist und was mit der Anzahlung geschieht, falls sich bei der Titelprüfung ein Problem zeigt. Wir begleiten Käufe in Athen und Attika von unserer Kanzlei in Thessaloniki aus.",
    back: "Immobilienkauf und Prüfung der Eigentumstitel",
    contact: "Sprechen Sie mit uns über die Immobilie in Athen",
    identificationTitle: "Was steht in den Eigentumsurkunden?",
    identification: "Mit der Gemeinde und der vollständigen Adresse ermitteln wir das zuständige Katasteramt in Attika. Wenn Sie die Katasternummer (KAEK) kennen, geben Sie sie uns zusammen mit der Urkunde des Verkäufers. Anhand der Urkunden und Einträge prüfen wir, wer verkaufen darf und ob Hypotheken, Vormerkungen oder andere offene Punkte die Übertragung betreffen.",
    cadastreLink: "Das zuständige Katasteramt finden",
    apartment: "Wenn ein Abstellraum oder Stellplatz zum Kauf gehört, fragen Sie den Verkäufer, wo er in der Urkunde aufgeführt ist. Wir prüfen, ob er zusammen mit der Wohnung übertragen wird und welche Rechte Sie erwerben.",
    preparationTitle: "Was wir für die Prüfung brauchen",
    checklist: [
      "Die Gemeinde, die Adresse und, falls bekannt, die Katasternummer (KAEK).",
      "Die Urkunde des Verkäufers und einen etwaigen Vertragsentwurf.",
      "Die Höhe der Anzahlung und den Termin, bis zu dem Sie zahlen oder unterschreiben sollen.",
    ],
    feeTitle: "Honorar für die rechtliche Prüfung der Immobilie",
    fee: "Für das Honorar kommt es darauf an, wie weit die Prüfung der Eigentumstitel zurückreichen muss und ob Katastereinträge näher untersucht werden müssen. Auch eine etwaige Prüfung der Anzahlungsvereinbarung oder des Kaufvertragsentwurfs fließt in die Einschätzung ein.",
    coordinationTitle: "Sie wohnen außerhalb Athens?",
    coordination: "Wenn Sie in einer anderen Stadt oder im Ausland sind, können wir zuerst die Unterlagen prüfen, die Sie schon haben. Wir sagen Ihnen, was noch fehlt und welche Unterlagen wir vom Verkäufer oder Notar anfordern müssen, bevor ein Termin festgelegt wird.",
    representation: "Wenn Sie bei der Unterzeichnung möglicherweise nicht dabei sein können, sagen Sie uns früh Bescheid. Wir klären mit dem Notar, ob Sie sich mit einer Vollmacht vertreten lassen können und was Sie dafür vorbereiten müssen.",
    guideLink: "Lesen Sie die sieben Schritte zum Immobilienkauf in Griechenland",
  },
};

export const PROPERTY_NEW_BUILD_PAGES = {
  el: {
    seoTitle: "Δικηγόρος για αγορά νεόδμητου στη Θεσσαλονίκη | Παπαϊωάννου",
    description: "Αγοράζετε νεόδμητο ή ακίνητο υπό κατασκευή στη Θεσσαλονίκη; Ελέγχουμε τους τίτλους, το εργολαβικό συμβόλαιο και τους όρους πληρωμής και παράδοσης.",
    title: "Αγορά νεόδμητου και έλεγχος εργολαβικού συμβολαίου στη Θεσσαλονίκη",
    intro: "Αν ο εργολάβος σάς έδωσε κάτοψη και πρόγραμμα δόσεων για διαμέρισμα υπό κατασκευή, κρατήστε τα μαζί με το σχέδιο της συμφωνίας. Ελέγχουμε τι δεσμεύεται να παραδώσει ο πωλητής, πότε οφείλεται κάθε δόση και ποιος έχει δικαίωμα να υπογράψει τη μεταβίβαση.",
    back: "Αγορά ακινήτου και έλεγχος τίτλων",
    contact: "Ζητήστε έλεγχο εργολαβικού συμβολαίου",
    scope: "Τι ελέγχουμε στους τίτλους και στο εργολαβικό",
    checks: [
      {
        title: "Ποιος έχει δικαίωμα να σας πουλήσει το ακίνητο",
        text: "Ξεκινάμε από τους τίτλους και τα καταχωρισμένα βάρη. Αν άλλος έχει το οικόπεδο και άλλος χτίζει, διαβάζουμε και τη μεταξύ τους συμφωνία για να δούμε ποιος μπορεί να μεταβιβάσει το συγκεκριμένο διαμέρισμα.",
      },
      {
        title: "Τι περιλαμβάνει η αγορά και πότε πληρώνετε",
        text: "Διαβάζουμε το σχέδιο του συμβολαίου μαζί με την κάτοψη. Ελέγχουμε πώς περιγράφονται το διαμέρισμα και τυχόν αποθήκη ή θέση στάθμευσης που περιλαμβάνεται στην αγορά. Αν μια δόση συνδέεται με την πρόοδο του έργου, κοιτάζουμε ποιο στάδιο πρέπει να έχει ολοκληρωθεί για να την καταβάλετε.",
      },
      {
        title: "Τι προβλέπει η συμφωνία για την παράδοση",
        text: "Κοιτάζουμε πότε προβλέπεται να παραλάβετε το διαμέρισμα και με ποιες προδιαγραφές. Εξετάζουμε επίσης τι ορίζει το κείμενο αν αλλάξει η κάτοψη, καθυστερήσει το έργο ή δεν προχωρήσει η αγορά.",
      },
    ],
    preparationTitle: "Έχετε ήδη στα χέρια σας σχέδιο συμφωνίας;",
    preparation: "Στην πρώτη επικοινωνία πείτε μας ποιο είναι το διαμέρισμα και μέχρι πότε σας ζητούν να πληρώσετε ή να υπογράψετε. Κρατήστε διαθέσιμα όσα σας έχουν δώσει, ιδίως το σχέδιο της συμφωνίας, την κάτοψη, τις τεχνικές προδιαγραφές και το χρονοδιάγραμμα πληρωμών ή παράδοσης.",
    questionsTitle: "Συχνές ερωτήσεις για την αγορά νεόδμητου",
    questions: [
      {
        title: "Μου ζητούν χρήματα για να κρατήσουν το διαμέρισμα. Τι κοιτάζω πριν πληρώσω;",
        text: "Ζητήστε τους όρους γραπτώς. Δείτε ποιος εισπράττει το ποσό, ποιο διαμέρισμα κρατούν για εσάς, μέχρι πότε ισχύει η κράτηση και αν το ποσό αφαιρείται από το τίμημα. Κοιτάξτε τι λέει η συμφωνία για την επιστροφή των χρημάτων αν ο έλεγχος τίτλων δείξει πρόβλημα ή αν δεν εγκριθεί το δάνειο που χρειάζεστε για την αγορά.",
      },
      {
        title: "Ποιος υπογράφει αν ο εργολάβος και ο οικοπεδούχος είναι διαφορετικά πρόσωπα;",
        text: "Το βλέπουμε στους τίτλους, στο εργολαβικό συμβόλαιο και σε τυχόν πληρεξούσιο. Ελέγχουμε ποιος μπορεί να υπογράψει τη μεταβίβαση του συγκεκριμένου διαμερίσματος και ποιος έχει αναλάβει να το ολοκληρώσει και να σας το παραδώσει.",
      },
      {
        title: "Τι να ζητήσω από τον μηχανικό για ένα διαμέρισμα υπό κατασκευή;",
        text: "Ζητήστε να συγκρίνει την κάτοψη που σας έδωσαν με τα σχέδια της οικοδομικής άδειας. Ο μηχανικός μπορεί επίσης να ελέγξει την πρόοδο του έργου και τις τεχνικές προδιαγραφές. Εμείς εξετάζουμε τι έχει δεσμευτεί να παραδώσει ο πωλητής. Αν ο μηχανικός βρει διαφορά, ζητήστε να αποτυπωθεί η λύση που θα συμφωνήσετε στο σχέδιο του συμβολαίου πριν υπογράψετε.",
      },
    ],
    lawyer: "Λαμπρινή Παπαϊωάννου",
    role: "Δικηγόρος Παρ’ Εφέταις",
    biography: "Η Λαμπρινή Παπαϊωάννου αναλαμβάνει τον έλεγχο τίτλων και εργολαβικών συμβολαίων για όσους αγοράζουν νεόδμητο ή υπό κατασκευή ακίνητο.",
    team: "Γνωρίστε την ομάδα του γραφείου",
  },
  en: {
    seoTitle: "New Build Property Lawyer in Thessaloniki | Papaioannou",
    description: "Buying a new build or off-plan property in Thessaloniki? We review title, the developer agreement and the terms for payment and handover.",
    title: "Buying a new build in Thessaloniki and checking the developer agreement",
    intro: "If the developer has given you a floor plan and an instalment schedule for a flat still under construction, keep them with the draft agreement. We check what the seller has agreed to deliver, when each payment is due and who can sign the transfer.",
    back: "Property purchase and title checks",
    contact: "Request a review of the developer agreement",
    scope: "What we check in the title and developer agreement",
    checks: [
      {
        title: "Who can sell you the property",
        text: "We start with the title documents and any registered encumbrances. If the landowner and developer are different parties, we also read their agreement to see who can transfer the particular flat to you.",
      },
      {
        title: "What you are buying and when you pay",
        text: "We read the draft agreement alongside the floor plan. We check how it describes the flat and any storage unit or parking space included in the sale. If an instalment is tied to progress on site, we check which stage of construction must be complete before you pay it.",
      },
      {
        title: "What the agreement says about handover",
        text: "We look at the agreed handover date and the specifications the seller has agreed to meet. We also check what the draft says if the floor plan changes, the work runs late or the purchase falls through.",
      },
    ],
    preparationTitle: "Have you already been given a draft agreement?",
    preparation: "When you first contact us, tell us which flat you are considering and when you have been asked to pay or sign. Have the documents you were given to hand, especially the draft agreement, floor plan, technical specifications and any payment or handover schedule.",
    questionsTitle: "Common questions about buying a new-build property",
    questions: [
      {
        title: "I've been asked for money to reserve the flat. What should I check first?",
        text: "Ask for the terms in writing. Check who receives the money, which flat they are holding for you, when the reservation expires and whether the payment comes off the purchase price. Check what the terms say about a refund if the title search reveals a problem or the mortgage you need is declined.",
      },
      {
        title: "Who signs if the developer and the landowner are different parties?",
        text: "We look at the title documents, the development agreement and any power of attorney. They help us establish who can sign the deed transferring that flat and who has agreed to finish and hand it over to you.",
      },
      {
        title: "What should I ask the engineer to check if the flat is still being built?",
        text: "Ask them to compare the floor plan you were given with the plans approved under the building permit. They can also check progress on site and the technical specifications. We check what the seller has agreed to deliver. If the engineer finds a discrepancy, ask for the agreed fix to be written into the draft before you sign.",
      },
    ],
    lawyer: "Lampriní Papaioannou",
    role: "Attorney at the Court of Appeal",
    biography: "Lampriní Papaioannou reviews title documents and developer agreements for people buying newly built homes or properties that are still under construction.",
    team: "Meet the team",
  },
  de: {
    seoTitle: "Anwältin für den Neubaukauf in Thessaloniki | Papaioannou",
    description: "Sie kaufen einen Neubau in Thessaloniki? Wir prüfen die Eigentumstitel, den Bauträgervertrag und die Bedingungen für Zahlung und Übergabe.",
    title: "Neubaukauf und Prüfung des Bauträgervertrags in Thessaloniki",
    intro: "Hat Ihnen der Bauträger für eine Wohnung im Bau einen Grundriss und einen Ratenplan gegeben, bewahren Sie beides zusammen mit dem Vertragsentwurf auf. Wir prüfen, was der Verkäufer übergeben muss, wann die einzelnen Raten fällig werden und wer die Übertragung unterzeichnen darf.",
    back: "Immobilienkauf und Prüfung der Eigentumstitel",
    contact: "Prüfung des Bauträgervertrags anfragen",
    scope: "Was wir in den Eigentumstiteln und im Bauträgervertrag prüfen",
    checks: [
      {
        title: "Wer Ihnen die Immobilie verkaufen kann",
        text: "Wir beginnen mit den Eigentumstiteln und den eingetragenen Belastungen. Sind Grundstückseigentümer und Bauträger verschiedene Personen, prüfen wir auch ihre Vereinbarung, um zu klären, wer die betreffende Wohnung übertragen kann.",
      },
      {
        title: "Was Sie kaufen und wann Sie zahlen",
        text: "Wir lesen den Vertragsentwurf zusammen mit dem Grundriss. Dabei prüfen wir, wie die Wohnung und ein etwaiger Abstellraum oder Stellplatz beschrieben sind. Ist eine Rate an den Baufortschritt geknüpft, klären wir, welcher Bauabschnitt vor der Zahlung abgeschlossen sein muss.",
      },
      {
        title: "Was der Vertrag für die Übergabe vorsieht",
        text: "Wir prüfen den vereinbarten Übergabetermin und die zugesagten Leistungen. Außerdem sehen wir nach, was der Entwurf vorsieht, wenn sich der Grundriss ändert, sich der Bau verzögert oder der Kauf scheitert.",
      },
    ],
    preparationTitle: "Haben Sie bereits einen Vertragsentwurf erhalten?",
    preparation: "Sagen Sie uns beim ersten Kontakt, um welche Wohnung es geht und bis wann Sie zahlen oder unterschreiben sollen. Halten Sie die Unterlagen bereit, die Sie bekommen haben, vor allem den Vertragsentwurf, den Grundriss, die Baubeschreibung und Angaben zu den Zahlungen oder zur Übergabe.",
    questionsTitle: "Häufige Fragen zum Kauf einer Neubauimmobilie",
    questions: [
      {
        title: "Ich soll Geld für die Reservierung zahlen. Was sollte ich vorher prüfen?",
        text: "Bitten Sie um schriftliche Bedingungen. Prüfen Sie, wer das Geld erhält, welche Wohnung für Sie reserviert wird, wann die Reservierung endet und ob der Betrag auf den Kaufpreis angerechnet wird. Klären Sie, ob Sie das Geld zurückbekommen, wenn bei der Titelprüfung ein Problem auftaucht oder Sie das benötigte Darlehen nicht erhalten.",
      },
      {
        title: "Wer unterschreibt, wenn Bauträger und Grundstückseigentümer verschieden sind?",
        text: "Wir sehen in die Eigentumsnachweise, den Vertrag über das Bauvorhaben und eine etwaige Vollmacht. So klären wir, wer die Übertragung der konkreten Wohnung unterzeichnen kann und wer sich verpflichtet hat, die Wohnung fertigzustellen und Ihnen zu übergeben.",
      },
      {
        title: "Was sollte der Ingenieur prüfen, wenn die Wohnung noch im Bau ist?",
        text: "Bitten Sie ihn, den erhaltenen Grundriss mit den genehmigten Bauplänen zu vergleichen. Er kann auch den Baufortschritt und die technischen Vorgaben prüfen. Wir schauen, welche Leistungen der Verkäufer vertraglich zugesagt hat. Stellt der Ingenieur eine Abweichung fest, lassen Sie die vereinbarte Lösung vor der Unterzeichnung im Vertragsentwurf festhalten.",
      },
    ],
    lawyer: "Lampriní Papaioannou",
    role: "Rechtsanwältin am Berufungsgericht",
    biography: "Lampriní Papaioannou prüft Eigentumstitel und Bauträgerverträge für Käuferinnen und Käufer von Neubauten und Immobilien im Bau.",
    team: "Lernen Sie das Kanzleiteam kennen",
  },
};
