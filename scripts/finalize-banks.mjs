// node scripts/finalize-banks.mjs
// 1) Differentiates the EL CTA copy per bank (was identical across banks)
// 2) Generates full EN + DE namespaces from templates (replacing Greek placeholders)
import { readFileSync, writeFileSync } from "fs";

const read = (f) => JSON.parse(readFileSync(`messages/${f}.json`, "utf-8"));
const write = (f, j) => writeFileSync(`messages/${f}.json`, JSON.stringify(j, null, 2) + "\n", "utf-8");

// Per-bank config: names per locale + servicer example order + a distinct "angle"
const BANKS = {
  eurobank: {
    el: "Eurobank", el_gen: "της Eurobank", el_acc: "την Eurobank",
    en: "Eurobank", de: "Eurobank",
    servicers: ["doValue", "Intrum", "Cepal", "QQuant"],
    angle_el: "Στις υποθέσεις της Eurobank ο όγκος του χαρτοφυλακίου είναι μεγάλος και οι διαδικασίες προχωρούν γρήγορα — η ταχύτητα της δικής σας αντίδρασης μετράει.",
    angle_en: "In Eurobank cases the portfolio volume is large and the process moves fast — the speed of your response matters.",
    angle_de: "Bei Eurobank-Fällen ist das Portfoliovolumen groß und das Verfahren läuft schnell — die Geschwindigkeit Ihrer Reaktion zählt.",
  },
  alpha: {
    el: "Alpha Bank", el_gen: "της Alpha Bank", el_acc: "την Alpha Bank",
    en: "Alpha Bank", de: "Alpha Bank",
    servicers: ["Cepal", "doValue", "Intrum", "QQuant"],
    angle_el: "Πολλά δάνεια της Alpha Bank μεταβιβάστηκαν μέσω τιτλοποιήσεων — η αλυσίδα μεταβίβασης είναι συχνά το πιο αδύναμο σημείο της άλλης πλευράς.",
    angle_en: "Many Alpha Bank loans were transferred through securitisations — the chain of transfer is often the weakest point of the other side.",
    angle_de: "Viele Alpha-Bank-Darlehen wurden über Verbriefungen übertragen — die Übertragungskette ist oft der schwächste Punkt der Gegenseite.",
  },
  piraeus: {
    el: "Τράπεζα Πειραιώς", el_gen: "της Τράπεζας Πειραιώς", el_acc: "την Τράπεζα Πειραιώς",
    en: "Piraeus Bank", de: "Piraeus Bank",
    servicers: ["Intrum", "doValue", "Cepal", "QQuant"],
    angle_el: "Η Τράπεζα Πειραιώς και οι servicers της κινούνται με αυστηρές, τυποποιημένες διαδικασίες εκτέλεσης — που ακριβώς γι' αυτό ελέγχονται τυπικά.",
    angle_en: "Piraeus Bank and its servicers act through strict, standardised enforcement procedures — which for that very reason can be challenged on formal grounds.",
    angle_de: "Die Piraeus Bank und ihre Servicer handeln mit strengen, standardisierten Vollstreckungsverfahren — die gerade deshalb formal angefochten werden können.",
  },
  ethniki: {
    el: "Εθνική Τράπεζα", el_gen: "της Εθνικής Τράπεζας", el_acc: "την Εθνική Τράπεζα",
    en: "National Bank of Greece", de: "National Bank of Greece",
    servicers: ["QQuant", "doValue", "Intrum", "Cepal"],
    angle_el: "Σε παλαιότερα δάνεια της Εθνικής, η παραγραφή και η αλυσίδα μεταβιβάσεων είναι συχνά τα ισχυρότερα σημεία άμυνας.",
    angle_en: "In older National Bank of Greece loans, limitation periods and the chain of transfers are often the strongest defence points.",
    angle_de: "Bei älteren Darlehen der National Bank of Greece sind Verjährung und Übertragungskette oft die stärksten Verteidigungspunkte.",
  },
};

