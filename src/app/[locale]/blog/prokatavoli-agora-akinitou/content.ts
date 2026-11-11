const cadastreCertificates = "https://www.ktimatologio.gr/pliroforiako-yliko/ktimatologio-se-leitourgia/21";

type DepositGuide = {
  title: string;
  firmName: string;
  description: string;
  intro: string;
  checklistTitle: string;
  checklist: string[];
  scenarios: {
    title: string;
    paragraphs: string[];
    source?: { href: string; label: string };
  }[];
  contactTitle: string;
  contactText: string;
  contactLabel: string;
  propertyServiceLabel: string;
};

export const depositGuides: Record<"el" | "en" | "de", DepositGuide> = {
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
