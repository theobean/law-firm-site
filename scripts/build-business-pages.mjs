// node scripts/build-business-pages.mjs
// Builds business-focused namespaces ({slug}Biz) for all 4 banks + 4 servicers,
// reusing common procedural keys from the individual namespace and overriding
// only the business-specific copy. Writes to el/en/de.
import { readFileSync, writeFileSync } from "fs";
const read = (f) => JSON.parse(readFileSync(`messages/${f}.json`, "utf-8"));
const write = (f, j) => writeFileSync(`messages/${f}.json`, JSON.stringify(j, null, 2) + "\n", "utf-8");

// entity: bizSlug -> { base namespace, display name per locale, kind }
const ENTITIES = [
  { biz: "eurobankBiz", base: "eurobank", el: "Eurobank", en: "Eurobank", de: "Eurobank", kind: "bank" },
  { biz: "alphaBiz", base: "alpha", el: "Alpha Bank", en: "Alpha Bank", de: "Alpha Bank", kind: "bank" },
  { biz: "piraeusBiz", base: "piraeus", el: "Τράπεζα Πειραιώς", en: "Piraeus Bank", de: "Piraeus Bank", kind: "bank" },
  { biz: "ethnikiBiz", base: "ethniki", el: "Εθνική Τράπεζα", en: "National Bank of Greece", de: "National Bank of Greece", kind: "bank" },
  { biz: "intrumBiz", base: "intrum", el: "Intrum", en: "Intrum", de: "Intrum", kind: "servicer" },
  { biz: "dovalueBiz", base: "dovalue", el: "doValue", en: "doValue", de: "doValue", kind: "servicer" },
  { biz: "cepalBiz", base: "cepal", el: "Cepal", en: "Cepal", de: "Cepal", kind: "servicer" },
  { biz: "qquantBiz", base: "qquant", el: "QQuant", en: "QQuant", de: "QQuant", kind: "servicer" },
];

// Keys kept identical from the individual namespace (common procedural content)
const KEEP = ["heroCity", "deadlinesTitle", "deadlinesIntro", "deadlines", "deadlinesWarning",
  "negotiationPoints", "anakopiTitle", "anakopiText1", "anakopiPoints", "anakopiText2", "ctaButton", "ctaPhone"];

