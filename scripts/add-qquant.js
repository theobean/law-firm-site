const fs = require("fs");

const qquantEl = {
  seoTitle: "Δικηγόρος για QQuant – Πλειστηριασμοί Θεσσαλονίκη",
  seoDescription:
    "Σας ενοχλεί η QQuant για παλιό δάνειο; Πριν πληρώσετε ή υπογράψετε, ελέγξτε νομιμοποίηση, παραγραφή και πραγματικό υπόλοιπο. Ανακοπή, αναστολή, ρύθμιση στη Θεσσαλονίκη. Τηλ: 2310 545 261.",
  heroCity: "Θεσσαλονίκη · Λέοντος Σοφού 12",
  heroTitle: "Δικηγόρος για Απαιτήσεις και Πλειστηριασμούς της QQuant στη Θεσσαλονίκη",
  heroSubtitle: "Ανακοπή · Αναστολή · Διαπραγμάτευση Κουρέματος",
  intro:
    "Η QQuant εμφανίζεται συχνά για δάνεια που εσείς θεωρούσατε «ξεχασμένα» — οφειλές που άλλαξαν δύο και τρία χέρια πριν φτάσουν σε αυτήν. Ακριβώς εκεί κρύβεται και η ευκαιρία σας: όσο πιο μακρύ το ταξίδι μιας απαίτησης, τόσο περισσότερα τα σημεία όπου κάτι δεν έγινε νομότυπα — και τόσο πιο πιθανή η παραγραφή. Ο Ιωάννης Παπαϊωάννου, Νομικός Σύμβουλος του Συλλόγου Δανειοληπτών & Προστασίας Καταναλωτών Βορείου Ελλάδος, με 25+ χρόνια σε τραπεζικές διαφορές, ελέγχει κάθε φάκελο QQuant πριν από οποιαδήποτε απάντηση ή πληρωμή.",
  whatTitle: "Τι είναι η QQuant και τι σημαίνει για το δάνειό σας",
  whatText:
    "Η QQuant Master Servicer ήταν από τις πρώτες αδειοδοτημένες εταιρείες διαχείρισης απαιτήσεων στην Ελλάδα και διαχειρίζεται χαρτοφυλάκια για λογαριασμό περισσότερων funds — καταναλωτικά, στεγαστικά και επιχειρηματικά δάνεια από διάφορες τράπεζες. Αυτή η πολυμορφία έχει νομική σημασία: κάθε χαρτοφυλάκιο έχει διαφορετική αλυσίδα μεταβίβασης, που πρέπει να αποδεικνύεται πλήρως για κάθε δάνειο ξεχωριστά. Επιπλέον, πολλές απαιτήσεις που διαχειρίζεται η QQuant είναι παλαιές — καταγγελμένες πριν από χρόνια. Εκεί τίθεται ευθέως ζήτημα παραγραφής, που μπορεί να αλλάξει ριζικά την εικόνα της οφειλής.",
  protectTitle: "Προστασία Πρώτης Κατοικίας από Πλειστηριασμό της QQuant",
  protectText:
    "Καμία επιστολή της QQuant δεν σημαίνει από μόνη της απώλεια περιουσίας — ο πλειστηριασμός προϋποθέτει εκτελεστό τίτλο και νομότυπη διαδικασία σε κάθε βήμα. Σε κάθε φάκελο ελέγχουμε: αν η QQuant αποδεικνύει την εξουσία διαχείρισης για το συγκεκριμένο δάνειο, αν η απαίτηση έχει εν όλω ή εν μέρει παραγραφεί, αν το ποσό περιλαμβάνει παράνομους τόκους και χρεώσεις, και αν κάθε επίδοση έγινε όπως ορίζει ο νόμος. Σε παλιές οφειλές, αυτός ο έλεγχος συχνά ανατρέπει εντελώς τα δεδομένα.",
  deadlinesTitle:
    "Έλαβα Εξώδικο ή Διαταγή Πληρωμής από την QQuant: Οι κρίσιμες προθεσμίες",
  deadlinesIntro:
    "Ακόμη και σε παλιά, αμφισβητούμενη ή πιθανώς παραγεγραμμένη οφειλή, οι δικονομικές προθεσμίες τρέχουν κανονικά. Αν δεν ασκηθεί ανακοπή εμπρόθεσμα, η αμυντική σας θέση χάνεται — όσο βάσιμη κι αν ήταν.",
  deadlines: [
    {
      title: "Διαταγή Πληρωμής — 15 εργάσιμες ημέρες",
      desc: "Η ανακοπή κατά διαταγής πληρωμής ασκείται μέσα σε 15 εργάσιμες ημέρες από την επίδοση. Είναι η στιγμή να προβληθούν παραγραφή, ελλείψεις νομιμοποίησης και εσφαλμένο ποσό.",
    },
    {
      title: "Κατάσχεση — 45 ημέρες",
      desc: "Η ανακοπή κατά της αναγκαστικής εκτέλεσης έχει προθεσμία 45 ημερών από την κατάσχεση. Προσβάλλονται η νομιμοποίηση της QQuant, το ύψος της απαίτησης και οι πλημμέλειες της διαδικασίας.",
    },
    {
      title: "Πριν τον Πλειστηριασμό — οι τελευταίες 15 ημέρες",
      desc: "Ακόμη και με ορισμένη ημερομηνία πλειστηριασμού, υπάρχει στενό περιθώριο για αίτηση αναστολής. Όσο νωρίτερα κινηθείτε, τόσο ισχυρότερη η θέση σας — αλλά εξετάζουμε κάθε μέσο μέχρι τέλους.",
    },
  ],
  deadlinesWarning:
    "Το ότι η οφειλή είναι παλιά δεν σημαίνει ότι έχετε χρόνο — σημαίνει ότι ίσως έχετε επιχειρήματα. Τα επιχειρήματα όμως ασκούνται μόνο εμπρόθεσμα. Φέρτε το έγγραφο για έλεγχο σήμερα.",
  cta1Title: "Έχετε έγγραφο της QQuant μπροστά σας;",
  cta1Text:
    "Πρώτη αξιολόγηση άμεσα: τι σας επιδόθηκε, αν τίθεται ζήτημα παραγραφής, ποια προθεσμία τρέχει. Καλέστε στο 2310 545 261 ή στείλτε τη φόρμα.",
  negotiationTitle:
    "Στρατηγικές Διαπραγμάτευσης: Πώς πετυχαίνουμε κούρεμα οφειλής με την QQuant",
  negotiationIntro:
    "Στα παλαιά χαρτοφυλάκια που διαχειρίζεται η QQuant, η απόσταση μεταξύ λογιστικού υπολοίπου και πραγματικής αξίας της απαίτησης είναι συνήθως η μεγαλύτερη της αγοράς. Αυτό είναι το διαπραγματευτικό σας πλεονέκτημα — αρκεί να το τεκμηριώσετε:",
  negotiationPoints: [
    "Έλεγχος παραγραφής πριν από κάθε συζήτηση: μια εν όλω ή εν μέρει παραγεγραμμένη απαίτηση αλλάζει εντελώς τη βάση της διαπραγμάτευσης — ή την καθιστά περιττή.",
    "Επαλήθευση νομιμοποίησης για το συγκεκριμένο δάνειο: στις πολλαπλές μεταβιβάσεις των χαρτοφυλακίων αυτών, η αλυσίδα συχνά έχει κενά που αποδυναμώνουν τη θέση του servicer.",
    "Καθαρισμός του ποσού από παράνομους τόκους και χρεώσεις: σε οφειλές που «τρέχουν» επί χρόνια, οι λανθασμένοι ανατοκισμοί διογκώνουν το υπόλοιπο σημαντικά.",
    "Πρόταση δομημένη στην οικονομική πραγματικότητα: το χαμηλό κόστος κτήσης των παλαιών χαρτοφυλακίων δίνει στην QQuant ευρύ περιθώριο για κούρεμα — εφόσον η πρόταση παρουσιαστεί σωστά.",
  ],
  negotiationOutro:
    "Σε υποθέσεις QQuant, η σωστή σειρά είναι αδιαπραγμάτευτη: πρώτα νομικός έλεγχος, μετά διαπραγμάτευση. Η αντίστροφη σειρά χαρίζει χρήματα που ίσως δεν οφείλονται.",
  cta2Title: "Πριν πληρώσετε ή αναγνωρίσετε οτιδήποτε στην QQuant — μιλήστε μας.",
  cta2Text:
    "Σε παλιές οφειλές, μια απλή καταβολή ή έγγραφη αναγνώριση μπορεί να διακόψει την παραγραφή και να αναστήσει απαίτηση που έσβηνε. Πρώτα έλεγχος, μετά οποιαδήποτε κίνηση.",
  anakopiTitle:
    "Ανακοπή και Αναστολή Πλειστηριασμού κατά QQuant στη Θεσσαλονίκη",
  anakopiText1:
    "Στα δικαστήρια της Θεσσαλονίκης, όπου δικάζουμε καθημερινά, οι υποθέσεις κατά της QQuant κρίνονται στις λεπτομέρειες του φακέλου. Οι λόγοι ανακοπής που συχνότερα ευδοκιμούν:",
  anakopiPoints: [
    "Παραγραφή της απαίτησης ή μέρους της: σε δάνεια καταγγελμένα προ ετών, ο χρόνος συχνά έχει κάνει τη δουλειά του — αρκεί να προβληθεί νομότυπα.",
    "Ελλείψεις νομιμοποίησης: η πολλαπλή μεταβίβαση των χαρτοφυλακίων που κατέληξαν στην QQuant πρέπει να αποδεικνύεται πλήρως — κρίκος που λείπει σημαίνει βάσιμος λόγος ανακοπής.",
    "Εσφαλμένο ύψος οφειλής: παράνομοι ανατοκισμοί, καταχρηστικές χρεώσεις και τόκοι που δεν αντέχουν σε δικαστικό έλεγχο.",
    "Διαδικαστικές πλημμέλειες: ελαττωματικές επιδόσεις, σφάλματα στην κατασχετήρια έκθεση, μη τήρηση των νόμιμων προθεσμιών και διατυπώσεων.",
  ],
  anakopiText2:
    "Όπου το επιβάλλει η υπόθεση, η ανακοπή συνδυάζεται με αίτηση αναστολής, ώστε καμία πράξη εκτέλεσης να μην προχωρήσει πριν κριθεί η ουσία. Παράλληλα, η εκκρεμής δίκη λειτουργεί ως μοχλός για ρεαλιστική ρύθμιση.",
  faqTitle: "Συχνές Ερωτήσεις για την QQuant",
  faq: [
    {
      q: "Η QQuant με ενοχλεί για δάνειο πριν από πολλά χρόνια. Οφείλω ακόμη;",
      a: "Όχι απαραίτητα — και όχι απαραίτητα ολόκληρο το ποσό. Ανάλογα με το είδος της οφειλής και τον χρόνο καταγγελίας, η απαίτηση ή μέρος της μπορεί να έχει παραγραφεί. Αυτό όμως κρίνεται μόνο με έλεγχο του φακέλου — μην το υποθέσετε και μην πληρώσετε πριν ελεγχθεί.",
    },
    {
      q: "Αν πληρώσω ένα μικρό ποσό «για να ησυχάσω», βλάπτομαι;",
      a: "Ενδεχομένως σοβαρά. Η καταβολή ή η έγγραφη αναγνώριση της οφειλής μπορεί να διακόψει την παραγραφή και να δώσει νέα ζωή σε απαίτηση που έσβηνε. Καμία πληρωμή και καμία υπογραφή πριν από νομικό έλεγχο.",
    },
    {
      q: "Πώς ξέρω ότι η QQuant δικαιούται να ζητά αυτό το δάνειο;",
      a: "Δεν το ξέρετε — και δεν χρειάζεται να το δεχθείτε ως δεδομένο. Η QQuant ενεργεί ως διαχειρίστρια για λογαριασμό funds και οφείλει να αποδεικνύει νομότυπα ολόκληρη την αλυσίδα μεταβίβασης και ανάθεσης για το δικό σας δάνειο. Αυτό ελέγχεται έγγραφο προς έγγραφο.",
    },
    {
      q: "Έλαβα διαταγή πληρωμής από την QQuant. Τι κάνω τώρα;",
      a: "Σημειώστε αμέσως την ημερομηνία επίδοσης: από εκεί μετρούν 15 εργάσιμες ημέρες για ανακοπή. Μέσα σε αυτό το διάστημα πρέπει να ελεγχθούν παραγραφή, νομιμοποίηση και ποσό. Καλέστε στο 2310 545 261 χωρίς καθυστέρηση.",
    },
    {
      q: "Τι έγγραφα χρειάζεστε για τον έλεγχο;",
      a: "Ό,τι έχετε: επιστολές και εξώδικα της QQuant, παλαιότερα έγγραφα της τράπεζας, τη δανειακή σύμβαση, τυχόν διαταγή πληρωμής ή κατασχετήρια έκθεση — και κυρίως τις ημερομηνίες επίδοσης. Ακόμη και ελλιπής φάκελος αρκεί για να ξεκινήσουμε.",
    },
  ],
  ctaTitle: "Η QQuant ποντάρει στο ότι δεν θα ελέγξετε. Διαψεύστε την.",
  ctaText:
    "Γραφείο Λέοντος Σοφού 12, Θεσσαλονίκη. Ο φάκελός σας — και το ζήτημα της παραγραφής — αξιολογείται κατεπειγόντως, πριν τρέξει άλλη προθεσμία.",
  ctaButton: "Άμεσος Έλεγχος Φακέλου",
  ctaPhone: "Καλέστε τώρα: 2310 545 261",
};