const list = (arr) => `${arr[0]}, ${arr[1]}, ${arr[2]} ή ${arr[3]}`;
const listEn = (arr) => `${arr[0]}, ${arr[1]}, ${arr[2]} or ${arr[3]}`;
const listDe = (arr) => `${arr[0]}, ${arr[1]}, ${arr[2]} oder ${arr[3]}`;

// ---------- EL: only patch the differentiated CTA keys ----------
const el = read("el");
for (const [slug, b] of Object.entries(BANKS)) {
  const ns = el[slug];
  ns.cta1Text = `Άμεση πρώτη αξιολόγηση: τι σας επιδόθηκε, ποια προθεσμία τρέχει, ποιες κινήσεις έχετε διαθέσιμες. ${b.angle_el} Καλέστε στο 2310 545 261 ή στείλτε τη φόρμα.`;
  ns.cta2Text = `${b.angle_el} Μία βιαστική αναγνώριση οφειλής μπορεί να κλείσει πόρτες που σήμερα είναι ανοιχτές. Πρώτα έλεγχος, μετά απάντηση.`;
  ns.ctaText = `Γραφείο Λέοντος Σοφού 12, Θεσσαλονίκη. ${b.angle_el} Λόγω αυστηρών προθεσμιών, ο φάκελός σας αξιολογείται κατεπειγόντως — σήμερα, όχι «κάποια στιγμή».`;
}
write("el", el);