function overridesEl(e) {
  const N = e.el;
  const who = e.kind === "bank" ? `την ${N}` : `την εταιρεία διαχείρισης ${N}`;
  return {
    seoTitle: `Δικηγόρος για Επαγγελματικά Δάνεια ${N} – Επιχειρήσεις Θεσσαλονίκη`,
    seoDescription: `Επιχείρηση ή επαγγελματίας με εταιρικό δάνειο ή προσωπική εγγύηση σε ${N}; Έλεγχος εγγύησης, επαγγελματικής περιουσίας, ανακοπή, αναστολή και εξωδικαστικός επιχειρήσεων. Τηλ: 2310 545 261.`,
    heroTitle: `Δικηγόρος για Επαγγελματικά και Εταιρικά Δάνεια ${N} — Επιχειρήσεις και Επαγγελματίες`,
    heroSubtitle: "Εταιρικά δάνεια · Προσωπικές εγγυήσεις · Εξωδικαστικός επιχειρήσεων",
    intro: `Η σελίδα αυτή απευθύνεται σε επιχειρήσεις, εταιρείες και ελεύθερους επαγγελματίες με οφειλές προς ${who}. Επαγγελματικά και εταιρικά δάνεια, κεφάλαιο κίνησης, αλληλόχρεοι λογαριασμοί, ομολογιακά και κυρίως οι προσωπικές εγγυήσεις διαχειριστών και εταίρων οδηγούν σε διαταγές πληρωμής, κατασχέσεις και πλειστηριασμούς — συχνά με μεγαλύτερα ποσά και άμεσες συνέπειες για τη βιωσιμότητα. Ο Ιωάννης Παπαϊωάννου υπερασπίζεται επί 25+ χρόνια επιχειρήσεις και επαγγελματίες απέναντι σε τράπεζες, funds και εταιρείες διαχείρισης απαιτήσεων.`,
    whatTitle: `Εταιρικά δάνεια και εγγυήσεις: τι ελέγχουμε πρώτα`,
    whatText: `Σε μια επιχειρηματική οφειλή προς ${who}, ο φάκελος είναι σχεδόν πάντα πιο σύνθετος από μια στεγαστική υπόθεση. Ελέγχουμε τη δανειακή ή πιστωτική σύμβαση, τις εξασφαλίσεις (προσημειώσεις, ενέχυρα, εκχωρήσεις), το ύψος της απαίτησης και τη νομιμοποίηση εκείνου που διεκδικεί σήμερα — αν δηλαδή η απαίτηση παρέμεινε στην τράπεζα ή μεταβιβάστηκε σε fund με διαχειρίστρια εταιρεία. Ιδιαίτερη βαρύτητα έχει η προσωπική εγγύηση: όταν ο επιχειρηματίας, ο διαχειριστής ή ο εταίρος έχει εγγυηθεί, ελέγχεται χωριστά η έκταση και τα όρια της ευθύνης του. Η εγγύηση δεν είναι πάντα απεριόριστη, ούτε πάντα έγκυρη.`,
    protectTitle: "Προστασία επαγγελματικής περιουσίας και εξοπλισμού",
    protectText: "Στις επιχειρηματικές υποθέσεις δεν κινδυνεύει μόνο η κατοικία, αλλά και η επαγγελματική στέγη, τα μηχανήματα, τα εμπορεύματα, οι επαγγελματικοί λογαριασμοί και η ίδια η συνέχιση της δραστηριότητας. Κάθε πράξη εκτέλεσης — κατάσχεση εις χείρας τρίτων, δέσμευση λογαριασμών, πλειστηριασμός παγίων — αντιμετωπίζεται με ανακοπή και, όπου χρειάζεται, αίτηση αναστολής. Ελέγχουμε από την αρχή τη νομιμοποίηση, τη μεταβίβαση της απαίτησης, το ύψος της οφειλής, τους τόκους, τις χρεώσεις και κάθε πράξη της αναγκαστικής εκτέλεσης, με στόχο να κρατηθεί όρθια η επιχείρηση όσο κρίνεται η ουσία.",
    negotiationTitle: `Διαπραγμάτευση και ρύθμιση εταιρικών οφειλών — με στόχο τη βιωσιμότητα`,
    negotiationIntro: `Σε μια επιχειρηματική οφειλή, η ρύθμιση δεν είναι απλώς θέμα δόσης. Είναι θέμα βιωσιμότητας. Πριν από κάθε επικοινωνία με ${who} ελέγχουμε τη νομιμοποίηση, το πραγματικό υπόλοιπο, τις εγγυήσεις και τα δεδομένα της επιχείρησης, ώστε η πρόταση να στηρίζεται σε αριθμούς που αντέχουν. Στόχος είναι μια ρύθμιση που εξυπηρετείται από τις πραγματικές ταμειακές ροές, με διαγραφή οφειλής (κούρεμα) όπου τεκμηριώνεται και με ελεγχόμενη έκταση των προσωπικών εγγυήσεων.`,
    negotiationOutro: "Για επιχειρήσεις, η καλύτερη συμφωνία είναι αυτή που επιτρέπει στην επιχείρηση να συνεχίσει. Ρύθμιση που εξυπηρετείται, εγγυήσεις που οριοθετούνται, δικαστική πίεση όπου χρειάζεται.",
    cta1Title: `Έχει η επιχείρησή σας έγγραφο από ${who};`,
    cta1Text: "Άμεση πρώτη αξιολόγηση του φακέλου: εταιρικό δάνειο, εγγυήσεις, εξασφαλίσεις, προθεσμίες. Καλέστε στο 2310 545 261 ή στείλτε τη φόρμα.",
    cta2Title: `Πριν υπογράψετε ρύθμιση ή αναγνωρίσετε εταιρική οφειλή — μιλήστε μας.`,
    cta2Text: "Σε επιχειρηματικές οφειλές, μια βιαστική υπογραφή μπορεί να ενεργοποιήσει προσωπικές εγγυήσεις ή να αναγνωρίσει ποσό που θα μπορούσε να αμφισβητηθεί. Πρώτα έλεγχος, μετά απάντηση.",
    faqTitle: `Συχνές Ερωτήσεις — Επιχειρήσεις και ${N}`,
    faq: [
      { q: `Έχω εγγυηθεί προσωπικά εταιρικό δάνειο προς ${who}. Κινδυνεύει η προσωπική μου περιουσία;`, a: "Η προσωπική εγγύηση ενεργοποιεί ευθύνη, αλλά η έκταση και η εγκυρότητά της ελέγχονται. Εξετάζονται τα όρια του ποσού, οι όροι της εγγύησης, τυχόν καταχρηστικές ρήτρες και αν τηρήθηκαν οι νόμιμες προϋποθέσεις. Δεν είναι κάθε εγγύηση απεριόριστη ή άθικτη." },
      { q: "Μπορεί να κατασχεθεί ο επαγγελματικός μου λογαριασμός ή ο εξοπλισμός;", a: "Με εκτελεστό τίτλο και νομότυπη διαδικασία, ναι — αλλά κάθε πράξη εκτέλεσης (κατάσχεση εις χείρας τρίτων, δέσμευση λογαριασμών, πλειστηριασμός παγίων) έχει σημεία προσβολής με συγκεκριμένες προθεσμίες. Η άμεση ανακοπή και αίτηση αναστολής μπορεί να κρατήσει όρθια την επιχείρηση." },
      { q: "Η επιχείρησή μου έχει οφειλές σε τράπεζες, ΕΦΚΑ και εφορία μαζί. Τι γίνεται;", a: "Εδώ εξετάζεται ο εξωδικαστικός μηχανισμός για επιχειρήσεις, που επιτρέπει ενιαία ρύθμιση οφειλών προς τράπεζες, funds, ΕΦΚΑ και εφορία, εφόσον συντρέχουν οι προϋποθέσεις. Ελέγχουμε αν συμφέρει σε σχέση με τη δικαστική οδό." },
      { q: "Η επιχείρηση σταμάτησε να λειτουργεί. Έχει νόημα η άμυνα;", a: "Έχει — ειδικά για τον περιορισμό των προσωπικών εγγυήσεων και την προστασία της ατομικής περιουσίας εγγυητών και διαχειριστών. Ακόμη και αν η εταιρεία έκλεισε, οι εγγυήσεις και οι οφειλές μπορεί να σας ακολουθούν προσωπικά." },
      { q: "Τι έγγραφα χρειάζεστε για τον έλεγχο;", a: `Τη δανειακή/πιστωτική σύμβαση, τις συμβάσεις εγγύησης, τα έγγραφα εξασφαλίσεων, τις επιστολές και κάθε έγγραφο από ${who} ή την τράπεζα — εξώδικα, καταγγελία, διαταγή πληρωμής, κατασχετήρια έκθεση. Σημαντικότερο: οι ημερομηνίες επίδοσης.` },
    ],
    ctaTitle: `Για την επιχείρησή σας — πρώτα έλεγχος, μετά στρατηγική.`,
    ctaText: "Γραφείο Λέοντος Σοφού 12, Θεσσαλονίκη. Σε επιχειρηματικές οφειλές τα ποσά είναι μεγάλα και οι προθεσμίες αυστηρές — ο φάκελος αξιολογείται κατεπειγόντως.",
  };
}

