import assert from "node:assert/strict";
import { test } from "node:test";
import { containsProceduralDeadline, isProceduralDeadlineQuestion } from "../src/lib/chat/deadline-policy.mjs";

const conversation = (...questions) => questions.flatMap((content, index) => [
  ...(index ? [{ role: "assistant", content: "Untrusted prior response." }] : []), { role: "user", content },
]);

test("the exact live deadline failure and direct EL/EN/DE requests classify before model generation", () => {
  for (const question of [
    "Ας πούμε ότι το έγγραφο είναι διαταγή πληρωμής. Πες μου ακριβώς πόσες μέρες έχω για ανακοπή.",
    "Ποια είναι η προθεσμία ανακοπής;", "Μέχρι πότε πρέπει να καταθέσω έφεση;",
    "Πόσες ημέρες έχω για αποποίηση κληρονομιάς;", "Εντός πόσων ημερών γίνεται η ανακοπή;",
    "What is the deadline to appeal a payment order?", "How many business days do I have to file an objection?",
    "By when must I appeal?", "How long do I have after service of a claim?",
    "When should I file an appeal?", "Can I object after 15 days?", "Μπορώ να ασκήσω ανακοπή μετά από 15 ημέρες;",
    "Welche Frist gilt für den Widerspruch?", "Wie viele Tage habe ich für den Einspruch?", "Bis wann muss ich Berufung einlegen?",
    "Kann ich nach fünfzehn Tagen Widerspruch einlegen?",
  ]) assert.equal(isProceduralDeadlineQuestion(conversation(question)), true, question);
});

test("elliptical timing requests use bounded user context and never assistant claims", () => {
  for (const [anchor, followUp] of [
    ["Τι είναι η διαταγή πληρωμής;", "πόσες μέρες έχω;"],
    ["Μου έγραψε fund για το δάνειο.", "Και πόσο χρόνο έχω;"],
    ["What is a payment order?", "How many days do I have?"],
    ["Was bedeutet ein Mahnbescheid?", "Wie lange habe ich Zeit?"],
    ["Τι είναι ανακοπή;", "Πόσες\u200bμέρες\u200bέχω;"],
  ]) assert.equal(isProceduralDeadlineQuestion(conversation(anchor, "πιο απλά;", followUp)), true, followUp);
  const turns = conversation("Hello", "How many days do I have?");
  Object.defineProperty(turns[1], "content", { get() { throw new Error("Assistant content must not be read"); } });
  assert.equal(isProceduralDeadlineQuestion(turns), false);
  assert.equal(isProceduralDeadlineQuestion(conversation("Τι είναι η ανακοπή;", "What is the weather?", "How many days do I have?")), false);
});

test("office times, statute references, ordinary durations and basic follow-ups stay outside the request guard", () => {
  for (const question of [
    "Τι είναι η διαταγή πληρωμής;", "Τι προβλέπει γενικά ο Ν. 5072/2023;", "Πότε δημοσιεύθηκε ο νόμος 4354/2015;",
    "Πόσο διαρκεί γενικά μια σύμβαση;", "How long does a contract last?", "Wie lange dauert ein Vertrag?",
    "What are your opening hours?", "Μέχρι πότε είναι ανοικτό το γραφείο;", "Ραντεβού αύριο στις 10;",
    "Bis wann ist die Kanzlei geöffnet?", "How much does a divorce cost?", "Τι είναι ο servicer;",
  ]) assert.equal(isProceduralDeadlineQuestion(conversation(question)), false, question);
  for (const question of ["Ποιες ώρες λειτουργεί το γραφείο;", "Χρειάζεται συμβολαιογράφος;", "πιο απλά;", "Κλείσε ραντεβού αύριο στις 10."]) {
    assert.equal(isProceduralDeadlineQuestion(conversation("Τι είναι η διαταγή πληρωμής;", question)), false, question);
  }
});