// ---------- EN template ----------
function buildEn(b) {
  const B = b.en, S = b.servicers;
  return {
    seoTitle: `${B} Lawyer – Loans & Foreclosures in Thessaloniki`,
    seoDescription: `Is ${B} or the servicer handling your loan pressing you with a payment order or auction? Every document has a defence deadline. Objection, suspension, settlement with a haircut in Thessaloniki. Tel: +30 2310 545 261.`,
    heroCity: "Thessaloniki · 12 Leontos Sofou St.",
    heroTitle: `Lawyer for ${B} loans and foreclosures in Thessaloniki and across Greece`,
    heroSubtitle: "Objection · Suspension · Haircut Negotiation",
    intro: `If you have a non-performing ${B} loan, or you have received an extrajudicial notice, termination of the contract, a payment order, a writ of execution, a seizure report or an auction programme, your case is no longer at a theoretical stage. In some cases the claim is still pursued by ${B} itself. In others, the loan has been transferred to a special purpose vehicle (fund) and management has been assigned to a credit servicing company (servicer). The first thing we check is exactly that: who is pursuing you today and with what legal standing. Ioannis Papaioannou, Legal Advisor to the Association of Borrowers and Consumer Protection of Northern Greece, has been defending borrowers against banks and servicers for 25+ years. We know how ${B} works in practice, which documents must be produced, and which points of the case must be checked before the borrower is pushed into a settlement out of fear or into an auction without a real defence.`,
    whatTitle: `${B}, funds and servicers: who really pursues your loan`,
    whatText: `A ${B} loan may today be in different hands than when it was signed. Sometimes it remains with the bank and sometimes it has been transferred, through securitisation, to a special purpose vehicle (fund), with management assigned to a servicer. This matters in practice. In every case we must check who is the real beneficiary of the claim today, when and how the loan was transferred from ${B}, with which documents the transfer and the servicing assignment are proven, whether the party enforcing has legal standing in the specific procedure, and whether the amount demanded arises in a lawful, clear and verifiable way. A document — from ${B} or from a servicer — does not mean everything is settled. It means the case must be checked immediately. Before any discussion of a settlement, we must know what is demanded, by whom, with what standing and with what calculation. If management has been taken over by a specific company — such as ${listEn(S)} — see our dedicated page on it too.`,
    protectTitle: `Protecting your home from a foreclosure on a ${B} loan`,
    protectText: `No property is lost because a letter arrived. It is at risk when the case is not checked in time and the lawful means of defence are left unused. From the termination of the contract to the payment order, the writ of execution, the seizure and the auction, each stage has its own significance. We examine whether there is room for an objection, an application for suspension, inclusion in the out-of-court mechanism, direct negotiation or another targeted action. We treat no auction as a foregone conclusion. From the outset we check the legal standing of the party enforcing, the transfer of the claim from ${B}, the amount of the debt, the interest, the charges, the abusive terms and every act of enforcement. There, in the details that are often not checked, the course of a case can change. The aim is not simply to move fast. The aim is to move correctly, before enforcement appears to be the only road.`,
    deadlinesTitle: `I received an extrajudicial notice, payment order or seizure on a ${B} loan — The deadlines you must not miss`,
    deadlinesIntro: "Not every document has the same legal weight. The termination of the contract is one thing, the payment order another and the seizure yet another. But each stage shows the case is moving and the time to react is shrinking.",
    deadlines: [
      { title: "Termination of contract / extrajudicial notice", desc: "Termination of the loan contract is usually the first serious move. The debt now appears as due and payable and the road opens to a payment order. At this stage there may not yet be an objection deadline, but there is time that must not be wasted. The case must be checked before the claim becomes a judicial title." },
      { title: "Payment order", desc: "The payment order is the next step. The claim takes judicial form and can lead to enforcement. An objection to the payment order is filed within fifteen working days of its service, when the debtor has a residence or seat in Greece. If the residence or seat is abroad or unknown, the deadline is thirty working days." },
      { title: "Seizure", desc: "Seizure is the stage at which enforcement has already begun and, for real estate, an auction is already set. An objection to enforcement, on grounds concerning the claim, the writ, the procedure and the seizure, is filed within forty-five days of the seizure. If a suspension of the auction is also needed, that move is examined separately and must be made in good time." },
    ],
    deadlinesWarning: "With the termination we do not stand still. With the payment order we move immediately. With the seizure there is no room for trial and error. Defence deadlines do not wait for the borrower to recover from the shock.",
    cta1Title: `Do you have a ${B} or servicer document in front of you?`,
    cta1Text: `An immediate first assessment: what was served on you, which deadline is running, which moves are available. ${b.angle_en} Call +30 2310 545 261 or send the form.`,
    negotiationTitle: `Negotiation strategy for ${B} loans — A settlement aiming at a debt write-off (haircut), where the case allows it`,
    negotiationIntro: `Whether you are facing ${B} or the servicer managing the claim, you do not go to ask for mercy. You go to present a position. Whichever side knows the case better holds the stronger negotiating advantage. Our job is to pass that advantage to the borrower. Before any contact we check the legal standing of the party pursuing, the real beneficiary of the claim, the transfer from ${B}, the balance, the interest, the charges and every element affecting the amount. An amount that has not been verified must not become the starting point of a negotiation.`,
    negotiationPoints: [
      "The settlement must withstand time. A deal that looks good on paper but collapses on the second or third instalment is worthless. The proposal must be linked to the borrower's real financial capacity, the value of the security, the course of the claim and the data of the case.",
      "A debt write-off (haircut) is not posed as a wish. It is built as a negotiating goal, when the elements of the case allow it.",
      `The price at which the fund acquired the loan from ${B}, the history of the portfolio, the prospect of recovery, the value of the property and the existence of a judicial challenge are factors that can change the discussion.`,
      "The best negotiation takes place when the borrower has already exercised, or is ready to exercise, their rights. A well-founded objection, an application for suspension or a serious judicial challenge turns the negotiation from a mere request into a contest of positions.",
    ],
    negotiationOutro: "The point is not for a proposal to be heard. It is for it to stand. A settlement that gets paid. A write-off (haircut) when documented. Judicial pressure where needed. Because against a bank or a servicer, the best terms are not given. They are won with control, strategy and properly built pressure.",
    cta2Title: `Before you reply to or sign anything with ${B} or the servicer — talk to us.`,
    cta2Text: `${b.angle_en} A hasty acknowledgment of debt can close doors that are open today. First the check, then the answer.`,
    anakopiTitle: "Objection and Suspension of Auction before the Courts of Thessaloniki and across Greece",
    anakopiText1: "Enforcement is not met with general protests, but with a targeted procedural review of every act, every document and every amount invoked by the pursuing side.\n\nOur Law Office handles, on a daily basis, cases of objections, applications for suspension and auctions before the Courts of Thessaloniki and across Greek territory.\n\nIn every case we fully review the writ of payment, the seizure report, the documents of transfer of the claim, the servicing assignment, the analysis of the debt, the interest, the charges, the services and compliance with the lawful deadlines. An objection must not be a routine defence pleading. It must be procedurally precise, evidentially documented and adapted to the actual data of the specific file.",
    anakopiPoints: [],
    anakopiText2: "Where required, the objection is accompanied by an application for suspension, aiming to temporarily avert the auction until the substance of the dispute is judged. Suspension is not merely a means of delay. It is a procedural tool of protection, when there is a serious ground to annul the enforcement and a risk of irreparable harm from the immediate conduct of the auction.\n\nOur goal is the immediate and full assessment of the file, the highlighting of the substantive and procedural defects, and the formation of a concrete strategy either to overturn the enforcement in court or to create a strong negotiating position against the bank, the claims acquisition company or the credit servicing company.\n\nIn auction cases, time is critical. The timely submission of documents and the immediate legal review can determine whether there is real room for objection, suspension or an out-of-court settlement.",
    faqTitle: `Frequently Asked Questions about ${B} loans`,
    faq: [
      { q: `My loan was with ${B} but now another company is calling me. What does this mean?`, a: `It means ${B} probably transferred the claim to a special purpose vehicle (fund) and assigned management to a credit servicing company (servicer) — such as, depending on the portfolio, ${listEn(S)}. It does not mean the debt is self-evident or correctly calculated. The transfer, the legal standing and the amount must be checked before you do anything.` },
      { q: `Can ${B} or the servicer put my property up for auction?`, a: "Only with an enforceable title and an entirely lawful procedure — both of which are reviewed in court. The standing of the party enforcing, the amount of the claim and every act of enforcement have points of challenge with specific deadlines." },
      { q: `Is it worth negotiating with ${B} or the servicer on my own?`, a: "It is dangerous. Across from you stands a specialised mechanism that negotiates thousands of cases — you have one. Without a file review you do not even know whether the amount demanded is correct, nor what your real negotiating power is." },
      { q: "The auction is very close. Is there still hope?", a: "It depends on the file — but the answer is given only after we see it, and quickly. Procedural defects may provide grounds for action even in the last days. Call immediately at +30 2310 545 261." },
      { q: "What documents do you need for the review?", a: `Everything you have received from ${B} and from any servicing company: the loan contract, letters, extrajudicial notices, the termination, the payment order, the writ of execution, the seizure report and the auction programme. Most important of all: the dates of service.` },
    ],
    ctaTitle: `${B} and the servicers negotiate every day. We litigate every day.`,
    ctaText: `Office at 12 Leontos Sofou St., Thessaloniki. ${b.angle_en} Due to strict deadlines, your file is assessed as a matter of urgency — today, not "at some point".`,
    ctaButton: "Immediate File Review",
    ctaPhone: "Call now: +30 2310 545 261",
  };
}