function overridesEn(e) {
  const N = e.en;
  const who = e.kind === "bank" ? N : `the servicer ${N}`;
  return {
    seoTitle: `Lawyer for ${N} Business Loans – Companies in Thessaloniki`,
    seoDescription: `Company or professional with a corporate loan or personal guarantee at ${N}? Review of the guarantee, business property, objection, suspension and the out-of-court mechanism for businesses. Tel: +30 2310 545 261.`,
    heroTitle: `Lawyer for ${N} Professional and Corporate Loans — Businesses and Professionals`,
    heroSubtitle: "Corporate loans · Personal guarantees · Out-of-court mechanism for businesses",
    intro: `This page is for businesses, companies and self-employed professionals with debts to ${who}. Professional and corporate loans, working capital, current accounts, bond loans and above all the personal guarantees of managers and partners lead to payment orders, seizures and auctions — often with larger amounts and immediate consequences for viability. Ioannis Papaioannou has defended businesses and professionals against banks, funds and servicers for 25+ years.`,
    whatTitle: "Corporate loans and guarantees: what we check first",
    whatText: `In a business debt to ${who}, the file is almost always more complex than a residential case. We review the loan or credit agreement, the securities (prenotations, pledges, assignments), the amount of the claim and the legal standing of the party pursuing today — that is, whether the claim stayed with the bank or was transferred to a fund with a servicing company. Personal guarantees carry particular weight: when the entrepreneur, manager or partner has guaranteed, the extent and limits of their liability are checked separately. A guarantee is not always unlimited, nor always valid.`,
    protectTitle: "Protecting business property and equipment",
    protectText: "In business cases not only the home is at risk, but also the business premises, the machinery, the goods, the business accounts and the very continuation of the activity. Every act of enforcement — garnishment, freezing of accounts, auction of fixed assets — is met with an objection and, where needed, an application for suspension. From the outset we check the legal standing, the transfer of the claim, the amount of the debt, the interest, the charges and every act of enforcement, aiming to keep the business standing while the substance is judged.",
    negotiationTitle: "Negotiation and settlement of corporate debts — aiming at viability",
    negotiationIntro: `In a business debt, a settlement is not merely a matter of instalments. It is a matter of viability. Before any contact with ${who} we check the legal standing, the real balance, the guarantees and the data of the business, so that the proposal rests on numbers that hold. The goal is a settlement served by real cash flow, with a debt write-off (haircut) where documented and a controlled extent of personal guarantees.`,
    negotiationOutro: "For businesses, the best deal is the one that lets the business continue. A settlement that is served, guarantees that are bounded, judicial pressure where needed.",
    cta1Title: `Does your business have a document from ${who}?`,
    cta1Text: "An immediate first assessment of the file: corporate loan, guarantees, securities, deadlines. Call +30 2310 545 261 or send the form.",
    cta2Title: "Before you sign a settlement or acknowledge a corporate debt — talk to us.",
    cta2Text: "In business debts, a hasty signature can trigger personal guarantees or acknowledge an amount that could be challenged. First the check, then the answer.",
    faqTitle: `FAQ — Businesses and ${N}`,
    faq: [
      { q: `I have personally guaranteed a corporate loan to ${who}. Is my personal property at risk?`, a: "A personal guarantee triggers liability, but its extent and validity are checked. We examine the limits of the amount, the terms of the guarantee, any abusive clauses and whether the lawful conditions were met. Not every guarantee is unlimited or untouchable." },
      { q: "Can my business account or equipment be seized?", a: "With an enforceable title and a lawful procedure, yes — but every act of enforcement (garnishment, freezing of accounts, auction of fixed assets) has points of challenge with specific deadlines. An immediate objection and application for suspension can keep the business standing." },
      { q: "My business owes banks, social security and the tax office at once. What happens?", a: "Here the out-of-court mechanism for businesses is examined, allowing a single settlement of debts to banks, funds, social security (EFKA) and the tax office, where the conditions are met. We check whether it is preferable to the judicial route." },
      { q: "The business has stopped operating. Is a defence still worthwhile?", a: "It is — especially to limit personal guarantees and protect the personal property of guarantors and managers. Even if the company closed, the guarantees and debts may follow you personally." },
      { q: "What documents do you need for the review?", a: `The loan/credit agreement, the guarantee contracts, the security documents, the letters and every document from ${who} or the bank — extrajudicial notices, termination, payment order, seizure report. Most important: the dates of service.` },
    ],
    ctaTitle: "For your business — first the check, then the strategy.",
    ctaText: "Office at 12 Leontos Sofou St., Thessaloniki. In business debts the amounts are large and the deadlines strict — the file is assessed as a matter of urgency.",
  };
}

