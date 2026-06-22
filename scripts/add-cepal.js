const fs = require("fs");

const cepalEl = {
  seoTitle: "Δικηγόρος για Cepal – Πλειστηριασμοί Θεσσαλονίκη",
  seoDescription:
    "Έλαβες εξώδικο ή διαταγή πληρωμής από την Cepal; Κάθε έγγραφο έχει αυστηρή προθεσμία άμυνας. Ανακοπή, αναστολή πλειστηριασμού, ρύθμιση χρέους στη Θεσσαλονίκη. Τηλ: 2310 545 261.",
  heroCity: "Θεσσαλονίκη · Λέοντος Σοφού 12",
  heroTitle: "Δικηγόρος για Πλειστηριασμούς από την Cepal στη Θεσσαλονίκη",
  heroSubtitle: "Ανακοπή · Αναστολή · Διαπραγμάτευση Κουρέματος",
  intro:
    "Τα έγγραφα της Cepal δεν ζητούν απλώς χρήματα — θέτουν σε κίνηση μια νομική μηχανή με αυστηρά χρονοδιαγράμματα. Εξώδικο, διαταγή πληρωμής, κατάσχεση, πρόγραμμα πλειστηριασμού: κάθε βήμα ανοίγει ένα παράθυρο δράσης που κλείνει οριστικά όταν παρέλθει η προθεσμία. Το γραφείο μας αντιμετωπίζει υποθέσεις από servicers καθημερινά στα δικαστήρια της Θεσσαλονίκης. Ο Ιωάννης Παπαϊωάννου, Νομικός Σύμβουλος του Συλλόγου Δανειοληπτών & Προστασίας Καταναλωτών Βορείου Ελλάδος, γνωρίζει το μοτίβο της Cepal — και πώς να σπάσει.",
  whatTitle: "Τι είναι η Cepal και τι σημαίνει για το δάνειό σας",
  whatText:
    "Η Cepal Hellas Financial Services είναι ο μεγαλύτερος servicer στη χώρα από άποψη διαχειριζόμενου χαρτοφυλακίου — διαχειρίζεται κυρίως δάνεια από την Eurobank (πρόγραμμα τιτλοποίησης Cairo) και από άλλες ελληνικές τράπεζες. Δύο σημεία που πρέπει να γνωρίζετε: πρώτον, η Cepal είναι διαχειριστής, όχι ιδιοκτήτης — πρέπει κάθε φορά να αποδεικνύει νομότυπα την εξουσία της να ενεργεί για λογαριασμό του fund. Δεύτερον, τα χαρτοφυλάκιά της αποκτήθηκαν σε κλάσμα της ονομαστικής αξίας. Αυτός ο αριθμός καθορίζει τι «κέρδος» αφήνει μια ρύθμιση — και είναι το κλειδί σε κάθε διαπραγμάτευση.",
  protectTitle: "Προστασία Πρώτης Κατοικίας από Πλειστηριασμό της Cepal",
  protectText:
    "Η Cepal είναι από τους πιο δραστήριους servicers σε πλειστηριασμούς στην Ελλάδα — ο μεγάλος όγκος υποθέσεών της δημιουργεί και συστηματικές αδυναμίες στη διαδικασία. Σε κάθε φάκελο που εξετάζουμε ελέγχουμε από μηδέν: αν η νομιμοποίηση αποδεικνύεται πλήρως, αν το ποσό έχει υπολογιστεί σωστά, αν κάθε επίδοση και κάθε πράξη εκτέλεσης τηρεί το γράμμα του νόμου. Ο μεγάλος όγκος δουλειάς των servicers σημαίνει συχνά βιαστικές διαδικασίες — αυτό σημαίνει ανοιχτά σημεία άμυνας.",
  deadlinesTitle:
    "Έλαβα Εξώδικο ή Διαταγή Πληρωμής από την Cepal: Οι κρίσιμες προθεσμίες",
  deadlinesIntro:
    "Το ελληνικό δίκαιο δεν δίνει παρατάσεις για απαντήσεις κατά servicers. Αν χαθεί η προθεσμία, ο εκτελεστός τίτλος γίνεται απρόσβλητος και ο δρόμος για κατάσχεση ανοίγει χωρίς εμπόδια.",
  deadlines: [
    {
      title: "Διαταγή Πληρωμής — 15 εργάσιμες ημέρες",
      desc: "Η ανακοπή ασκείται μέσα σε 15 εργάσιμες ημέρες από την επίδοση. Μετά από αυτές, η Cepal αποκτά εκτελεστό τίτλο και μπορεί να προχωρήσει σε κατάσχεση.",
    },
    {
      title: "Κατάσχεση — 45 ημέρες",
      desc: "Η ανακοπή κατά εκτέλεσης έχει προθεσμία 45 ημερών. Σε αυτό το στάδιο προσβάλλονται η νομιμοποίηση, το ύψος της απαίτησης και τυχόν πλημμέλειες της κατασχετήριας διαδικασίας.",
    },
    {
      title: "Πριν τον Πλειστηριασμό — οι τελευταίες 15 ημέρες",
      desc: "Και με ορισμένη ημερομηνία πλειστηριασμού, παραμένει δυνατότητα αίτησης αναστολής εκτέλεσης. Η έγκαιρη κατάθεση μεγιστοποιεί τις πιθανότητες επιτυχίας — αλλά και στην ύστατη στιγμή εξετάζουμε κάθε μέσο.",
    },
  ],
  deadlinesWarning:
    "Η ημερομηνία επίδοσης της Cepal τρέχει ήδη αντίστροφα. Φέρτε τον φάκελο για έλεγχο σήμερα — μην αναμένετε «βολική» στιγμή.",
  cta1Title: "Έχετε έγγραφο της Cepal μπροστά σας;",
  cta1Text:
    "Ελέγχουμε αμέσως: τι ακριβώς σας επιδόθηκε, τι προθεσμία τρέχει και ποιες κινήσεις είναι διαθέσιμες. Καλέστε στο 2310 545 261 ή στείλτε τη φόρμα.",
  negotiationTitle:
    "Στρατηγικές Διαπραγμάτευσης: Πώς πετυχαίνουμε ρύθμιση με κούρεμα με την Cepal",
  negotiationIntro:
    "Η Cepal διαχειρίζεται χαρτοφυλάκιο που αποκτήθηκε σε discount — αυτό δεν το λέμε θεωρητικά, το χρησιμοποιούμε πρακτικά στη διαπραγμάτευση. Πώς δομούμε τη θέση μας:",
  negotiationPoints: [
    "Λεπτομερής έλεγχος φακέλου πριν από κάθε επαφή: νομιμοποίηση, πραγματικό υπόλοιπο, τόκοι και χρεώσεις που ενδέχεται να αμφισβητηθούν. Δεν πάμε σε διαπραγμάτευση χωρίς να ξέρουμε ακριβώς με τι απαίτηση έχουμε να κάνουμε.",
    "Το πραγματικό κόστος κτήσης ως αφετηρία πρότασης: το χαρτοφυλάκιο αγοράστηκε σε κλάσμα — η πρότασή μας βασίζεται στη λογική της οικονομικής αξίας, όχι στον αριθμό που εμφανίζει η επιστολή.",
    "Ρύθμιση προσαρμοσμένη στην πραγματική δυνατότητα αποπληρωμής: στόχος είναι μια ρύθμιση που τηρείται, όχι μια δόση που θα καταρρεύσει σε 6 μήνες.",
    "Δικαστική πίεση ως διαπραγματευτικός μοχλός: η εκκρεμής ανακοπή αλλάζει το κλίμα της διαπραγμάτευσης — ο servicer συνειδητοποιεί ότι έχει απέναντί του νομικά εκπροσωπούμενο αντίδικο.",
  ],
  negotiationOutro:
    "Ο στόχος δεν είναι η καλύτερη «δυνατή» ρύθμιση κάτω από πίεση — είναι η ρύθμιση που ταιριάζει στον συγκεκριμένο φάκελο, με συγκεκριμένους αριθμούς και συγκεκριμένη στρατηγική.",
  cta2Title: "Πριν υπογράψετε οτιδήποτε με την Cepal — μιλήστε μας.",
  cta2Text:
    "Μια βιαστική συμφωνία μπορεί να είναι χειρότερη από το να μην έχεις υπογράψει τίποτα. Ελέγχουμε πρώτα, μετά αποφασίζουμε.",
  anakopiTitle:
    "Ανακοπή και Αναστολή Πλειστηριασμού κατά Cepal στη Θεσσαλονίκη",
  anakopiText1:
    "Η Cepal, λόγω του τεράστιου όγκου χαρτοφυλακίου, είναι ιδιαίτερα εκτεθειμένη σε πλημμέλειες διαδικασίας. Οι λόγοι που συχνότερα θεμελιώνουν ανακοπή ή αναστολή σε υποθέσεις της:",
  anakopiPoints: [
    "Αδύναμη αλυσίδα νομιμοποίησης: η τιτλοποίηση και η ανάθεση διαχείρισης δημιουργούν πολλαπλά βήματα μεταβίβασης που πρέπει να αποδεικνύονται νομότυπα — κενά εδώ αποτελούν ισχυρό λόγο ανακοπής.",
    "Εσφαλμένο ύψος απαίτησης: παράνομοι ανατοκισμοί, καταχρηστικές προμήθειες, τόκοι υπερημερίας που υπολογίστηκαν λανθασμένα.",
    "Καταχρηστικοί συμβατικοί όροι: ρήτρες που δεν είχαν διαπραγματευτεί ατομικά και που κλονίζουν τη νομική βάση της απαίτησης.",
    "Τυπικές πλημμέλειες εκτέλεσης: ελαττωματικές επιδόσεις, λανθασμένα ποσά στην κατασχετήρια έκθεση, μη τήρηση νόμιμων διαστημάτων.",
  ],
  anakopiText2:
    "Σε υποθέσεις όπου κρίνεται αναγκαίο, η ανακοπή συνοδεύεται από άμεση αίτηση αναστολής ώστε ο πλειστηριασμός να σταματήσει εωσότου εκδοθεί απόφαση. Αυτός ο συνδυασμός — δικαστική άμυνα και παράλληλη διαπραγμάτευση — είναι συνήθως η πιο αποδοτική προσέγγιση.",
  faqTitle: "Συχνές Ερωτήσεις για την Cepal",
  faq: [
    {
      q: "Η Cepal μου ζητάει να υπογράψω εξωδικαστικό. Να το κάνω;",
      a: "Πριν υπογράψετε τίποτα, ελέγξτε το με δικηγόρο. Ένας εξωδικαστικός μπορεί να σας αποκλείσει από υπεράσπιση που σήμερα έχετε — ανακοπή, αμφισβήτηση ποσού, αναστολή. Το ελέγχουμε κατά την πρώτη επικοινωνία.",
    },
    {
      q: "Η Cepal είναι ο μεγαλύτερος servicer. Μπορώ να τη νικήσω;",
      a: "Το μέγεθος δεν προστατεύει από νομικές πλημμέλειες — αντίθετα, ο μεγάλος όγκος υποθέσεων αυξάνει την πιθανότητα σφαλμάτων σε επιδόσεις, υπολογισμούς και αλυσίδα νομιμοποίησης. Αυτό εξετάζουμε πρώτο.",
    },
    {
      q: "Το δάνειό μου ήταν της Eurobank. Γιατί τώρα μου γράφει η Cepal;",
      a: "Το δάνειό σας πιθανώς εντάχθηκε στο πρόγραμμα τιτλοποίησης Cairo ή άλλο SPV και η Cepal ανέλαβε τη διαχείρισή του. Η μεταβίβαση αυτή πρέπει να έχει γίνει νομότυπα και να σας έχει κοινοποιηθεί — ελέγξτε το.",
    },
    {
      q: "Πόσο κοστίζει η νομική εκπροσώπηση απέναντι στην Cepal;",
      a: "Κάθε φάκελος είναι διαφορετικός. Η πρώτη αξιολόγηση γίνεται χωρίς κόστος — και η πρόταση αμοιβής βασίζεται στο πραγματικό εύρος της υπόθεσης, όχι σε κατάλογο.",
    },
    {
      q: "Τι γίνεται αν δεν ανταποκριθώ καθόλου στην Cepal;",
      a: "Η σιωπή δεν αποτελεί άμυνα. Αν έχει εκδοθεί διαταγή πληρωμής ή έχει γίνει κατάσχεση, η αδράνεια επιτρέπει στη Cepal να προχωρά χωρίς εμπόδια. Όσο νωρίτερα ελέγχετε τον φάκελο, τόσο περισσότερες επιλογές έχετε.",
    },
  ],
  ctaTitle: "Η Cepal δουλεύει καθημερινά. Η άμυνά σας πρέπει να αρχίσει σήμερα.",
  ctaText:
    "Γραφείο Λέοντος Σοφού 12, Θεσσαλονίκη. Ο φάκελός σας αξιολογείται κατεπειγόντως — κάθε εργάσιμη ημέρα που χάνεται μπορεί να μετράει.",
  ctaButton: "Άμεσος Έλεγχος Φακέλου",
  ctaPhone: "Καλέστε τώρα: 2310 545 261",
};