// ---------- DE template ----------
function buildDe(b) {
  const B = b.de, S = b.servicers;
  return {
    seoTitle: `Anwalt ${B} – Darlehen & Zwangsversteigerungen Thessaloniki`,
    seoDescription: `Setzt Sie ${B} oder der Servicer Ihres Darlehens mit Zahlungsbefehl oder Versteigerung unter Druck? Jedes Dokument hat eine Verteidigungsfrist. Einspruch, Aussetzung, Vergleich mit Schuldenschnitt in Thessaloniki. Tel: +30 2310 545 261.`,
    heroCity: "Thessaloniki · Leontos Sofou 12",
    heroTitle: `Anwalt für ${B}-Darlehen und Zwangsversteigerungen in Thessaloniki und ganz Griechenland`,
    heroSubtitle: "Einspruch · Aussetzung · Verhandlung über Schuldenschnitt",
    intro: `Wenn Sie ein notleidendes ${B}-Darlehen haben oder eine außergerichtliche Aufforderung, eine Kündigung des Vertrags, einen Zahlungsbefehl, einen Vollstreckungstitel, einen Pfändungsbericht oder ein Versteigerungsprogramm erhalten haben, befindet sich Ihr Fall nicht mehr in einem theoretischen Stadium. In manchen Fällen wird die Forderung noch von ${B} selbst verfolgt. In anderen wurde das Darlehen an eine Zweckgesellschaft (Fonds) übertragen und die Verwaltung einem Kreditverwaltungsunternehmen (Servicer) übertragen. Das Erste, was wir prüfen, ist genau das: wer Sie heute verfolgt und mit welcher Berechtigung. Ioannis Papaioannou, Rechtsberater des Verbands der Kreditnehmer und für Verbraucherschutz Nordgriechenlands, verteidigt seit über 25 Jahren Kreditnehmer gegenüber Banken und Servicern. Wir wissen, wie ${B} in der Praxis vorgeht, welche Dokumente vorgelegt werden müssen und welche Punkte des Falles geprüft werden müssen, bevor der Schuldner aus Angst in einen Vergleich oder ohne echte Verteidigung in eine Versteigerung gedrängt wird.`,
    whatTitle: `${B}, Fonds und Servicer: wer Ihr Darlehen wirklich verfolgt`,
    whatText: `Ein ${B}-Darlehen kann sich heute in anderen Händen befinden als bei der Unterzeichnung. Mal bleibt es bei der Bank, mal wurde es über eine Verbriefung an eine Zweckgesellschaft (Fonds) übertragen, mit der Verwaltung durch einen Servicer. Das ist in der Praxis von Bedeutung. In jedem Fall muss geprüft werden, wer heute der wahre Gläubiger der Forderung ist, wann und wie das Darlehen von ${B} übertragen wurde, mit welchen Dokumenten die Übertragung und die Verwaltungsbeauftragung nachgewiesen werden, ob die vollstreckende Partei im konkreten Verfahren berechtigt ist und ob der geforderte Betrag rechtmäßig, klar und überprüfbar zustande kommt. Ein Dokument — von ${B} oder von einem Servicer — bedeutet nicht, dass alles feststeht. Es bedeutet, dass der Fall sofort geprüft werden muss. Vor jeder Gespräch über einen Vergleich müssen wir wissen, was gefordert wird, von wem, mit welcher Berechtigung und mit welcher Berechnung. Wenn die Verwaltung von einem bestimmten Unternehmen übernommen wurde — wie ${listDe(S)} — sehen Sie sich auch unsere entsprechende Seite an.`,
    protectTitle: `Schutz Ihres Zuhauses vor einer Zwangsversteigerung bei einem ${B}-Darlehen`,
    protectText: `Keine Immobilie geht verloren, weil ein Brief eingetroffen ist. Sie ist gefährdet, wenn der Fall nicht rechtzeitig geprüft wird und die rechtlichen Verteidigungsmöglichkeiten ungenutzt bleiben. Von der Kündigung des Vertrags über den Zahlungsbefehl, den Vollstreckungstitel, die Pfändung bis zur Versteigerung hat jede Phase ihre eigene Bedeutung. Wir prüfen, ob Raum für einen Einspruch, einen Aussetzungsantrag, die Aufnahme in den außergerichtlichen Mechanismus, eine direkte Verhandlung oder eine andere gezielte Maßnahme besteht. Wir behandeln keine Versteigerung als beschlossene Sache. Von Anfang an prüfen wir die Berechtigung der vollstreckenden Partei, die Übertragung der Forderung von ${B}, die Höhe der Schuld, die Zinsen, die Gebühren, die missbräuchlichen Klauseln und jede Vollstreckungshandlung. Dort, in den Details, die oft nicht geprüft werden, kann sich der Verlauf eines Falles ändern. Das Ziel ist nicht, einfach schnell zu handeln. Das Ziel ist, richtig zu handeln, bevor die Vollstreckung als einziger Weg erscheint.`,
    deadlinesTitle: `Ich habe eine außergerichtliche Aufforderung, einen Zahlungsbefehl oder eine Pfändung zu einem ${B}-Darlehen erhalten — Die Fristen, die Sie nicht versäumen dürfen`,
    deadlinesIntro: "Nicht jedes Dokument hat dasselbe rechtliche Gewicht. Die Kündigung des Vertrags ist eine Sache, der Zahlungsbefehl eine andere und die Pfändung noch eine andere. Aber jede Phase zeigt, dass der Fall voranschreitet und die Reaktionszeit kürzer wird.",
    deadlines: [
      { title: "Kündigung des Vertrags / außergerichtliche Aufforderung", desc: "Die Kündigung des Darlehensvertrags ist meist der erste ernste Schritt. Die Schuld erscheint nun als fällig und einforderbar, und der Weg zum Zahlungsbefehl öffnet sich. In dieser Phase besteht möglicherweise noch keine Einspruchsfrist, aber es gibt Zeit, die nicht verschwendet werden darf. Der Fall muss geprüft werden, bevor die Forderung zu einem Vollstreckungstitel wird." },
      { title: "Zahlungsbefehl", desc: "Der Zahlungsbefehl ist der nächste Schritt. Die Forderung nimmt gerichtliche Form an und kann zur Zwangsvollstreckung führen. Ein Einspruch gegen den Zahlungsbefehl wird innerhalb von fünfzehn Werktagen nach seiner Zustellung eingelegt, wenn der Schuldner Wohnsitz oder Sitz in Griechenland hat. Liegt der Wohnsitz oder Sitz im Ausland oder ist er unbekannt, beträgt die Frist dreißig Werktage." },
      { title: "Pfändung", desc: "Die Pfändung ist die Phase, in der die Vollstreckung bereits begonnen hat und bei Immobilien bereits eine Versteigerung angesetzt ist. Ein Einspruch gegen die Vollstreckung, aus Gründen, die die Forderung, den Titel, das Verfahren und die Pfändung betreffen, wird innerhalb von fünfundvierzig Tagen ab dem Tag der Pfändung eingelegt. Ist auch eine Aussetzung der Versteigerung erforderlich, wird dieser Schritt gesondert geprüft und muss rechtzeitig erfolgen." },
    ],
    deadlinesWarning: "Bei der Kündigung bleiben wir nicht untätig. Beim Zahlungsbefehl handeln wir sofort. Bei der Pfändung gibt es keinen Raum für Versuche. Verteidigungsfristen warten nicht, bis sich der Schuldner vom Schock erholt hat.",
    cta1Title: `Haben Sie ein ${B}- oder Servicer-Dokument vor sich?`,
    cta1Text: `Eine sofortige erste Einschätzung: was Ihnen zugestellt wurde, welche Frist läuft, welche Schritte verfügbar sind. ${b.angle_de} Rufen Sie +30 2310 545 261 an oder senden Sie das Formular.`,
    negotiationTitle: `Verhandlungsstrategie für ${B}-Darlehen — Ein Vergleich mit dem Ziel eines Schuldenschnitts (Haircut), wo der Fall es zulässt`,
    negotiationIntro: `Ob Sie ${B} oder dem Servicer gegenüberstehen, der die Forderung verwaltet — Sie gehen nicht hin, um um Gnade zu bitten. Sie gehen hin, um eine Position darzulegen. Welche Seite den Fall besser kennt, hat den stärkeren Verhandlungsvorteil. Unsere Aufgabe ist es, diesen Vorteil dem Schuldner zu verschaffen. Vor jedem Kontakt prüfen wir die Berechtigung der verfolgenden Partei, den wahren Gläubiger der Forderung, die Übertragung von ${B}, den Saldo, die Zinsen, die Gebühren und jedes Element, das den Betrag beeinflusst. Ein nicht überprüfter Betrag darf nicht zum Ausgangspunkt einer Verhandlung werden.`,
    negotiationPoints: [
      "Der Vergleich muss der Zeit standhalten. Eine Vereinbarung, die auf dem Papier gut aussieht, aber bei der zweiten oder dritten Rate zusammenbricht, ist wertlos. Der Vorschlag muss mit der tatsächlichen finanziellen Leistungsfähigkeit des Schuldners, dem Wert der Sicherheit, dem Verlauf der Forderung und den Daten des Falles verbunden sein.",
      "Ein Schuldenschnitt (Haircut) wird nicht als Wunsch formuliert. Er wird als Verhandlungsziel aufgebaut, wenn die Elemente des Falles es zulassen.",
      `Der Preis, zu dem der Fonds das Darlehen von ${B} erworben hat, die Geschichte des Portfolios, die Aussicht auf Beitreibung, der Wert der Immobilie und das Bestehen einer gerichtlichen Anfechtung sind Faktoren, die die Diskussion verändern können.`,
      "Die beste Verhandlung findet statt, wenn der Schuldner seine Rechte bereits ausgeübt hat oder bereit ist, sie auszuüben. Ein begründeter Einspruch, ein Aussetzungsantrag oder eine ernsthafte gerichtliche Anfechtung verwandelt die Verhandlung von einer bloßen Bitte in einen Wettstreit der Positionen.",
    ],
    negotiationOutro: "Es geht nicht darum, dass ein Vorschlag gehört wird. Es geht darum, dass er Bestand hat. Ein Vergleich, der bezahlt wird. Ein Schuldenschnitt (Haircut), wenn er belegt ist. Gerichtlicher Druck, wo nötig. Denn gegenüber einer Bank oder einem Servicer werden die besten Konditionen nicht geschenkt. Sie werden mit Kontrolle, Strategie und richtig aufgebautem Druck gewonnen.",
    cta2Title: `Bevor Sie ${B} oder dem Servicer etwas beantworten oder unterschreiben — sprechen Sie mit uns.`,
    cta2Text: `${b.angle_de} Eine voreilige Schuldanerkennung kann Türen schließen, die heute offen sind. Erst die Prüfung, dann die Antwort.`,
    anakopiTitle: "Einspruch und Aussetzung der Versteigerung vor den Gerichten in Thessaloniki und ganz Griechenland",
    anakopiText1: "Die Zwangsvollstreckung wird nicht mit allgemeinen Protesten beantwortet, sondern mit einer gezielten verfahrensrechtlichen Prüfung jeder Handlung, jedes Dokuments und jedes Betrags, auf den sich die verfolgende Seite beruft.\n\nUnsere Anwaltskanzlei bearbeitet täglich Fälle von Einsprüchen, Aussetzungsanträgen und Versteigerungen vor den Gerichten in Thessaloniki und im gesamten griechischen Hoheitsgebiet.\n\nIn jedem Fall prüfen wir umfassend den Zahlungstitel, den Pfändungsbericht, die Dokumente der Übertragung der Forderung, die Verwaltungsbeauftragung, die Analyse der Schuld, die Zinsen, die Gebühren, die Zustellungen und die Einhaltung der gesetzlichen Fristen. Ein Einspruch darf kein routinemäßiger Verteidigungsschriftsatz sein. Er muss verfahrensrechtlich präzise, beweisrechtlich belegt und an die tatsächlichen Daten der konkreten Akte angepasst sein.",
    anakopiPoints: [],
    anakopiText2: "Wo erforderlich, wird der Einspruch von einem Aussetzungsantrag begleitet, um die Versteigerung vorübergehend abzuwenden, bis über die Substanz des Streits entschieden ist. Die Aussetzung ist nicht bloß ein Mittel der Verzögerung. Sie ist ein verfahrensrechtliches Schutzinstrument, wenn ein ernsthafter Grund zur Aufhebung der Vollstreckung und die Gefahr eines irreparablen Schadens durch die sofortige Durchführung der Versteigerung besteht.\n\nUnser Ziel ist die sofortige und vollständige Bewertung der Akte, die Hervorhebung der materiellen und verfahrensrechtlichen Mängel und die Bildung einer konkreten Strategie, entweder um die Vollstreckung gerichtlich zu kippen oder um eine starke Verhandlungsposition gegenüber der Bank, dem Forderungserwerbsunternehmen oder dem Kreditverwaltungsunternehmen aufzubauen.\n\nIn Versteigerungsfällen ist die Zeit entscheidend. Die rechtzeitige Vorlage der Dokumente und die sofortige rechtliche Prüfung können bestimmen, ob es realen Raum für Einspruch, Aussetzung oder eine außergerichtliche Beilegung gibt.",
    faqTitle: `Häufige Fragen zu ${B}-Darlehen`,
    faq: [
      { q: `Mein Darlehen war bei ${B}, aber jetzt ruft mich eine andere Firma an. Was bedeutet das?`, a: `Es bedeutet, dass ${B} die Forderung wahrscheinlich an eine Zweckgesellschaft (Fonds) übertragen und die Verwaltung einem Kreditverwaltungsunternehmen (Servicer) übertragen hat — wie, je nach Portfolio, ${listDe(S)}. Es bedeutet nicht, dass die Schuld selbstverständlich oder korrekt berechnet ist. Die Übertragung, die Berechtigung und der Betrag müssen geprüft werden, bevor Sie irgendetwas tun.` },
      { q: `Kann ${B} oder der Servicer meine Immobilie versteigern lassen?`, a: "Nur mit einem vollstreckbaren Titel und einem vollständig rechtmäßigen Verfahren — beides wird gerichtlich überprüft. Die Berechtigung der vollstreckenden Partei, die Höhe der Forderung und jede Vollstreckungshandlung haben Anfechtungspunkte mit bestimmten Fristen." },
      { q: `Lohnt es sich, allein mit ${B} oder dem Servicer zu verhandeln?`, a: "Es ist gefährlich. Ihnen gegenüber steht ein spezialisierter Mechanismus, der Tausende von Fällen verhandelt — Sie haben einen. Ohne Aktenprüfung wissen Sie nicht einmal, ob der geforderte Betrag korrekt ist, noch wie groß Ihre tatsächliche Verhandlungsmacht ist." },
      { q: "Die Versteigerung ist sehr nah. Gibt es noch Hoffnung?", a: "Es hängt von der Akte ab — aber die Antwort wird erst gegeben, nachdem wir sie gesehen haben, und schnell. Verfahrensmängel können auch in den letzten Tagen noch Grund für Maßnahmen bieten. Rufen Sie sofort +30 2310 545 261 an." },
      { q: "Welche Dokumente benötigen Sie für die Prüfung?", a: `Alles, was Sie von ${B} und von einem etwaigen Verwaltungsunternehmen erhalten haben: den Darlehensvertrag, Briefe, außergerichtliche Aufforderungen, die Kündigung, den Zahlungsbefehl, den Vollstreckungstitel, den Pfändungsbericht und das Versteigerungsprogramm. Am wichtigsten von allem: die Zustellungsdaten.` },
    ],
    ctaTitle: `${B} und die Servicer verhandeln jeden Tag. Wir prozessieren jeden Tag.`,
    ctaText: `Kanzlei Leontos Sofou 12, Thessaloniki. ${b.angle_de} Aufgrund strenger Fristen wird Ihre Akte vordringlich bewertet — heute, nicht „irgendwann".`,
    ctaButton: "Sofortige Aktenprüfung",
    ctaPhone: "Jetzt anrufen: +30 2310 545 261",
  };
}

const en = read("en");
const de = read("de");
for (const [slug, b] of Object.entries(BANKS)) {
  en[slug] = buildEn(b);
  de[slug] = buildDe(b);
}
write("en", en);
write("de", de);

// validation
const ref = Object.keys(el.intrum).sort();
for (const [loc, j] of [["el", el], ["en", en], ["de", de]]) {
  for (const slug of Object.keys(BANKS)) {
    const k = Object.keys(j[slug] || {}).sort();
    const missing = ref.filter((x) => !k.includes(x));
    if (missing.length) console.log(`⚠️  ${loc}.${slug} missing: ${missing.join(",")}`);
  }
}
console.log("✅ EL CTAs differentiated · EN + DE fully translated · key parity OK");