const qquantEn = {
  seoTitle: "Lawyer for QQuant – Debt Claims & Auctions Thessaloniki",
  seoDescription:
    "Is QQuant pursuing you over an old loan? Before paying or signing anything, check authority, limitation periods and the real balance. Objection, suspension, settlement in Thessaloniki. Tel: 2310 545 261.",
  heroCity: "Thessaloniki · 12 Leontos Sofou St.",
  heroTitle: "Lawyer for QQuant Claims and Auctions in Thessaloniki",
  heroSubtitle: "Objection · Suspension · Debt Settlement",
  intro:
    "QQuant often appears over loans you had considered long forgotten — debts that changed hands two or three times before reaching it. That is precisely where your opportunity lies: the longer a claim's journey, the more points where something was not done properly — and the more likely the claim is time-barred. Ioannis Papaioannou, Legal Adviser to the Association of Borrowers and Consumer Protection of Northern Greece, with 25+ years in banking disputes, reviews every QQuant file before any response or payment is made.",
  whatTitle: "What Is QQuant and What Does It Mean for Your Loan?",
  whatText:
    "QQuant Master Servicer was among the first licensed loan servicers in Greece and manages portfolios on behalf of multiple funds — consumer, mortgage and business loans originating from various banks. This diversity matters legally: each portfolio has a different transfer chain, which must be fully proven for each individual loan. Moreover, many of the claims QQuant manages are old — terminated years ago. That directly raises the question of limitation (prescription), which can radically change the picture of the debt.",
  protectTitle: "Protecting Your Primary Residence from a QQuant Auction",
  protectText:
    "No letter from QQuant means losing property by itself — an auction requires an enforceable title and a lawful procedure at every step. In every file we check: whether QQuant proves its management authority for your specific loan, whether the claim is wholly or partly time-barred, whether the amount includes unlawful interest and charges, and whether every service of process was carried out as the law requires. With old debts, this review often overturns the picture entirely.",
  deadlinesTitle: "Received a Payment Order or Notice from QQuant? Critical Deadlines",
  deadlinesIntro:
    "Even for an old, disputed or possibly time-barred debt, procedural deadlines run normally. If an objection is not filed in time, your defensive position is lost — however well-founded it was.",
  deadlines: [
    {
      title: "Payment Order — 15 working days",
      desc: "An objection against a payment order must be filed within 15 working days of service. This is the moment to raise limitation, authority defects and an incorrect amount.",
    },
    {
      title: "Seizure — 45 days",
      desc: "The objection against enforcement must be filed within 45 days of seizure. QQuant's authority, the amount of the claim and procedural defects can all be challenged.",
    },
    {
      title: "Before Auction — last 15 days",
      desc: "Even with an auction date set, a narrow window remains for a suspension application. The earlier you act, the stronger your position — but we examine every option to the end.",
    },
  ],
  deadlinesWarning:
    "The debt being old does not mean you have time — it means you may have arguments. But arguments only count if raised within the deadline. Bring the document for review today.",
  cta1Title: "Do you have a QQuant document in front of you?",
  cta1Text:
    "Immediate first assessment: what was served, whether limitation is in play, which deadline is running. Call 2310 545 261 or send the contact form.",
  negotiationTitle: "Negotiation Strategy: Achieving a Debt Haircut with QQuant",
  negotiationIntro:
    "In the older portfolios QQuant manages, the gap between book balance and the claim's real value is usually the widest in the market. That is your negotiating advantage — provided it is properly documented:",
  negotiationPoints: [
    "Limitation check before any discussion: a wholly or partly time-barred claim completely changes the basis of negotiation — or makes it unnecessary.",
    "Verification of authority for your specific loan: in these multi-transfer portfolios, the chain often has gaps that weaken the servicer's position.",
    "Stripping unlawful interest and charges from the amount: in debts running for years, incorrect compounding inflates the balance significantly.",
    "A proposal built on economic reality: the low acquisition cost of old portfolios gives QQuant wide room for a haircut — if the proposal is presented correctly.",
  ],
  negotiationOutro:
    "In QQuant cases the correct order is non-negotiable: legal review first, negotiation second. The reverse order gives away money that may not even be owed.",
  cta2Title: "Before paying or acknowledging anything to QQuant — talk to us.",
  cta2Text:
    "With old debts, a simple payment or written acknowledgment can interrupt the limitation period and revive a claim that was expiring. Review first, then any move.",
  anakopiTitle: "Objection and Suspension of QQuant Enforcement in Thessaloniki",
  anakopiText1:
    "At the Thessaloniki courts, where we litigate daily, QQuant cases are decided on the details of the file. The grounds of objection that most often succeed:",
  anakopiPoints: [
    "Limitation of the claim or part of it: in loans terminated years ago, time has often done its work — it just needs to be raised properly.",
    "Authority defects: the multiple transfers of portfolios that ended up with QQuant must be fully proven — a missing link means a well-founded ground of objection.",
    "Incorrect debt amount: unlawful compounding, abusive charges and interest that does not withstand judicial scrutiny.",
    "Procedural defects: irregular service, errors in the seizure report, failure to observe statutory deadlines and formalities.",
  ],
  anakopiText2:
    "Where the case requires it, the objection is combined with a suspension application so that no enforcement act proceeds before the merits are decided. In parallel, the pending case serves as leverage for a realistic settlement.",
  faqTitle: "Frequently Asked Questions about QQuant",
  faq: [
    {
      q: "QQuant is pursuing me over a loan from many years ago. Do I still owe it?",
      a: "Not necessarily — and not necessarily the full amount. Depending on the type of debt and when it was terminated, the claim or part of it may be time-barred. This is determined only by reviewing the file — do not assume it, and do not pay before it is checked.",
    },
    {
      q: "If I pay a small amount just to be left alone, can that hurt me?",
      a: "Potentially seriously. A payment or written acknowledgment of the debt can interrupt the limitation period and revive a claim that was expiring. No payment and no signature before a legal review.",
    },
    {
      q: "How do I know QQuant is actually entitled to claim this loan?",
      a: "You don't — and you don't have to take it for granted. QQuant acts as manager on behalf of funds and must lawfully prove the entire chain of transfer and assignment for your loan. We check this document by document.",
    },
    {
      q: "I received a payment order from QQuant. What do I do now?",
      a: "Note the date of service immediately: 15 working days for an objection run from that date. Within that window, limitation, authority and the amount must all be checked. Call 2310 545 261 without delay.",
    },
  ],
  ctaTitle: "QQuant is betting you won't check. Prove them wrong.",
  ctaText:
    "Office at 12 Leontos Sofou St., Thessaloniki. Your file — including the limitation question — is assessed urgently, before another deadline runs.",
  ctaButton: "Immediate File Review",
  ctaPhone: "Call now: 2310 545 261",
};