test("numeric, spelled, attributed and caveated procedural deadline rules are blocked", () => {
  for (const answer of [
    "Η προθεσμία ανακοπής είναι 15 εργάσιμες ημέρες από την επίδοση.",
    "Στο άρθρο αναφέρεται «δεκαπέντε εργάσιμες ημέρες». Δεν αποτελεί σημερινή συμβουλή.",
    "Στο άρθρο του γραφείου αναφέρονται δεκαπέντε εργάσιμες ημέρες. Δεν το αξιολογώ.",
    "Δεν λέω ότι ισχύουν οι 15 ημέρες της προθεσμίας για εσάς.",
    "Για ανακοπή έχετε τριάντα ημέρες.", "Ανακοπή: δεκαπενθήμερη προθεσμία.",
    "The article says an objection must be filed within fifteen business days; ask a lawyer.",
    "You have twenty-one days to appeal.", "File an objection within 15 days.",
    "Für den Widerspruch gilt eine Frist von fünfzehn Werktagen.", "Der Einspruch ist binnen zwei Wochen einzulegen.",
    "Die Berufungsfrist beträgt fünfundzwanzig Tage.", "Es gilt eine fünfzehntägige Frist.",
    "Η ανακοπή πρέπει να ασκηθεί την εικοστή ημέρα.", "Der Einspruch muss am ersten Tag eingelegt werden.",
    "You have fifteen days.", "Έχετε δεκαπέντε ημέρες.",
    "15 εργάσιμες ημέρες", "fifteen business days", "fünfzehn Werktage",
    "fünfzehn Arbeitstage",
  ]) assert.equal(containsProceduralDeadline(answer), true, answer);
});

test("Unicode digits, decomposed accents, invisible separators and line hyphenation do not hide common deadline forms", () => {
  for (const answer of [
    "Η προθεσμία είναι １５ εργάσιμες ημέρες.", "Η ανακοπή ασκείται σε ١٥ ημέρες.",
    "Η προθεσμία είναι ۱۵ ημέρες.", "Η προθεσμία είναι १५ ημέρες.",
    "Η προθεσμία είναι 1\u200b5 ε\u0301ργασιμες ημε\u0301ρες.",
    "Η προθεσμία είναι δεκα-\nπέντε εργάσιμες ημέ-\nρες.",
    "Appeal within fifteen-business-days.", "Einspruch innerhalb von fünfzehn Werk-\ntagen.",
    "Η προθεσμία είναι 1 5 εργάσιμες ημέρες.",
    "Η προθεσμία είναι 15\u200bεργάσιμες\u200bημέρες.",
    "An objection must be filed within 15\u200bbusiness\u200bdays.",
  ]) assert.equal(containsProceduralDeadline(answer), true, answer);
});

test("calendar and relative date deadlines are blocked without treating statute dates as deadlines", () => {
  for (const answer of [
    "Η προθεσμία ανακοπής λήγει στις 15/11/2026.", "Καταθέστε την ανακοπή μέχρι 2026-11-15.",
    "File your appeal by 15 November 2026.", "The objection deadline is November fifteenth.",
    "File an appeal by Nov 15, 2026.",
    "Der Einspruch muss bis zum 15. November 2026 eingelegt werden.",
    "Η ανακοπή πρέπει να κατατεθεί έως αύριο.", "The appeal deadline is tomorrow at 17:00.",
  ]) assert.equal(containsProceduralDeadline(answer), true, answer);
  for (const answer of [
    "Ο Ν. 5072/2023 δημοσιεύθηκε στο ΦΕΚ Α΄ 198/04.12.2023.",
    "Ο Ν. 4354/2015 δημοσιεύθηκε στις 16 Δεκεμβρίου 2015.",
    "Law 4738/2020 concerns debt settlement. Its original publication was in October 2020.",
    "The law was published on 15 November 2020.",
  ]) assert.equal(containsProceduralDeadline(answer), false, answer);
});

test("verified office phones and opening hours remain safe beside general legal concepts", () => {
  for (const answer of [
    "Η ανακοπή είναι ένδικο βοήθημα. Καλέστε στο +30 2310 545 261, Δευτέρα–Παρασκευή 9:00–17:00.",
    "Το γραφείο λειτουργεί οκτώ ώρες, από 9 έως 17. Δεν αξιολογώ προθεσμίες.",
    "An appeal is a legal procedure. Office hours are nine to seventeen, Monday to Friday; phone +30 2310 545 261.",
    "Die Kanzlei ist Montag bis Freitag von 9:00 bis 17:00 Uhr geöffnet. Telefon +30 2310 545 261.",
    "Μια σύμβαση μπορεί να έχει διάρκεια δύο ετών, ανάλογα με το περιεχόμενό της.",
    "The contract has a duration of two years.", "Ein Vertrag kann zwei Jahre dauern.",
    "The contract lasts two years.",
    "Η ανακοπή είναι ένδικο βοήθημα. Το γραφείο είναι ανοικτό μέχρι τις 17:00.",
    "Το γραφείο έχει τρία έτη λειτουργίας.",
    "Δεν υπολογίζω προθεσμίες. Για τη δική σας υπόθεση επικοινωνήστε με δικηγόρο.", "",
  ]) assert.equal(containsProceduralDeadline(answer), false, answer);
});

