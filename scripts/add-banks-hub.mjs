// node scripts/add-banks-hub.mjs — adds the "banks" hub-page namespace to el/en/de
import { readFileSync, writeFileSync } from "fs";
const read = (f) => JSON.parse(readFileSync(`messages/${f}.json`, "utf-8"));
const write = (f, j) => writeFileSync(`messages/${f}.json`, JSON.stringify(j, null, 2) + "\n", "utf-8");

const NS = {
  el: {
    seoTitle: "Δικηγόρος για Δάνεια Τραπεζών – Πλειστηριασμοί Θεσσαλονίκη",
    seoDescription: "Δάνεια Eurobank, Alpha Bank, Τράπεζας Πειραιώς ή Εθνικής σε καθυστέρηση; Ανακοπή, αναστολή, ρύθμιση με κούρεμα στη Θεσσαλονίκη και σε όλη την Ελλάδα. Τηλ: 2310 545 261.",
    heroCity: "Θεσσαλονίκη · Λέοντος Σοφού 12",
    heroTitle: "Δικηγόρος για Δάνεια Τραπεζών και Πλειστηριασμούς",
    heroSubtitle: "Eurobank · Alpha Bank · Τράπεζα Πειραιώς · Εθνική Τράπεζα",
    intro: "Όταν ένα τραπεζικό δάνειο μπαίνει σε καθυστέρηση, η υπόθεση σπάνια μένει στην ίδια την τράπεζα. Συχνά μεταβιβάζεται σε εταιρεία ειδικού σκοπού (fund) και τη διαχείριση αναλαμβάνει εταιρεία διαχείρισης απαιτήσεων (servicer). Όποια κι αν είναι η τράπεζα, η λογική της άμυνας είναι κοινή: έλεγχος της νομιμοποίησης, της μεταβίβασης, του ποσού και κάθε πράξης εκτέλεσης, μέσα στις προθεσμίες που τρέχουν. Επιλέξτε την τράπεζά σας για αναλυτική ενημέρωση.",
    cardsTitle: "Επιλέξτε την τράπεζά σας",
    cardCta: "Δείτε τη σελίδα",
    cards: [
      { slug: "eurobank", name: "Eurobank", desc: "Δάνεια Eurobank που συχνά έχουν περάσει σε fund και servicer. Ανακοπή, αναστολή και ρύθμιση με στόχο τη διαγραφή οφειλής." },
      { slug: "alpha", name: "Alpha Bank", desc: "Δάνεια Alpha Bank και τιτλοποιήσεις. Ο έλεγχος της αλυσίδας μεταβίβασης είναι συχνά το πιο αδύναμο σημείο της άλλης πλευράς." },
      { slug: "piraeus", name: "Τράπεζα Πειραιώς", desc: "Δάνεια Τράπεζας Πειραιώς. Αυστηρές, τυποποιημένες διαδικασίες εκτέλεσης — που ακριβώς γι' αυτό ελέγχονται τυπικά." },
      { slug: "ethniki", name: "Εθνική Τράπεζα", desc: "Δάνεια Εθνικής Τράπεζας, συχνά παλαιότερα. Η παραγραφή και η αλυσίδα μεταβιβάσεων είναι συχνά τα ισχυρότερα σημεία άμυνας." },
    ],
    servicersNoteTitle: "Σας διεκδικεί servicer αντί για την τράπεζα;",
    servicersNoteText: "Αν την απαίτηση τη διαχειρίζεται πλέον doValue, Intrum, Cepal ή QQuant, δείτε τις αναλυτικές σελίδες ανά εταιρεία διαχείρισης.",
    servicersNoteCta: "Σελίδες για funds & servicers",
    urgencyTitle: "Κάθε έγγραφο έχει προθεσμία",
    urgencyText: "Εξώδικο, διαταγή πληρωμής, κατάσχεση και πλειστηριασμός έχουν αυστηρές προθεσμίες άμυνας. Όσο νωρίτερα ελεγχθεί ο φάκελος, τόσο περισσότερες οι διαθέσιμες κινήσεις.",
    ctaTitle: "Ανεξάρτητα από την τράπεζα — πρώτα έλεγχος, μετά στρατηγική.",
    ctaText: "Γραφείο Λέοντος Σοφού 12, Θεσσαλονίκη. Ο φάκελός σας αξιολογείται κατεπειγόντως, λόγω των προθεσμιών.",
    ctaButton: "Άμεσος Έλεγχος Φακέλου",
  },
  en: {
    seoTitle: "Lawyer for Bank Loans – Foreclosures in Thessaloniki",
    seoDescription: "Eurobank, Alpha Bank, Piraeus Bank or National Bank of Greece loan in arrears? Objection, suspension, settlement with a haircut in Thessaloniki and across Greece. Tel: +30 2310 545 261.",
    heroCity: "Thessaloniki · 12 Leontos Sofou St.",
    heroTitle: "Lawyer for Bank Loans and Foreclosures",
    heroSubtitle: "Eurobank · Alpha Bank · Piraeus Bank · National Bank of Greece",
    intro: "When a bank loan falls into arrears, the case rarely stays with the bank itself. It is often transferred to a special purpose vehicle (fund) and management is taken over by a credit servicing company (servicer). Whatever the bank, the logic of the defence is the same: checking the legal standing, the transfer, the amount and every act of enforcement, within the deadlines that are running. Choose your bank for detailed information.",
    cardsTitle: "Choose your bank",
    cardCta: "View the page",
    cards: [
      { slug: "eurobank", name: "Eurobank", desc: "Eurobank loans that have often passed to a fund and servicer. Objection, suspension and settlement aiming at a debt write-off." },
      { slug: "alpha", name: "Alpha Bank", desc: "Alpha Bank loans and securitisations. Checking the chain of transfer is often the weakest point of the other side." },
      { slug: "piraeus", name: "Piraeus Bank", desc: "Piraeus Bank loans. Strict, standardised enforcement procedures — which for that very reason can be challenged on formal grounds." },
      { slug: "ethniki", name: "National Bank of Greece", desc: "National Bank of Greece loans, often older ones. Limitation periods and the chain of transfers are often the strongest defence points." },
    ],
    servicersNoteTitle: "Is a servicer pursuing you instead of the bank?",
    servicersNoteText: "If the claim is now managed by doValue, Intrum, Cepal or QQuant, see the detailed pages per servicing company.",
    servicersNoteCta: "Pages for funds & servicers",
    urgencyTitle: "Every document has a deadline",
    urgencyText: "Extrajudicial notices, payment orders, seizures and auctions have strict defence deadlines. The earlier the file is checked, the more moves remain available.",
    ctaTitle: "Whatever the bank — first the check, then the strategy.",
    ctaText: "Office at 12 Leontos Sofou St., Thessaloniki. Your file is assessed as a matter of urgency, due to the deadlines.",
    ctaButton: "Immediate File Review",
  },
  de: {
    seoTitle: "Anwalt für Bankdarlehen – Zwangsversteigerungen Thessaloniki",
    seoDescription: "Darlehen von Eurobank, Alpha Bank, Piraeus Bank oder National Bank of Greece im Verzug? Einspruch, Aussetzung, Vergleich mit Schuldenschnitt in Thessaloniki und ganz Griechenland. Tel: +30 2310 545 261.",
    heroCity: "Thessaloniki · Leontos Sofou 12",
    heroTitle: "Anwalt für Bankdarlehen und Zwangsversteigerungen",
    heroSubtitle: "Eurobank · Alpha Bank · Piraeus Bank · National Bank of Greece",
    intro: "Wenn ein Bankdarlehen in Verzug gerät, bleibt der Fall selten bei der Bank selbst. Oft wird er an eine Zweckgesellschaft (Fonds) übertragen und die Verwaltung von einem Kreditverwaltungsunternehmen (Servicer) übernommen. Welche Bank auch immer — die Logik der Verteidigung ist dieselbe: Prüfung der Berechtigung, der Übertragung, des Betrags und jeder Vollstreckungshandlung, innerhalb der laufenden Fristen. Wählen Sie Ihre Bank für detaillierte Informationen.",
    cardsTitle: "Wählen Sie Ihre Bank",
    cardCta: "Zur Seite",
    cards: [
      { slug: "eurobank", name: "Eurobank", desc: "Eurobank-Darlehen, die oft an einen Fonds und Servicer übergegangen sind. Einspruch, Aussetzung und Vergleich mit dem Ziel eines Schuldenschnitts." },
      { slug: "alpha", name: "Alpha Bank", desc: "Alpha-Bank-Darlehen und Verbriefungen. Die Prüfung der Übertragungskette ist oft der schwächste Punkt der Gegenseite." },
      { slug: "piraeus", name: "Piraeus Bank", desc: "Piraeus-Bank-Darlehen. Strenge, standardisierte Vollstreckungsverfahren — die gerade deshalb formal angefochten werden können." },
      { slug: "ethniki", name: "National Bank of Greece", desc: "Darlehen der National Bank of Greece, oft ältere. Verjährung und Übertragungskette sind oft die stärksten Verteidigungspunkte." },
    ],
    servicersNoteTitle: "Verfolgt Sie ein Servicer statt der Bank?",
    servicersNoteText: "Wenn die Forderung nun von doValue, Intrum, Cepal oder QQuant verwaltet wird, sehen Sie die detaillierten Seiten je Verwaltungsunternehmen.",
    servicersNoteCta: "Seiten für Fonds & Servicer",
    urgencyTitle: "Jedes Dokument hat eine Frist",
    urgencyText: "Außergerichtliche Aufforderungen, Zahlungsbefehle, Pfändungen und Versteigerungen haben strenge Verteidigungsfristen. Je früher die Akte geprüft wird, desto mehr Schritte bleiben verfügbar.",
    ctaTitle: "Welche Bank auch immer — erst die Prüfung, dann die Strategie.",
    ctaText: "Kanzlei Leontos Sofou 12, Thessaloniki. Ihre Akte wird aufgrund der Fristen vordringlich bewertet.",
    ctaButton: "Sofortige Aktenprüfung",
  },
};

for (const loc of ["el", "en", "de"]) {
  const j = read(loc);
  // insert "banks" right before the first bank namespace ("ethniki") for tidiness
  const out = {};
  let inserted = false;
  for (const k of Object.keys(j)) {
    if (k === "ethniki" && !inserted) { out.banks = NS[loc]; inserted = true; }
    out[k] = j[k];
  }
  if (!inserted) out.banks = NS[loc];
  write(loc, out);
  console.log(`✅ ${loc}.json: banks hub namespace added`);
}