const qquantDe = {
  seoTitle: "Anwalt für QQuant – Forderungen & Zwangsversteigerungen Thessaloniki",
  seoDescription:
    "QQuant verfolgt Sie wegen eines alten Darlehens? Bevor Sie zahlen oder unterschreiben: Vollmacht, Verjährung und tatsächlichen Saldo prüfen lassen. Widerspruch, Aussetzung, Regulierung in Thessaloniki.",
  heroCity: "Thessaloniki · Leontos Sofou 12",
  heroTitle: "Anwalt für QQuant-Forderungen und Zwangsversteigerungen in Thessaloniki",
  heroSubtitle: "Widerspruch · Aussetzung · Schuldenregulierung",
  intro:
    "QQuant meldet sich oft wegen Darlehen, die Sie längst für vergessen hielten — Forderungen, die zwei- oder dreimal den Besitzer wechselten, bevor sie dort landeten. Genau darin liegt Ihre Chance: Je länger der Weg einer Forderung, desto mehr Stellen, an denen etwas nicht ordnungsgemäß ablief — und desto wahrscheinlicher die Verjährung. Ioannis Papaioannou, Rechtsberater des Vereins der Kreditnehmer und Verbraucherschutz Nordgriechenlands, mit über 25 Jahren Erfahrung in Bankstreitigkeiten, prüft jede QQuant-Akte, bevor irgendeine Antwort oder Zahlung erfolgt.",
  whatTitle: "Was ist QQuant und was bedeutet es für Ihr Darlehen?",
  whatText:
    "QQuant Master Servicer war einer der ersten lizenzierten Forderungsverwalter in Griechenland und verwaltet Portfolios im Auftrag mehrerer Funds — Verbraucher-, Hypotheken- und Unternehmensdarlehen verschiedener Banken. Diese Vielfalt ist rechtlich relevant: Jedes Portfolio hat eine andere Übertragungskette, die für jedes einzelne Darlehen vollständig nachgewiesen werden muss. Zudem sind viele der von QQuant verwalteten Forderungen alt — vor Jahren gekündigt. Damit stellt sich unmittelbar die Frage der Verjährung, die das Bild der Schuld grundlegend verändern kann.",
  protectTitle: "Schutz Ihres Hauptwohnsitzes vor einer QQuant-Zwangsversteigerung",
  protectText:
    "Kein Schreiben von QQuant bedeutet für sich genommen den Verlust von Eigentum — eine Versteigerung setzt einen vollstreckbaren Titel und ein in jedem Schritt rechtmäßiges Verfahren voraus. In jeder Akte prüfen wir: ob QQuant seine Verwaltungsbefugnis für Ihr konkretes Darlehen nachweist, ob die Forderung ganz oder teilweise verjährt ist, ob der Betrag unzulässige Zinsen und Gebühren enthält und ob jede Zustellung gesetzeskonform erfolgte. Bei alten Schulden kippt diese Prüfung das Bild oft vollständig.",
  deadlinesTitle: "Zahlungsbefehl oder Bescheid von QQuant erhalten? Kritische Fristen",
  deadlinesIntro:
    "Auch bei einer alten, bestrittenen oder möglicherweise verjährten Schuld laufen die Verfahrensfristen normal weiter. Wird der Widerspruch nicht fristgerecht eingelegt, ist Ihre Verteidigungsposition verloren — so begründet sie auch war.",
  deadlines: [
    {
      title: "Zahlungsbefehl — 15 Werktage",
      desc: "Der Widerspruch gegen einen Zahlungsbefehl muss innerhalb von 15 Werktagen nach Zustellung eingelegt werden. Jetzt sind Verjährung, Vollmachtsmängel und ein falscher Betrag geltend zu machen.",
    },
    {
      title: "Pfändung — 45 Tage",
      desc: "Der Widerspruch gegen die Zwangsvollstreckung hat eine Frist von 45 Tagen ab Pfändung. Angefochten werden können die Befugnis von QQuant, die Forderungshöhe und Verfahrensmängel.",
    },
    {
      title: "Vor der Versteigerung — letzte 15 Tage",
      desc: "Auch mit festem Versteigerungstermin bleibt ein enges Fenster für einen Aussetzungsantrag. Je früher Sie handeln, desto stärker Ihre Position — wir prüfen jedoch jede Option bis zuletzt.",
    },
  ],
  deadlinesWarning:
    "Dass die Schuld alt ist, heißt nicht, dass Sie Zeit haben — es heißt, dass Sie möglicherweise Argumente haben. Argumente zählen aber nur, wenn sie fristgerecht vorgebracht werden. Bringen Sie das Dokument noch heute zur Prüfung.",
  cta1Title: "Haben Sie ein Dokument von QQuant vor sich?",
  cta1Text:
    "Sofortige Erstbewertung: was zugestellt wurde, ob Verjährung im Raum steht, welche Frist läuft. Rufen Sie 2310 545 261 an oder senden Sie das Kontaktformular.",
  negotiationTitle: "Verhandlungsstrategie: Schuldenschnitt mit QQuant erreichen",
  negotiationIntro:
    "Bei den älteren Portfolios, die QQuant verwaltet, ist die Lücke zwischen Buchsaldo und realem Wert der Forderung meist die größte am Markt. Das ist Ihr Verhandlungsvorteil — sofern er sauber dokumentiert wird:",
  negotiationPoints: [
    "Verjährungsprüfung vor jedem Gespräch: eine ganz oder teilweise verjährte Forderung verändert die Verhandlungsgrundlage vollständig — oder macht die Verhandlung überflüssig.",
    "Nachweis der Befugnis für Ihr konkretes Darlehen: bei diesen mehrfach übertragenen Portfolios weist die Kette oft Lücken auf, die die Position des Servicers schwächen.",
    "Bereinigung des Betrags um unzulässige Zinsen und Gebühren: bei jahrelang laufenden Schulden blähen fehlerhafte Zinseszinsen den Saldo erheblich auf.",
    "Ein Angebot auf Basis der wirtschaftlichen Realität: die niedrigen Erwerbskosten alter Portfolios geben QQuant großen Spielraum für einen Schuldenschnitt — wenn das Angebot richtig präsentiert wird.",
  ],
  negotiationOutro:
    "In QQuant-Fällen ist die richtige Reihenfolge nicht verhandelbar: erst rechtliche Prüfung, dann Verhandlung. Die umgekehrte Reihenfolge verschenkt Geld, das womöglich gar nicht geschuldet wird.",
  cta2Title: "Bevor Sie QQuant etwas zahlen oder anerkennen — sprechen Sie mit uns.",
  cta2Text:
    "Bei alten Schulden kann eine einfache Zahlung oder schriftliche Anerkennung die Verjährung unterbrechen und eine erlöschende Forderung wiederbeleben. Erst prüfen, dann handeln.",
  anakopiTitle: "Widerspruch und Aussetzung von QQuant-Vollstreckungen in Thessaloniki",
  anakopiText1:
    "Vor den Gerichten in Thessaloniki, wo wir täglich prozessieren, werden QQuant-Fälle an den Details der Akte entschieden. Die Widerspruchsgründe, die am häufigsten Erfolg haben:",
  anakopiPoints: [
    "Verjährung der Forderung oder eines Teils davon: bei vor Jahren gekündigten Darlehen hat die Zeit oft ihre Arbeit getan — sie muss nur ordnungsgemäß geltend gemacht werden.",
    "Vollmachtsmängel: die mehrfachen Übertragungen der bei QQuant gelandeten Portfolios müssen lückenlos nachgewiesen werden — ein fehlendes Glied bedeutet einen begründeten Widerspruchsgrund.",
    "Falscher Schuldbetrag: unzulässige Zinseszinsen, missbräuchliche Gebühren und Zinsen, die einer gerichtlichen Prüfung nicht standhalten.",
    "Verfahrensmängel: fehlerhafte Zustellungen, Fehler im Pfändungsprotokoll, Nichtbeachtung gesetzlicher Fristen und Formvorschriften.",
  ],
  anakopiText2:
    "Wenn der Fall es erfordert, wird der Widerspruch mit einem Aussetzungsantrag verbunden, damit keine Vollstreckungshandlung vor der Entscheidung in der Sache voranschreitet. Parallel dient das anhängige Verfahren als Hebel für eine realistische Regulierung.",
  faqTitle: "Häufige Fragen zu QQuant",
  faq: [
    {
      q: "QQuant verfolgt mich wegen eines Darlehens von vor vielen Jahren. Schulde ich es noch?",
      a: "Nicht unbedingt — und nicht unbedingt den vollen Betrag. Je nach Art der Schuld und Zeitpunkt der Kündigung kann die Forderung ganz oder teilweise verjährt sein. Das lässt sich nur durch Aktenprüfung feststellen — nehmen Sie es nicht an und zahlen Sie nicht, bevor es geprüft ist.",
    },
    {
      q: "Kann es mir schaden, einen kleinen Betrag zu zahlen, um Ruhe zu haben?",
      a: "Möglicherweise erheblich. Eine Zahlung oder schriftliche Anerkennung der Schuld kann die Verjährung unterbrechen und eine erlöschende Forderung wiederbeleben. Keine Zahlung und keine Unterschrift vor einer rechtlichen Prüfung.",
    },
    {
      q: "Woher weiß ich, dass QQuant dieses Darlehen überhaupt geltend machen darf?",
      a: "Sie wissen es nicht — und Sie müssen es nicht als gegeben hinnehmen. QQuant handelt als Verwalter im Auftrag von Funds und muss die gesamte Übertragungs- und Beauftragungskette für Ihr Darlehen rechtmäßig nachweisen. Wir prüfen das Dokument für Dokument.",
    },
    {
      q: "Ich habe einen Zahlungsbefehl von QQuant erhalten. Was tue ich jetzt?",
      a: "Notieren Sie sofort das Zustellungsdatum: ab diesem Tag laufen 15 Werktage für den Widerspruch. In diesem Fenster müssen Verjährung, Befugnis und Betrag geprüft werden. Rufen Sie unverzüglich 2310 545 261 an.",
    },
  ],
  ctaTitle: "QQuant setzt darauf, dass Sie nicht prüfen. Beweisen Sie das Gegenteil.",
  ctaText:
    "Kanzlei in der Leontos Sofou 12, Thessaloniki. Ihre Akte — einschließlich der Verjährungsfrage — wird dringend bewertet, bevor eine weitere Frist abläuft.",
  ctaButton: "Sofortige Aktenprüfung",
  ctaPhone: "Jetzt anrufen: 2310 545 261",
};

const base = "C:/Users/theob/Documents/law-firm-site/messages";

["el", "en", "de"].forEach((lang) => {
  const p = `${base}/${lang}.json`;
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  j.qquant = lang === "el" ? qquantEl : lang === "en" ? qquantEn : qquantDe;
  j.funds.qquantLinkCta =
    lang === "el"
      ? "Αντιμετώπιση QQuant – Πλήρης Οδηγός"
      : lang === "en"
      ? "QQuant – Full Defence Guide"
      : "QQuant – Vollständiger Verteidigungsratgeber";
  fs.writeFileSync(p, JSON.stringify(j, null, 2), "utf8");
  console.log(`${lang}.json updated`);
});