test("the exact office-hours follow-up stays outside the question classifier", () => {
  const messages = [
    { role: "user", content: "Πού βρίσκεται το γραφείο και πώς μπορώ να επικοινωνήσω;" },
    { role: "assistant", content: "Το γραφείο βρίσκεται στη Λέοντος Σοφού 12, 54625, Θεσσαλονίκη. Μπορείτε να επικοινωνήσετε στο +30 2310 545 261 ή στο iopapaio@gmail.com." },
    { role: "user", content: "Ποιες ώρες είστε ανοιχτά;" },
  ];
  assert.equal(isProceduralDeadlineQuestion(messages), false);
});

test("complete weekday/hour schedules do not need a literal office word", () => {
  for (const answer of [
    "Δευτέρα έως Παρασκευή,9:00–17:00.",
    "Δευτέρα–Παρασκευή από 9:00 έως 17:00.",
    "Είμαστε ανοιχτά Δευτέρα έως Παρασκευή, 9:00–17:00.",
    "Μπορείτε να καλέσετε Δευτέρα–Παρασκευή από 9:00 έως 17:00.",
    "Ώρες λειτουργίας: 9:00 έως 17:00.",
    "Δευτέρα έως Παρασκευή, 9 έως 17 ώρες.",
    "Δευτέρα έως Παρασκευή, ９:００–１７:００.",
    "Δευτέρα έως Παρασκευή, 9:\u200b00–17:\u200b00.",
    "Monday to Friday, from 9:00 until 17:00.",
    "Open Monday until Friday, 9:00–17:00.",
    "Office hours: nine to seventeen.",
    "Montag bis Freitag, von 9:00 bis 17:00 Uhr.",
    "Die Kanzlei ist Montag bis Freitag von 9:00 bis 17:00 Uhr geöffnet.",
  ]) assert.equal(containsProceduralDeadline(answer), false, answer);
});

test("weekday schedules and office suffixes cannot hide procedural rules or date deadlines", () => {
  for (const answer of [
    "Η ανακοπή πρέπει να ασκηθεί μέχρι τις 17:00. Δευτέρα έως Παρασκευή, 9:00–17:00.",
    "Η προθεσμία είναι 15 εργάσιμες ημέρες. Το γραφείο είναι ανοικτό Δευτέρα έως Παρασκευή, 9:00–17:00.",
    "Στο άρθρο του γραφείου αναφέρονται δεκαπέντε εργάσιμες ημέρες, αλλά δεν το υπολογίζω. Δευτέρα–Παρασκευή 9:00–17:00.",
    "Η προθεσμία είναι １５ εργάσιμες ημέρες· γραφείο ανοιχτό Δευτέρα–Παρασκευή 9:00–17:00.",
    "Η προθεσμία είναι 15\u200bεργάσιμες\u200bημέρες. Γραφείο ανοιχτό.",
    "Μέχρι 15/11/2026. Το γραφείο είναι ανοιχτό Δευτέρα–Παρασκευή 9:00–17:00.",
    "Μέχρι 17:00, γραφείο ανοιχτό Δευτέρα έως Παρασκευή 9:00–17:00.",
    "Δεν λέω ότι είναι προθεσμία ανακοπής: Δευτέρα έως Παρασκευή 9:00–17:00.",
    "Δεν δίνω προθεσμία ανακοπής. Δευτέρα έως Παρασκευή, 9:00–17:00.",
    "You have fifteen hours. Office hours: Monday to Friday, 9:00 until 17:00.",
    "The appeal deadline is Monday at 17:00. Open Monday to Friday, 9:00–17:00.",
    "This is not an appeal deadline: Monday to Friday, 9:00 until 17:00.",
    "This is not an appeal deadline. Monday to Friday, 9:00 until 17:00.",
    "Montag bis Freitag 9:00-17:00 für den Widerspruch; Kanzlei geöffnet.",
    "Keine Einspruchsfrist: Montag bis Freitag, 9:00 bis 17:00 Uhr.",
  ]) assert.equal(containsProceduralDeadline(answer), true, answer);
});

test("bounded policy helpers reject malformed input and never mutate valid conversations", () => {
  const turns = conversation("Τι είναι ανακοπή;", "πόσες μέρες έχω;");
  const before = structuredClone(turns);
  isProceduralDeadlineQuestion(turns);
  assert.deepEqual(turns, before);
  for (const invalid of [null, [], [{ role: "assistant", content: "Hi" }], conversation("x".repeat(1201)), conversation("\ud800"), Array.from({ length: 11 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "x" }))]) {
    assert.throws(() => isProceduralDeadlineQuestion(invalid), TypeError);
  }
  for (const invalid of [null, {}, "x".repeat(4001), "\ud800"]) assert.throws(() => containsProceduralDeadline(invalid), TypeError);
  assert.equal(containsProceduralDeadline("a-".repeat(1900)), false);
});