const cepalEn = {
  seoTitle: "Lawyer for Cepal – Property Auctions Thessaloniki",
  seoDescription:
    "Received a payment order or enforcement notice from Cepal? Every document triggers strict deadlines for legal defence. Objection, suspension, debt settlement in Thessaloniki. Tel: 2310 545 261.",
  heroCity: "Thessaloniki · 12 Leontos Sofou St.",
  heroTitle: "Lawyer for Cepal Auctions and Enforcement in Thessaloniki",
  heroSubtitle: "Objection · Suspension · Debt Settlement",
  intro:
    "Documents from Cepal are not mere reminders — they start legal processes with firm deadlines. Payment order, seizure, auction programme: each document opens a window for action that closes permanently once the deadline passes. Our office handles servicer cases at the Thessaloniki courts on a daily basis. Ioannis Papaioannou, Legal Adviser to the Association of Borrowers and Consumer Protection of Northern Greece, knows how Cepal operates — and how to build an effective defence.",
  whatTitle: "What Is Cepal and What Does It Mean for Your Loan?",
  whatText:
    "Cepal Hellas Financial Services is the largest servicer in Greece by managed portfolio, primarily handling loans from Eurobank (Cairo securitisation programme) and other Greek banks. Two key points: first, Cepal is a manager, not the owner of your loan — it must prove its authority to act on the fund's behalf at every step. Second, these portfolios were acquired at a fraction of face value. That acquisition price is the foundation of any realistic settlement negotiation.",
  protectTitle: "Protecting Your Primary Residence from Cepal Auction",
  protectText:
    "Because of its large portfolio volume, Cepal moves quickly — and that speed creates procedural vulnerabilities. We check every file from the start: whether authority is properly established, whether the debt amount is correctly calculated, whether every service of process and enforcement act complies strictly with Greek law. High volume often means rushed procedures — and rushed procedures create grounds for challenge.",
  deadlinesTitle: "Received a Payment Order or Notice from Cepal? Critical Deadlines",
  deadlinesIntro:
    "Greek procedural law grants no extensions on deadlines for challenging servicers. Once a deadline passes, the enforcement title becomes unassailable and the path to seizure opens unobstructed.",
  deadlines: [
    {
      title: "Payment Order — 15 working days",
      desc: "An objection must be filed within 15 working days of service. After that, Cepal holds an enforceable title and can proceed to property seizure.",
    },
    {
      title: "Seizure — 45 days",
      desc: "The objection against enforcement must be filed within 45 days of seizure. At this stage, the authority chain, the debt amount, and procedural defects can all be challenged.",
    },
    {
      title: "Before Auction — last 15 days",
      desc: "Even with an auction date set, an application for suspension of enforcement remains possible. Every day earlier improves the chances — but we examine every available option even at the last moment.",
    },
  ],
  deadlinesWarning:
    "The clock started the day Cepal served the document. Do not wait for a convenient moment — bring the file for review today.",
  cta1Title: "Do you have a Cepal document in front of you?",
  cta1Text:
    "Immediate first review: what was served, which deadline is running, what options you have. Call 2310 545 261 or send the contact form.",
  negotiationTitle: "Negotiation Strategy: Achieving a Viable Debt Settlement with Cepal",
  negotiationIntro:
    "Cepal manages portfolios acquired at a discount — we use this as a practical tool in negotiation, not just a theoretical point. How we build your position:",
  negotiationPoints: [
    "Full file review before any contact: authority chain, actual balance, interest charges and fees that may be disputed. We do not negotiate without knowing exactly what claim we are dealing with.",
    "Acquisition cost as the starting point for any proposal: the portfolio was purchased at a fraction of face value — our offer is based on economic reality, not the figure in the letter.",
    "Settlement tailored to real repayment capacity: the goal is an agreement that holds, not an instalment that collapses in six months.",
    "Court proceedings as a negotiating lever: a pending objection changes the dynamic — Cepal recognises it is dealing with a legally represented counterparty, not an uninformed debtor.",
  ],
  negotiationOutro:
    "The goal is not the best possible deal under pressure — it is the settlement that fits the specific file, with specific numbers and a specific strategy.",
  cta2Title: "Before signing anything with Cepal — speak to us first.",
  cta2Text:
    "A rushed settlement can be worse than signing nothing. We review first, then decide.",
  anakopiTitle: "Objection and Suspension of Cepal Auctions in Thessaloniki",
  anakopiText1:
    "Cepal's high case volume makes it particularly exposed to procedural defects. Grounds that typically support objections and suspensions in Cepal cases:",
  anakopiPoints: [
    "Weak authority chain: securitisation and management assignment involve multiple transfer steps that must each be properly documented — gaps here are a significant basis for objection.",
    "Incorrect debt amount: unlawful compound interest, abusive fees, miscalculated default interest.",
    "Unfair contractual terms: clauses that were not individually negotiated and that undermine the legal foundation of the claim.",
    "Formal enforcement defects: irregular service of process, incorrect amounts in the seizure report, failure to observe mandatory intervals.",
  ],
  anakopiText2:
    "Where the case requires it, an objection is accompanied by an immediate suspension application so that the auction is stayed until a court decision is issued. This combination — legal defence and parallel negotiation — is usually the most effective approach.",
  faqTitle: "Frequently Asked Questions about Cepal",
  faq: [
    {
      q: "Cepal is asking me to sign an out-of-court settlement. Should I?",
      a: "Do not sign anything without legal review. An out-of-court agreement may block defences you currently have — objection, debt challenge, suspension. We review it at no charge during the first consultation.",
    },
    {
      q: "Cepal is the biggest servicer in Greece. Can I really fight them?",
      a: "Size does not protect against legal defects — high volume actually increases the likelihood of errors in service of process, debt calculations, and authority chains. That is what we examine first.",
    },
    {
      q: "My loan was with Eurobank. Why is Cepal writing to me?",
      a: "Your loan was likely assigned to the Cairo securitisation programme or another SPV, with Cepal appointed as manager. That assignment must have been properly executed and notified to you — we check this as part of the file review.",
    },
    {
      q: "What happens if I simply do not respond to Cepal?",
      a: "Silence is not a defence. If a payment order has been issued or a seizure has taken place, inaction allows Cepal to proceed without obstacle. The earlier you have the file reviewed, the more options remain open.",
    },
  ],
  ctaTitle: "Cepal works every day. Your defence should start today.",
  ctaText:
    "Office at 12 Leontos Sofou St., Thessaloniki. Files are assessed on an urgent basis — every working day lost may count.",
  ctaButton: "Immediate File Review",
  ctaPhone: "Call now: 2310 545 261",
};

