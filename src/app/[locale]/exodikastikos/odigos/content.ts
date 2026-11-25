import type { routing } from "@/i18n/routing";

type GuideContent = {
  title: string;
  description: string;
  serviceLink: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
  contactLink: string;
  sourcesHeading: string;
  sourceLabels: [string, string, string, string];
};

export const guideSources = [
  "https://api.et.gr/apiLAW/1/2020/4738/pdf",
  "https://api.et.gr/apiLAW/1/2025/5193/pdf",
  "https://api.et.gr/apiLAW/1/2026/5313/pdf",
  "https://minfin.gov.gr/kratametospitimas.gr/ergaleia/veltiomenos-exodikastikos-michanismos-me-epipleon-kourema-chreous-os-28/sychnes-erotiseis-apantiseis/",
] as const;

export const settlementGuides: Record<(typeof routing.locales)[number], GuideContent> = {
  el: {
    title: "Οδηγός εξωδικαστικού μηχανισμού ρύθμισης οφειλών",
    description: "Πώς υπολογίζεται η πρόταση ρύθμισης, πότε τεκμαίρεται η συναίνεση των πιστωτών και τι ισχύει όταν ο εξωδικαστικός ολοκληρώνεται χωρίς συμφωνία.",
    serviceLink: "Εξωδικαστικός μηχανισμός",
    intro: "Η πλατφόρμα χρησιμοποιεί τα στοιχεία της αίτησης για να υπολογίσει τους όρους μιας ρύθμισης. Το αν η πρόταση θα προχωρήσει εξαρτάται και από την κατηγορία του οφειλέτη, τη στάση των πιστωτών και την επιλογή του οφειλέτη.",
    sections: [
      {
        heading: "Τι υπολογίζει ο αλγόριθμος",
        paragraphs: [
          "Ο αλγόριθμος είναι το υπολογιστικό εργαλείο της πλατφόρμας. Χρησιμοποιεί τα καταχωρισμένα υπόλοιπα των οφειλών, το εισόδημα που απομένει μετά τις εύλογες και ανελαστικές δαπάνες και την εκτιμώμενη αξία ρευστοποίησης της περιουσίας. Όπου προβλέπεται, συνυπολογίζει τα στοιχεία συνοφειλετών ή εγγυητών που συμμετέχουν στη διαδικασία. Με βάση αυτά διαμορφώνει τα ποσά αποπληρωμής, τις δόσεις και την τυχόν διαγραφή ανά πιστωτή.",
          "Δύο οφειλέτες με το ίδιο χρέος μπορεί να λάβουν διαφορετική πρόταση. Ένα ακίνητο με προσημείωση, για παράδειγμα, επηρεάζει τι θα μπορούσε να ανακτήσει ο πιστωτής από την εκποίησή του. Πριν από την υποβολή, στο γραφείο ελέγχουμε ποιος δικαιούται να εισπράξει την οφειλή, πώς προκύπτει το υπόλοιπο που δήλωσε ο servicer και ποιες χρεώσεις ή τόκοι χρειάζονται τεκμηρίωση.",
        ],
      },
      {
        heading: "Πότε τεκμαίρεται η συναίνεση των πιστωτών",
        paragraphs: [
          "Για τον ευάλωτο οφειλέτη που έχει εκδώσει τη σχετική βεβαίωση, ο νόμος θεωρεί ότι οι πιστωτές συναινούν στην πρόταση που διαμορφώνεται με την ειδική διαδικασία του άρθρου 14 παρ. 3. Ο ίδιος κανόνας καλύπτει και τους επιλέξιμους οφειλέτες με έως το διπλάσιο των εισοδηματικών και περιουσιακών κριτηρίων του ευάλωτου, εφόσον πληρούν και τον ειδικό όρο για οφειλές προς χρηματοδοτικούς φορείς έως 300.000 €, με καθυστέρηση τουλάχιστον 90 ημερών, εν όλω ή εν μέρει, κατά την έναρξη ισχύος του ν. 5193/2025.",
          "Ο οφειλέτης μπορεί να αποδεχθεί ή να απορρίψει την πρόταση. Πιστωτής που την αμφισβητεί έχει 20 ημέρες από την εξαγωγή της για να ασκήσει ανακοπή στο αρμόδιο Πρωτοδικείο. Οι λόγοι περιορίζονται σε ανακριβή στοιχεία που υπέβαλε ο οφειλέτης ή σε μικρότερη ικανοποίηση της απαίτησης του πιστωτή σε σχέση με εκείνη που θα προέκυπτε από αναγκαστική εκτέλεση.",
        ],
      },
      {
        heading: "Πότε μπορούν οι πιστωτές να απορρίψουν την πρόταση",
        paragraphs: [
          "Στην πολυμερή διαδικασία εκτός του καθεστώτος τεκμαιρόμενης συναίνεσης, οι χρηματοδοτικοί φορείς αξιολογούν την πρόταση και μπορούν να συναινέσουν, να υποβάλουν αντιπρόταση ή να αρνηθούν τη ρύθμιση. Για να προχωρήσει η συμφωνία χρειάζεται συναίνεση που να καλύπτει τουλάχιστον το 60% των απαιτήσεων των συμμετεχόντων χρηματοδοτικών φορέων και το 40% των απαιτήσεών τους με ειδικό προνόμιο, όπως υποθήκη ή προσημείωση. Τα ποσοστά υπολογίζονται στο ύψος των απαιτήσεων.",
          "Οι χρηματοδοτικοί φορείς οφείλουν να αιτιολογούν τη μη συναίνεση στην πρόταση της πλατφόρμας. Ένας λόγος μπορεί να είναι η αντικειμενική αδυναμία τήρησης των προτεινόμενων δόσεων. Άλλος λόγος μπορεί να είναι ένας πλειστηριασμός που επίκειται μέσα στο επόμενο τρίμηνο. Όταν η πολυμερής διαδικασία αποτυγχάνει στο στάδιο των πιστωτών, μπορεί να εξεταστεί χωριστή ρύθμιση προς το Δημόσιο ή τους φορείς κοινωνικής ασφάλισης, εφόσον πληρούνται οι προϋποθέσεις της.",
        ],
      },
      {
        heading: "Τι ισχύει αν η διαδικασία κλείσει χωρίς συμφωνία",
        paragraphs: [
          "Για τις οφειλές που μένουν αρρύθμιστες, η προσωρινή αναστολή του άρθρου 18 λήγει, όπου είχε ενεργοποιηθεί. Ο πιστωτής μπορεί τότε να συνεχίσει την αναγκαστική εκτέλεση, εφόσον έχει τις νόμιμες προϋποθέσεις. Η αναστολή έχει εξ αρχής εξαιρέσεις. Μεταξύ άλλων, εξαιρείται ο πλειστηριασμός που έχει προγραμματιστεί μέσα σε τρεις μήνες από την υποβολή, καθώς και οι προπαρασκευαστικές ενέργειες του ενέγγυου πιστωτή, στις οποίες μπορεί να περιλαμβάνεται κατάσχεση.",
          "Αν έχει ήδη επιδοθεί διαταγή πληρωμής, κατασχετήρια έκθεση ή πρόγραμμα πλειστηριασμού, εξετάζουμε τις επιδόσεις και τις προθεσμίες χωριστά από την πορεία της αίτησης. Έτσι μπορούμε να αξιολογήσουμε εγκαίρως αν χρειάζεται ανακοπή, αίτημα αναστολής ή διαπραγμάτευση με τον πιστωτή.",
        ],
      },
      {
        heading: "Τι ελέγχουμε πριν αποδεχθείτε μια πρόταση",
        paragraphs: [
          "Εξετάζουμε τον πίνακα δόσεων ανά πιστωτή, το συνολικό κόστος της ρύθμισης, τις εξασφαλίσεις και τις συνέπειες αν η ρύθμιση αθετηθεί. Για παράδειγμα, μια δόση που χωρά στον μηνιαίο προϋπολογισμό μπορεί να συνοδεύεται από σύμβαση που περιλαμβάνει υπόλοιπο το οποίο αμφισβητείτε. Η σύμβαση αναδιάρθρωσης μπορεί να χρησιμοποιηθεί ως εκτελεστός τίτλος από χρηματοδοτικούς φορείς σύμφωνα με το άρθρο 27. Γι’ αυτό ελέγχουμε και την απαίτηση που μπαίνει στη σύμβαση, μαζί με το ύψος της δόσης.",
          "Ο φάκελος για τον έλεγχο περιλαμβάνει την πλήρη πρόταση, την αναλυτική κίνηση της οφειλής και τυχόν έγγραφα που έχουν ήδη επιδοθεί.",
        ],
      },
    ],
    contactLink: "Επικοινωνία με το γραφείο για έλεγχο πρότασης",
    sourcesHeading: "Νομοθεσία και διαδικασία",
    sourceLabels: ["Ν. 4738/2020", "Άρθρο 178 του ν. 5193/2025", "Άρθρο 15 του ν. 5313/2026", "Ερωτήσεις και απαντήσεις του Υπουργείου Οικονομικών"],
  },
  en: {
    title: "Guide to Greece’s out-of-court debt settlement mechanism",
    description: "How the platform calculates a settlement offer, when creditor consent is deemed to have been given, and what happens if the procedure ends without an agreement.",
    serviceLink: "Out-of-court debt settlement",
    intro: "The platform uses the information in the application to calculate settlement terms. Whether the offer goes ahead also depends on the debtor’s legal category, the creditors’ response and the debtor’s decision.",
    sections: [
      {
        heading: "What the algorithm calculates",
        paragraphs: [
          "The algorithm is the platform’s calculation tool. It uses the recorded debt balances, the income left after reasonable and unavoidable expenses, and the estimated liquidation value of the debtor’s assets. Where the rules require it, the tool also considers the information of any co-debtors or guarantors taking part. It uses these figures to determine the repayment amount, instalments and any write-off for each creditor.",
          "Two debtors with the same balance can receive different offers. For example, a property subject to a mortgage prenotation affects how much a creditor could recover from its sale. Before filing, our firm checks who is entitled to collect the debt, how the servicer calculated the balance it reported, and which charges or interest entries need supporting documents.",
        ],
      },
      {
        heading: "When creditor consent is deemed to have been given",
        paragraphs: [
          "For a vulnerable debtor who holds the relevant certificate, the law deems the creditors to have consented to the offer produced under the special procedure in Article 14(3). The rule also covers eligible debtors whose income and assets fall within twice the limits for vulnerable debtors, provided they meet the specific condition for debts of up to €300,000 to financial creditors, with all or part of those debts at least 90 days overdue when Law 5193/2025 entered into force.",
          "The debtor can accept or reject the offer. A creditor who challenges it has 20 days from the date it is generated to file an objection with the competent Court of First Instance. The grounds are limited to inaccurate information submitted by the debtor or a lower recovery for the creditor than it would obtain through enforcement.",
        ],
      },
      {
        heading: "When creditors can reject an offer",
        paragraphs: [
          "In the multilateral procedure outside the deemed-consent rules, financial creditors review the offer and can agree to it, submit a counter-offer or decline settlement. An agreement requires consent covering at least 60% of the claims of participating financial creditors and 40% of their claims with special priority, such as those secured by a mortgage or mortgage prenotation. These thresholds are based on the value of the claims.",
          "Financial creditors must give reasons for declining the platform’s offer. These can include an inability to meet the proposed instalments or an auction scheduled within the next three months. If the multilateral procedure ends at the creditor stage, a separate arrangement for debts to the State or social security bodies may still be considered if its conditions are met.",
        ],
      },
      {
        heading: "What happens if the procedure ends without an agreement",
        paragraphs: [
          "For debts that remain unsettled, the temporary stay under Article 18 ends where it had applied. A creditor can then resume enforcement if the legal conditions are met. The stay has exceptions from the outset. They include an auction scheduled within three months of filing and preparatory steps taken by a secured creditor, which can include attachment.",
          "If a payment order, attachment report or auction notice has already been served, we check the dates of service and the applicable deadlines separately from the progress of the application. This gives us time to assess whether a formal objection, an application for a stay or negotiations with the creditor are appropriate.",
        ],
      },
      {
        heading: "What we check before you accept an offer",
        paragraphs: [
          "We review the instalment schedule for each creditor, the total cost of the settlement, the security and the consequences of default. An instalment that fits your monthly budget can come with an agreement that includes a balance you dispute. Under Article 27, financial creditors can use a restructuring agreement as an enforceable instrument. We therefore review the claim covered by the agreement alongside the instalment amount.",
          "To review the offer, we need the full proposal, a detailed statement showing the debt transactions and any documents already served.",
        ],
      },
    ],
    contactLink: "Contact our firm to review a settlement offer",
    sourcesHeading: "Legislation and procedure",
    sourceLabels: ["Law 4738/2020", "Article 178 of Law 5193/2025", "Article 15 of Law 5313/2026", "Ministry of Finance questions and answers (in Greek)"],
  },
  de: {
    title: "Leitfaden zum außergerichtlichen Schuldenregulierungsverfahren in Griechenland",
    description: "Wie der Regulierungsvorschlag berechnet wird, wann die Zustimmung der Gläubiger als erteilt gilt und was bei einem Verfahren ohne Einigung geschieht.",
    serviceLink: "Außergerichtliche Schuldenregulierung",
    intro: "Die Plattform berechnet die Bedingungen einer Schuldenregelung anhand der Angaben im Antrag. Ob der Vorschlag umgesetzt wird, hängt auch von der rechtlichen Einstufung des Schuldners, der Haltung der Gläubiger und der Entscheidung des Schuldners ab.",
    sections: [
      {
        heading: "Was der Algorithmus berechnet",
        paragraphs: [
          "Der Algorithmus ist das Berechnungswerkzeug der Plattform. Er berücksichtigt die erfassten Schuldsalden, das nach angemessenen und unvermeidbaren Ausgaben verbleibende Einkommen und den geschätzten Verwertungserlös des Vermögens. Soweit vorgesehen, fließen auch Angaben zu beteiligten Mitschuldnern oder Bürgen ein. Daraus ergeben sich je Gläubiger der Rückzahlungsbetrag, die Raten und ein möglicher Schuldenerlass.",
          "Zwei Schuldner mit derselben Schuldenhöhe können unterschiedliche Vorschläge erhalten. Bei einer Immobilie mit einer Hypothekenvormerkung spielt beispielsweise eine Rolle, welchen Betrag der Gläubiger aus ihrer Verwertung erzielen könnte. Vor der Antragstellung prüfen wir, wer die Forderung einziehen darf, wie der Kreditdienstleister den gemeldeten Saldo berechnet hat und welche Gebühren oder Zinsen belegt werden müssen.",
        ],
      },
      {
        heading: "Wann die Zustimmung der Gläubiger als erteilt gilt",
        paragraphs: [
          "Bei einem schutzbedürftigen Schuldner mit entsprechender Bescheinigung gilt die Zustimmung der Gläubiger zu dem nach Artikel 14 Absatz 3 erstellten Vorschlag als erteilt. Das gilt auch für anspruchsberechtigte Schuldner, deren Einkommen und Vermögen bis zum Doppelten der Grenzwerte für schutzbedürftige Schuldner reichen. Voraussetzung sind dabei Schulden von bis zu 300.000 € bei Finanzgläubigern, die bei Inkrafttreten des Gesetzes 5193/2025 ganz oder teilweise seit mindestens 90 Tagen überfällig waren.",
          "Der Schuldner kann den Vorschlag annehmen oder ablehnen. Ein Gläubiger, der ihn anfechten möchte, hat ab Erstellung des Vorschlags 20 Tage Zeit, beim zuständigen Gericht erster Instanz einen Rechtsbehelf einzulegen. Als Gründe kommen unzutreffende Angaben des Schuldners oder eine geringere Befriedigung der Forderung in Betracht, als sie bei einer Zwangsvollstreckung zu erwarten wäre.",
        ],
      },
      {
        heading: "Wann Gläubiger den Vorschlag ablehnen können",
        paragraphs: [
          "Im Verfahren mit mehreren Gläubigern außerhalb der gesetzlichen Zustimmungsregel prüfen die Finanzgläubiger den Vorschlag. Sie können zustimmen, einen Gegenvorschlag machen oder die Regelung ablehnen. Für eine Einigung ist die Zustimmung für mindestens 60 % der Forderungen der beteiligten Finanzgläubiger sowie für 40 % ihrer Forderungen mit besonderem Vorrecht erforderlich, etwa bei einer Hypothek oder Hypothekenvormerkung. Maßgeblich ist jeweils die Höhe der Forderungen.",
          "Finanzgläubiger müssen begründen, warum sie einem Vorschlag der Plattform nicht zustimmen. Als Gründe kommen etwa die objektive Unmöglichkeit, die vorgeschlagenen Raten zu zahlen, oder eine in den nächsten drei Monaten anstehende Zwangsversteigerung in Betracht. Scheitert das Verfahren bei den Gläubigern, kann eine gesonderte Regelung für Schulden beim Staat oder bei Sozialversicherungsträgern geprüft werden, sofern die Voraussetzungen dafür vorliegen.",
        ],
      },
      {
        heading: "Was passiert, wenn das Verfahren ohne Einigung endet",
        paragraphs: [
          "Für ungeregelte Schulden endet die vorläufige Aussetzung nach Artikel 18, soweit sie zuvor galt. Gläubiger können dann bei Vorliegen der gesetzlichen Voraussetzungen die Zwangsvollstreckung fortsetzen. Die Aussetzung kennt von Anfang an Ausnahmen. Dazu zählen eine innerhalb von drei Monaten nach Antragstellung angesetzte Versteigerung und vorbereitende Maßnahmen eines besicherten Gläubigers, zu denen auch eine Pfändung gehören kann.",
          "Wurde bereits ein Zahlungsbefehl, ein Pfändungsprotokoll oder eine Versteigerungsankündigung zugestellt, prüfen wir die Zustellungen und die geltenden Fristen unabhängig vom Stand des Antrags. So lässt sich rechtzeitig beurteilen, ob ein Rechtsbehelf, ein Aussetzungsantrag oder eine Verhandlung mit dem Gläubiger in Betracht kommt.",
        ],
      },
      {
        heading: "Was wir prüfen, bevor Sie einen Vorschlag annehmen",
        paragraphs: [
          "Wir prüfen den Ratenplan je Gläubiger, die Gesamtkosten der Regelung, die Sicherheiten und die Folgen eines Zahlungsverzugs. Eine tragbare Monatsrate kann beispielsweise mit einer Vereinbarung verbunden sein, die einen von Ihnen bestrittenen Saldo umfasst. Nach Artikel 27 können Finanzgläubiger die Restrukturierungsvereinbarung als Vollstreckungstitel nutzen. Deshalb prüfen wir neben der Ratenhöhe auch die Forderung, die in die Vereinbarung aufgenommen werden soll.",
          "Für die Prüfung benötigen wir den vollständigen Vorschlag, eine detaillierte Aufstellung der Forderungsbewegungen und bereits zugestellte Unterlagen.",
        ],
      },
    ],
    contactLink: "Kanzlei zur Prüfung eines Regulierungsvorschlags kontaktieren",
    sourcesHeading: "Rechtsgrundlagen und Verfahren",
    sourceLabels: ["Gesetz 4738/2020", "Artikel 178 des Gesetzes 5193/2025", "Artikel 15 des Gesetzes 5313/2026", "Fragen und Antworten des Finanzministeriums (auf Griechisch)"],
  },
};