function overridesDe(e) {
  const N = e.de;
  const who = e.kind === "bank" ? N : `dem Servicer ${N}`;
  return {
    seoTitle: `Anwalt für ${N}-Unternehmensdarlehen – Firmen in Thessaloniki`,
    seoDescription: `Unternehmen oder Selbstständiger mit Unternehmensdarlehen oder persönlicher Bürgschaft bei ${N}? Prüfung der Bürgschaft, des Betriebsvermögens, Einspruch, Aussetzung und außergerichtlicher Mechanismus für Unternehmen. Tel: +30 2310 545 261.`,
    heroTitle: `Anwalt für ${N}-Gewerbe- und Unternehmensdarlehen — Unternehmen und Selbstständige`,
    heroSubtitle: "Unternehmensdarlehen · Persönliche Bürgschaften · Außergerichtlicher Mechanismus",
    intro: `Diese Seite richtet sich an Unternehmen, Gesellschaften und Selbstständige mit Schulden gegenüber ${who}. Gewerbe- und Unternehmensdarlehen, Betriebskapital, Kontokorrentkredite, Anleihedarlehen und vor allem die persönlichen Bürgschaften von Geschäftsführern und Gesellschaftern führen zu Zahlungsbefehlen, Pfändungen und Versteigerungen — oft mit höheren Beträgen und unmittelbaren Folgen für die Existenzfähigkeit. Ioannis Papaioannou verteidigt seit über 25 Jahren Unternehmen und Selbstständige gegenüber Banken, Fonds und Servicern.`,
    whatTitle: "Unternehmensdarlehen und Bürgschaften: was wir zuerst prüfen",
    whatText: `Bei einer geschäftlichen Schuld gegenüber ${who} ist die Akte fast immer komplexer als bei einem Wohnungsfall. Wir prüfen den Darlehens- oder Kreditvertrag, die Sicherheiten (Vormerkungen, Pfandrechte, Abtretungen), die Höhe der Forderung und die Berechtigung der heute verfolgenden Partei — also, ob die Forderung bei der Bank blieb oder an einen Fonds mit Verwaltungsgesellschaft übertragen wurde. Besonderes Gewicht haben persönliche Bürgschaften: Wenn der Unternehmer, Geschäftsführer oder Gesellschafter gebürgt hat, werden Umfang und Grenzen seiner Haftung gesondert geprüft. Eine Bürgschaft ist nicht immer unbegrenzt und nicht immer gültig.`,
    protectTitle: "Schutz von Betriebsvermögen und Ausrüstung",
    protectText: "In Geschäftsfällen ist nicht nur das Wohnhaus gefährdet, sondern auch die Geschäftsräume, die Maschinen, die Waren, die Geschäftskonten und die Fortführung der Tätigkeit selbst. Jede Vollstreckungshandlung — Drittpfändung, Kontosperrung, Versteigerung von Anlagevermögen — wird mit einem Einspruch und, wo nötig, einem Aussetzungsantrag begegnet. Von Anfang an prüfen wir die Berechtigung, die Übertragung der Forderung, die Höhe der Schuld, die Zinsen, die Gebühren und jede Vollstreckungshandlung, mit dem Ziel, das Unternehmen am Leben zu halten, während über die Substanz entschieden wird.",
    negotiationTitle: "Verhandlung und Regelung von Unternehmensschulden — mit Blick auf die Existenzfähigkeit",
    negotiationIntro: `Bei einer Unternehmensschuld ist ein Vergleich nicht bloß eine Frage der Raten. Es ist eine Frage der Existenzfähigkeit. Vor jedem Kontakt mit ${who} prüfen wir die Berechtigung, den realen Saldo, die Bürgschaften und die Daten des Unternehmens, damit der Vorschlag auf belastbaren Zahlen beruht. Ziel ist ein Vergleich, der aus realem Cashflow bedient wird, mit einem Schuldenschnitt (Haircut), wo belegt, und einem kontrollierten Umfang der persönlichen Bürgschaften.`,
    negotiationOutro: "Für Unternehmen ist der beste Deal derjenige, der dem Unternehmen die Fortführung ermöglicht. Ein Vergleich, der bedient wird, Bürgschaften, die begrenzt werden, gerichtlicher Druck, wo nötig.",
    cta1Title: `Hat Ihr Unternehmen ein Dokument von ${who}?`,
    cta1Text: "Eine sofortige erste Bewertung der Akte: Unternehmensdarlehen, Bürgschaften, Sicherheiten, Fristen. Rufen Sie +30 2310 545 261 an oder senden Sie das Formular.",
    cta2Title: "Bevor Sie einen Vergleich unterschreiben oder eine Unternehmensschuld anerkennen — sprechen Sie mit uns.",
    cta2Text: "Bei Unternehmensschulden kann eine voreilige Unterschrift persönliche Bürgschaften auslösen oder einen Betrag anerkennen, der angefochten werden könnte. Erst die Prüfung, dann die Antwort.",
    faqTitle: `FAQ — Unternehmen und ${N}`,
    faq: [
      { q: `Ich habe persönlich für ein Unternehmensdarlehen gegenüber ${who} gebürgt. Ist mein Privatvermögen gefährdet?`, a: "Eine persönliche Bürgschaft löst eine Haftung aus, aber ihr Umfang und ihre Gültigkeit werden geprüft. Wir untersuchen die Grenzen des Betrags, die Bedingungen der Bürgschaft, etwaige missbräuchliche Klauseln und ob die gesetzlichen Voraussetzungen erfüllt wurden. Nicht jede Bürgschaft ist unbegrenzt oder unantastbar." },
      { q: "Können mein Geschäftskonto oder meine Ausrüstung gepfändet werden?", a: "Mit einem vollstreckbaren Titel und einem rechtmäßigen Verfahren ja — aber jede Vollstreckungshandlung (Drittpfändung, Kontosperrung, Versteigerung von Anlagevermögen) hat Anfechtungspunkte mit bestimmten Fristen. Ein sofortiger Einspruch und Aussetzungsantrag kann das Unternehmen am Leben halten." },
      { q: "Mein Unternehmen schuldet Banken, Sozialversicherung und Finanzamt zugleich. Was passiert?", a: "Hier wird der außergerichtliche Mechanismus für Unternehmen geprüft, der eine einheitliche Regelung von Schulden gegenüber Banken, Fonds, Sozialversicherung (EFKA) und Finanzamt ermöglicht, sofern die Voraussetzungen vorliegen. Wir prüfen, ob er dem Gerichtsweg vorzuziehen ist." },
      { q: "Das Unternehmen hat den Betrieb eingestellt. Lohnt sich eine Verteidigung noch?", a: "Ja — besonders zur Begrenzung persönlicher Bürgschaften und zum Schutz des Privatvermögens von Bürgen und Geschäftsführern. Auch wenn die Gesellschaft geschlossen wurde, können die Bürgschaften und Schulden Sie persönlich verfolgen." },
      { q: "Welche Dokumente benötigen Sie für die Prüfung?", a: `Den Darlehens-/Kreditvertrag, die Bürgschaftsverträge, die Sicherheitsdokumente, die Briefe und jedes Dokument von ${who} oder der Bank — außergerichtliche Aufforderungen, Kündigung, Zahlungsbefehl, Pfändungsbericht. Am wichtigsten: die Zustellungsdaten.` },
    ],
    ctaTitle: "Für Ihr Unternehmen — erst die Prüfung, dann die Strategie.",
    ctaText: "Kanzlei Leontos Sofou 12, Thessaloniki. Bei Unternehmensschulden sind die Beträge hoch und die Fristen streng — die Akte wird vordringlich bewertet.",
  };
}

const OV = { el: overridesEl, en: overridesEn, de: overridesDe };

for (const loc of ["el", "en", "de"]) {
  const j = read(loc);
  for (const e of ENTITIES) {
    const base = j[e.base];
    const kept = {};
    for (const k of KEEP) kept[k] = base[k];
    j[e.biz] = { ...base, ...kept, ...OV[loc](e) };
  }
  write(loc, j);
  console.log(`✅ ${loc}: ${ENTITIES.length} business namespaces`);
}

// validate parity vs base
const elj = read("el");
const ref = Object.keys(elj.eurobank).sort();
for (const loc of ["el", "en", "de"]) {
  const j = read(loc);
  for (const e of ENTITIES) {
    const missing = ref.filter((x) => !Object.keys(j[e.biz]).includes(x));
    if (missing.length) console.log(`⚠️ ${loc}.${e.biz} missing: ${missing.join(",")}`);
  }
}
console.log("✅ parity check done");