const cepalDe = {
  seoTitle: "Anwalt für Cepal – Zwangsversteigerungen Thessaloniki",
  seoDescription:
    "Zahlungsbefehl oder Vollstreckungsmaßnahme von Cepal erhalten? Jedes Dokument setzt strikte Fristen für die Rechtsverteidigung. Widerspruch, Vollstreckungsaussetzung, Schuldenregulierung in Thessaloniki.",
  heroCity: "Thessaloniki · Leontos Sofou 12",
  heroTitle: "Anwalt für Cepal-Vollstreckungen und Zwangsversteigerungen in Thessaloniki",
  heroSubtitle: "Widerspruch · Aussetzung · Schuldenregulierung",
  intro:
    "Dokumente von Cepal sind keine bloßen Erinnerungen — sie setzen rechtliche Prozesse mit strengen Fristen in Gang. Zahlungsbefehl, Pfändung, Versteigerungsprogramm: jedes Dokument öffnet ein Handlungsfenster, das sich unwiderruflich schließt, sobald die Frist abläuft. Unsere Kanzlei bearbeitet täglich Servicer-Fälle vor den Gerichten in Thessaloniki. Ioannis Papaioannou, Rechtsberater des Vereins der Kreditnehmer und Verbraucherschutz Nordgriechenlands, kennt das Vorgehen von Cepal — und wie man eine wirksame Verteidigung aufbaut.",
  whatTitle: "Was ist Cepal und was bedeutet es für Ihr Darlehen?",
  whatText:
    "Cepal Hellas Financial Services ist der größte Servicer in Griechenland nach verwaltetem Portfolio und betreut hauptsächlich Darlehen der Eurobank (Cairo-Verbriefungsprogramm) sowie anderer griechischer Banken. Zwei wichtige Punkte: Erstens ist Cepal ein Verwalter, nicht der Eigentümer Ihres Darlehens — es muss bei jedem Schritt seine Handlungsbefugnis rechtmäßig nachweisen. Zweitens wurden diese Portfolios zu einem Bruchteil des Nennwerts erworben. Dieser Erwerbspreis ist die Grundlage jeder realistischen Vergleichsverhandlung.",
  protectTitle: "Schutz Ihres Hauptwohnsitzes vor der Cepal-Zwangsversteigerung",
  protectText:
    "Aufgrund des großen Portfoliovolumens agiert Cepal schnell — und diese Schnelligkeit schafft Verfahrensschwächen. Wir prüfen jede Akte von Grund auf: ob die Vollmacht ordnungsgemäß nachgewiesen wird, ob der Schuldenbetrag korrekt berechnet wurde und ob jede Zustellung und Vollstreckungshandlung das griechische Recht strikt einhält. Hohes Volumen bedeutet oft hastiges Vorgehen — und hastiges Vorgehen schafft Anfechtungsgrundlagen.",
  deadlinesTitle: "Zahlungsbefehl oder Bescheid von Cepal erhalten? Kritische Fristen",
  deadlinesIntro:
    "Das griechische Verfahrensrecht gewährt keine Fristverlängerungen für Einwände gegen Servicer. Sobald eine Frist abläuft, wird der Vollstreckungstitel unanfechtbar.",
  deadlines: [
    {
      title: "Zahlungsbefehl — 15 Werktage",
      desc: "Ein Widerspruch muss innerhalb von 15 Werktagen nach Zustellung eingelegt werden. Danach besitzt Cepal einen vollstreckbaren Titel und kann zur Pfändung schreiten.",
    },
    {
      title: "Pfändung — 45 Tage",
      desc: "Der Widerspruch gegen die Zwangsvollstreckung hat eine Frist von 45 Tagen. In dieser Phase können die Handlungsbefugnis, der Schuldenbetrag und Verfahrensmängel angefochten werden.",
    },
    {
      title: "Vor der Versteigerung — letzte 15 Tage",
      desc: "Auch mit festem Versteigerungstermin ist ein Antrag auf Vollstreckungsaussetzung noch möglich. Je früher, desto besser — doch wir prüfen alle verfügbaren Mittel auch in letzter Minute.",
    },
  ],
  deadlinesWarning:
    "Die Frist hat ab dem Tag der Zustellung durch Cepal zu laufen begonnen. Warten Sie nicht auf einen günstigen Moment — bringen Sie die Akte noch heute zur Prüfung.",
  cta1Title: "Haben Sie ein Dokument von Cepal vor sich?",
  cta1Text:
    "Sofortige Erstprüfung: was zugestellt wurde, welche Frist läuft, welche Optionen Sie haben. Rufen Sie 2310 545 261 an oder senden Sie das Kontaktformular.",
  negotiationTitle: "Verhandlungsstrategie: Schuldenregulierung mit Cepal erreichen",
  negotiationIntro:
    "Cepal verwaltet Portfolios, die mit einem Abschlag erworben wurden — wir setzen das praktisch in der Verhandlung ein. So bauen wir Ihre Position auf:",
  negotiationPoints: [
    "Vollständige Aktenprüfung vor jedem Kontakt: Handlungskette, tatsächlicher Saldo, mögliche Gebühren und Zinsen. Wir verhandeln nicht, ohne genau zu wissen, mit welchem Anspruch wir es zu tun haben.",
    "Erwerbskosten als Ausgangspunkt: das Portfolio wurde zu einem Bruchteil des Nennwerts gekauft — unser Angebot basiert auf wirtschaftlicher Realität, nicht auf der Ziffer im Schreiben.",
    "Regulierung angepasst an reale Rückzahlungsfähigkeit: Ziel ist eine tragfähige Vereinbarung, keine Rate, die nach sechs Monaten scheitert.",
    "Gerichtsverfahren als Verhandlungshebel: ein anhängiger Widerspruch verändert die Dynamik — Cepal erkennt, dass es einem rechtlich vertretenen Gegner gegenübersteht.",
  ],
  negotiationOutro:
    "Das Ziel ist nicht das bestmögliche Ergebnis unter Druck — sondern die Regulierung, die zur konkreten Akte passt, mit konkreten Zahlen und konkreter Strategie.",
  cta2Title: "Bevor Sie irgendetwas mit Cepal unterschreiben — sprechen Sie zuerst mit uns.",
  cta2Text:
    "Ein übereilter Vergleich kann schlimmer sein als gar nichts zu unterschreiben. Erst prüfen, dann entscheiden.",
  anakopiTitle: "Widerspruch und Aussetzung von Cepal-Versteigerungen in Thessaloniki",
  anakopiText1:
    "Das hohe Fallvolumen von Cepal macht es besonders anfällig für Verfahrensmängel. Häufige Grundlagen für Widersprüche und Aussetzungen in Cepal-Fällen:",
  anakopiPoints: [
    "Lückenhafte Vollmachtskette: Verbriefung und Verwaltungsübertragung umfassen mehrere Übertragungsschritte, die jeweils ordnungsgemäß dokumentiert sein müssen — Lücken hier sind ein wichtiger Widerspruchsgrund.",
    "Falscher Schuldbetrag: unzulässige Zinseszinsen, missbräuchliche Gebühren, fehlerhaft berechnete Verzugszinsen.",
    "Missbräuchliche Vertragsklauseln: nicht individuell ausgehandelte Klauseln, die die rechtliche Grundlage der Forderung untergraben.",
    "Formelle Vollstreckungsmängel: fehlerhafte Zustellungen, falsche Beträge im Pfändungsprotokoll, Nichtbeachtung gesetzlicher Fristen.",
  ],
  anakopiText2:
    "Wenn der Fall es erfordert, wird der Widerspruch von einem sofortigen Aussetzungsantrag begleitet, damit die Versteigerung bis zur gerichtlichen Entscheidung ausgesetzt bleibt. Diese Kombination — rechtliche Verteidigung und parallele Verhandlung — ist in der Regel der wirkungsvollste Ansatz.",
  faqTitle: "Häufige Fragen zu Cepal",
  faq: [
    {
      q: "Cepal bittet mich, einen außergerichtlichen Vergleich zu unterzeichnen. Soll ich das tun?",
      a: "Unterschreiben Sie nichts ohne rechtliche Prüfung. Ein außergerichtlicher Vergleich kann Ihnen Verteidigungsmöglichkeiten verschließen — Widerspruch, Schuldenbestreitung, Aussetzung. Wir prüfen ihn kostenlos beim Erstgespräch.",
    },
    {
      q: "Cepal ist der größte Servicer. Kann ich wirklich gegen sie vorgehen?",
      a: "Größe schützt nicht vor Rechtsfehlern — hohes Volumen erhöht tatsächlich die Wahrscheinlichkeit von Fehlern bei Zustellungen, Schuldberechnungen und Vollmachtsketten. Das prüfen wir als Erstes.",
    },
    {
      q: "Mein Darlehen war bei der Eurobank. Warum schreibt mir jetzt Cepal?",
      a: "Ihr Darlehen wurde wahrscheinlich dem Cairo-Verbriefungsprogramm oder einem anderen SPV zugewiesen, wobei Cepal als Verwalter eingesetzt wurde. Diese Übertragung muss ordnungsgemäß erfolgt und Ihnen mitgeteilt worden sein — wir prüfen dies als Teil der Aktenprüfung.",
    },
    {
      q: "Was passiert, wenn ich auf Cepal gar nicht reagiere?",
      a: "Schweigen ist keine Verteidigung. Wenn ein Zahlungsbefehl ergangen ist oder eine Pfändung stattgefunden hat, erlaubt Untätigkeit Cepal, ohne Hindernisse vorzugehen. Je früher Sie die Akte prüfen lassen, desto mehr Optionen bleiben offen.",
    },
  ],
  ctaTitle: "Cepal arbeitet täglich. Ihre Verteidigung sollte heute beginnen.",
  ctaText:
    "Kanzlei in der Leontos Sofou 12, Thessaloniki. Akten werden dringend geprüft — jeder verlorene Werktag kann entscheidend sein.",
  ctaButton: "Sofortige Aktenprüfung",
  ctaPhone: "Jetzt anrufen: 2310 545 261",
};

const base = "C:/Users/theob/Documents/law-firm-site/messages";

["el", "en", "de"].forEach((lang) => {
  const p = `${base}/${lang}.json`;
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  j.cepal = lang === "el" ? cepalEl : lang === "en" ? cepalEn : cepalDe;
  j.funds.cepalLinkCta =
    lang === "el"
      ? "Αντιμετώπιση Cepal – Πλήρης Οδηγός"
      : lang === "en"
      ? "Cepal – Full Defence Guide"
      : "Cepal – Vollständiger Verteidigungsratgeber";
  fs.writeFileSync(p, JSON.stringify(j, null, 2), "utf8");
  console.log(`${lang}.json updated`);
});
