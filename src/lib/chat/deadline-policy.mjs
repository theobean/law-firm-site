// Deterministic scope checks, not a legal deadline calculator or semantic proof.
// Call only after normal request/output validation. No history supplies facts.
const MAX_TEXT_LENGTH = 4000;
const MAX_USER_LENGTH = 1200;
const MAX_MESSAGES = 9;

function normalize(value, maximum = MAX_TEXT_LENGTH) {
  if (typeof value !== "string" || value.length > maximum || /[\uD800-\uDFFF]/u.test(value)) {
    throw new TypeError("Invalid deadline policy text");
  }
  return value.normalize("NFKC").normalize("NFD").replace(/\p{M}/gu, "")
    .toLowerCase().replace(/ς/g, "σ").replace(/ß/g, "ss")
    .replace(/\p{Cf}/gu, "")
    .replace(/([\p{L}])[-‐‑‒–—][ \t]*\r?\n[ \t]*([\p{L}])/gu, "$1$2")
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/gu, " ");
}

function tokenize(text) {
  const tokens = [];
  let clause = 0;
  for (const match of text.matchAll(/[\p{L}]+|[\p{N}]+|[.!?;\n]+/gu)) {
    if (/^[.!?;\n]/u.test(match[0])) clause++;
    else tokens.push({ word: match[0], clause, index: match.index });
  }
  return tokens;
}

const proceduralStem = /^(?:ανακοπ|εφεσ|ενδικ|αγωγ|δικαστ|επιδο|επιδιδ|κατασχ|πλειστηριασ|εκτελεσ|παραγραφ|αποποι|appeal|object|lawsuit|litigat|court|foreclos|enforc|garnish|seizur|served|limitation|einspruch|widerspruch|berufung|rechtsmittel|klag|gericht|zustell|vollstreck|pfand|zwangsversteiger|verjahr|mahnbescheid|zahlungsbefehl)/u;
const legalContextStem = /^(?:διαζυγ|κληρονομ|συμβασ|οφειλ|δανει|νομικ|fund|servicer|divorc|inherit|contract|loan|debt|legal|scheidung|erbschaft|vertrag|darlehen|schuld|rechtlich|gesetzlich)/u;
const deadlineStem = /^(?:προθεσμ|deadline|frist|ausschlussfrist|rechtsmittelfrist)/u;
const officeStem = /^(?:γραφει|ωραρι|ραντεβου|αμοιβ|χρεωσ|office|opening|appointment|fee|price|sprechzeit|offnungszeit|kanzlei|termin|honorar)/u;
const openingStem = /^(?:ωραρι|ανοιχτ|ανοικτ|λειτουργ|κλειστ|opening|open|closed|offnungszeit|geoffnet|geschlossen)/u;
const unitStem = /^(?:ημερ|εργασιμ[\p{L}]{0,8}ημερ|μερα|μερεσ|μερων|εβδομαδ|μηνα|μηνεσ|μηνων|χρονια|ετοσ|ετη|ετων|ωρα|ωρεσ|ωρων|businessday|workingday|day|week|month|year|hour|tag|werktag|arbeitstag|woche|monat|jahr|stunde)/u;
const actionStem = /^(?:ασκ|ασκη|καταθε|καταθ|υποβαλ|υποβλη|προσφυγ|file|filing|submit|lodge|bring|einleg|erheb|einreich)/u;
const limitStem = /^(?:ληγ|ληξ|εκπνε|τελευται|εντοσ|μεχρι|εωσ|οφειλ|πρεπει|expire|expir|within|until|before|deadline|must|binnen|innerhalb|spatesten|ablauf|endet|muss|frist)/u;
const possession = new Set("εχω εχεισ εχετε εχουμε εχει have has having habe hast haben habt bleibt verbleibt verbleiben".split(" "));
const questionWords = new Set("ποσεσ ποσα ποσων ποσο ποτε how many when wie wieviel wieviele wann".split(" "));
const durationStem = /^(?:διαρκ|διαρκε|χρειαζ|take|takes|taking|lasts|lasting|dauert|dauern)/u;
const relativeDay = /^(?:αυριο|μεθαυριο|αυθημερον|σημερα|tomorrow|today|morgen|heute|ubermorgen)$/u;
const monthStem = /^(?:ιαν|φεβ|μαρτ|απρ|μαιου|μαιο|ιουν|ιουλ|αυγ|σεπ|οκτ|νοε|δεκ|jan|feb|march|marz|apr|may|mai|jun|jul|aug|sep|oct|okt|nov|dec|dez)/u;
const weekdayStem = /^(?:δευτερα|τριτη|τεταρτη|πεμπτη|παρασκευη|σαββατο|κυριακη|monday|tuesday|wednesday|thursday|friday|saturday|sunday|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)/u;
const contactStem = /^(?:καλεσ|καλεσετ|καλει|τηλεφων|επικοινων|call|contact|reach|erreich|anruf)/u;
const hourUnitStem = /^(?:ωρα|ωρεσ|ωρων|hour|stunde|uhr)/u;
const scheduleWords = new Set((
  "το η τισ τησ των και απο εωσ μεχρι στισ στην στη για ειναι ειμαστε ωρα ωρεσ ωρων τοπικη ελλαδασ καθημερινα " +
  "μπορειτε να μασ στο στον στα με εμασ " +
  "the a an and from to until at in on are is we us you can hours local time greece greek " +
  "die der das und von bis um ist sind wir sie uns konnen uhr ortszeit griechenland"
).split(" "));
const scheduleLeadIns = new Set("το η the a an die der das ειναι ειμαστε we are wir sind μπορειτε να you can sie konnen".split(" "));
const numberWords = new Set((
  "μια μιασ ενα ενοσ εναν δυο δυο τρεισ τρια τριων τεσσερισ τεσσερα τεσσαρεσ πεντε εξι επτα εφτα οκτω οχτω εννεα εννια " +
  "δεκα ενδεκα εντεκα δωδεκα δεκατρεισ δεκατρια δεκατεσσερισ δεκαπεντε δεκαεξι δεκαεπτα δεκαοκτω δεκαεννεα " +
  "εικοσι τριαντα σαραντα πενηντα εξηντα εβδομηντα ογδοντα ενενηντα εκατο χιλια " +
  "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen " +
  "twenty thirty forty fifty sixty seventy eighty ninety hundred thousand first second third fourth fifth sixth seventh eighth ninth tenth " +
  "eleventh twelfth thirteenth fourteenth fifteenth sixteenth seventeenth eighteenth nineteenth twentieth thirtieth sixtieth ninetieth " +
  "ein eins eine einen einem einer zwei drei vier funf sechs sieben acht neun zehn elf zwolf dreizehn vierzehn funfzehn sechzehn " +
  "siebzehn achtzehn neunzehn zwanzig dreissig vierzig funfzig sechzig siebzig achtzig neunzig hundert tausend"
).split(" "));
const compoundNumber = /^(?:(?:εικοσι|τριαντα|σαραντα|πενηντα|εξηντα|εβδομηντα|ογδοντα|ενενηντα)[\p{L}]{0,18}|(?:ein|zwei|drei|vier|funf|sechs|sieben|acht|neun)und(?:zwanzig|dreissig|vierzig|funfzig|sechzig|siebzig|achtzig|neunzig)|(?:funfzehn|vierzehn|dreissig|zwanzig)(?:te|ten|ter|tes|tem|ste|sten))$/u;
const ordinalNumber = /^(?:πρωτ|δευτερ|τριτ|τεταρτ|πεμπτ|εκτ|εβδομ|ογδο|ενατ|δεκατ|εικοστ|τριακοστ|erst|zweit|dritt|viert|funft|sechst|siebt|acht|neunt|zehnt|elft|zwolft|dreizehnt|vierzehnt|funfzehnt)[\p{L}]{0,8}$/u;

const any = (tokens, pattern) => tokens.some(({ word }) => pattern.test(word));
const words = (tokens) => tokens.map(({ word }) => word).join(" ");
function hasProcedure(tokens) {
  return any(tokens, proceduralStem) || /(?:διαταγ\p{L}* πληρωμ|payment order|service of (?:a |the )?(?:claim|order|process))/u.test(words(tokens));
}
function hasLegalContext(tokens) {
  return hasProcedure(tokens) || any(tokens, legalContextStem) || any(tokens, deadlineStem);
}
function isNumber(word) {
  return /^\p{N}+$/u.test(word) || numberWords.has(word) || compoundNumber.test(word) || ordinalNumber.test(word);
}

// Exempt a complete opening-hours clause, never merely an appended office word.
// Literal procedural/deadline language still wins when negated or quoted.
function isOpeningHoursClause(tokens, text) {
  if (!tokens.length || hasProcedure(tokens) || any(tokens, deadlineStem) || any(tokens, actionStem) ||
      any(tokens, /^(?:ληγ|ληξ|εκπνε|τελευται|εντοσ|οφειλ|πρεπει|expire|expir|within|before|must|binnen|innerhalb|spatesten|ablauf|endet|muss)/u)) return false;
  const first = tokens.find(({ word }) => !scheduleLeadIns.has(word));
  if (!first || ![weekdayStem, officeStem, openingStem, contactStem, hourUnitStem].some((pattern) => pattern.test(first.word))) return false;
  if (!any(tokens, weekdayStem) && !(any(tokens, officeStem) && (any(tokens, openingStem) || any(tokens, hourUnitStem))) &&
      !(any(tokens, openingStem) && any(tokens, hourUnitStem))) return false;
  if (!tokens.every(({ word }) => isNumber(word) || scheduleWords.has(word) ||
      [weekdayStem, officeStem, openingStem, contactStem].some((pattern) => pattern.test(word)))) return false;
  const clauseText = text.slice(tokens[0].index, tokens[tokens.length - 1].index + tokens[tokens.length - 1].word.length);
  if (/\p{Nd}{1,2}(?::\p{Nd}{2})?\s*(?:[-‐‑‒–—]|εωσ|μεχρι|to|until|bis)\s*(?:τισ\s+)?\p{Nd}{1,2}(?::\p{Nd}{2})?/u.test(clauseText)) return true;
  if (any(tokens, officeStem) && any(tokens, openingStem) &&
      /(?:εωσ|μεχρι|until|bis)\s+(?:τισ\s+)?\p{Nd}{1,2}:\p{Nd}{2}/u.test(clauseText)) return true;
  // Spelled-out hours stay bounded to one short range such as nine to seventeen.
  return tokens.some((token, index) => isNumber(token.word) &&
    tokens.slice(index + 1, index + 5).some((end, offset) => isNumber(end.word) &&
      tokens.slice(index + 1, index + offset + 1).some(({ word }) => ["εωσ", "μεχρι", "to", "until", "bis"].includes(word))));
}
function timeQuestion(tokens) {
  const text = words(tokens);
  if (/(?:ποσεσ(?:εργασιμεσ)?(?:μερεσ|ημερεσ)εχω|ποσοχρονοεχω|howmany(?:business|working)?daysdoihave|howlongdoihave|wieviele(?:werk)?tagehabeich|wielangehabeichzeit)/u.test(text.replace(/ /g, ""))) return true;
  if (any(tokens, deadlineStem) || /(?:time limit|by when|μεχρι ποτε|εωσ ποτε|bis wann|wann (?:muss|endet))/u.test(text)) return true;
  if (tokens.some(({ word }) => ["ποτε", "when", "wann"].includes(word)) &&
      (hasProcedure(tokens) && any(tokens, actionStem) || any(tokens, /^(?:ληγ|ληξ|expire|ablauf|endet)/u))) return true;
  if (hasProcedure(tokens) && any(tokens, unitStem) && tokens.some(({ word }) => isNumber(word)) &&
      (any(tokens, limitStem) || any(tokens, actionStem) || any(tokens, /^(?:μετα|πριν|after|nach|vor|μπορ|can|may|kann)/u))) return true;
  const quantity = tokens.some(({ word }) => questionWords.has(word));
  const time = any(tokens, unitStem) || /(?:χρονο|time|zeit|long|lange)/u.test(text);
  const personalTime = tokens.some(({ word }) => possession.has(word)) ||
    /(?:πρεπει|must|muss|μενουν|απομενουν|left|remaining)/u.test(text);
  return quantity && time && (personalTime || (hasProcedure(tokens) && !any(tokens, durationStem)));
}
function contextOnly(tokens) {
  return tokens.length <= 36 && (
    timeQuestion(tokens) || /^(?:και |δηλαδη |so |and |und |also )?(?:τι σημαινει|πιο απλα|με απλα λογια|what does|can you explain|more simply|simpler|was bedeutet|einfacher)/u.test(words(tokens))
  );
}

/** Detect requests for procedural time limits, including an elliptical latest
 * question anchored only by recent USER turns. Assistant prose is never read.
 * Input must already have passed the ordinary chat request validator.
 * @param {readonly {role: string, content: string}[]} messages
 * @returns {boolean}
 */
export function isProceduralDeadlineQuestion(messages) {
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > MAX_MESSAGES || messages.length % 2 !== 1) {
    throw new TypeError("Invalid deadline policy conversation");
  }
  for (let index = 0; index < messages.length; index++) {
    if (messages[index]?.role !== (index % 2 ? "assistant" : "user")) throw new TypeError("Invalid deadline policy conversation");
  }
  const latest = tokenize(normalize(messages[messages.length - 1].content, MAX_USER_LENGTH));
  if (any(latest, officeStem) && !hasProcedure(latest) && !any(latest, legalContextStem)) return false;
  if (!timeQuestion(latest)) return false;
  if (hasLegalContext(latest)) return true;
  if (latest.length > 48) return false;
  for (let index = messages.length - 3; index >= 0; index -= 2) {
    const previous = tokenize(normalize(messages[index].content, MAX_USER_LENGTH));
    if (hasLegalContext(previous)) return true;
    if (!contextOnly(previous)) return false;
  }
  return false;
}

/** Detect answer text that presents numeric/spelled procedural time limits.
 * Attribution, quotation and caveats never exempt a matched rule. This lexical
 * check is deliberately conservative; it cannot prove arbitrary prose safe.
 * @param {string} value
 * @returns {boolean}
 */
export function containsProceduralDeadline(value) {
  const text = normalize(value);
  const tokens = tokenize(text);
  const clauses = new Map();
  for (const token of tokens) {
    if (!clauses.has(token.clause)) clauses.set(token.clause, []);
    clauses.get(token.clause).push(token);
  }
  const clauseInfo = new Map([...clauses].map(([id, local]) => [id, {
    procedural: hasProcedure(local), deadline: any(local, deadlineStem),
    limit: any(local, limitStem), office: any(local, officeStem),
    openingHours: isOpeningHoursClause(local, text),
    possession: local.some(({ word }) => possession.has(word)),
    personalPossession: /(?:^| )(?:εχω|εχεισ|εχετε|εχουμε|you have|i have|we have|sie haben|du hast|ich habe)(?: |$)/u.test(words(local)),
  }]));
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    const info = clauseInfo.get(token.clause);
    const context = tokens.slice(Math.max(0, index - 16), index + 17);
    const explicitLimit = info.deadline || info.limit;
    const officeHours = /^(?:ωρα|ωρεσ|ωρων|hour|stunde)/u.test(token.word) &&
      info.openingHours;
    if (unitStem.test(token.word)) {
      const quantity = tokens.slice(Math.max(0, index - 5), index + 3)
        .some((candidate) => candidate.clause === token.clause && isNumber(candidate.word));
      const workingDays = /^(?:werktag|arbeitstag|businessday|workingday|εργασιμ[\p{L}]{0,8}ημερ)/u.test(token.word) ||
        tokens.slice(Math.max(0, index - 2), index).some(({ word }) => /^(?:εργασιμ\p{L}*|business|working)$/u.test(word));
      if (quantity && !officeHours && (workingDays || explicitLimit || info.procedural || info.personalPossession ||
          (hasProcedure(context) && info.possession))) return true;
    }
    if (/^(?:δεκαπενθημερ|δεκαημερ|τριακονθημερ|δεκαπενθημ|fortnight)/u.test(token.word) &&
        (explicitLimit || hasProcedure(context))) return true;
    if (/^(?:ein|zwei|drei|vier|funf|sechs|sieben|acht|neun|zehn|elf|zwolf|funfzehn|vierzehn|dreissig)[\p{L}]{0,20}(?:tagig|tagige|tagigen|wochtig|monatig)[\p{L}]{0,5}$/u.test(token.word) &&
        (explicitLimit || hasProcedure(context))) return true;
    const nearbyNumber = tokens.slice(Math.max(0, index - 3), index + 4)
      .some((candidate) => isNumber(candidate.word));
    if (monthStem.test(token.word) && !isNumber(token.word) && nearbyNumber || relativeDay.test(token.word)) {
      const procedural = hasProcedure(context);
      const officeCalendar = any(context, openingStem) && any(context, officeStem) && !procedural && !any(context, deadlineStem);
      if (!officeCalendar && (explicitLimit || any(context, deadlineStem) || any(context, limitStem) ||
          procedural && any(context, actionStem))) return true;
    }
  }
  // Numeric calendar dates and clock times need a limiting cue or procedural
  // action. Statute identifiers/years and ordinary office hours are not enough.
  const dates = /(?:^|[^\p{L}\p{N}])(?:\p{Nd}{4}[-/]\p{Nd}{1,2}[-/]\p{Nd}{1,2}|\p{Nd}{1,2}[./-]\p{Nd}{1,2}(?:[./-]\p{Nd}{2,4})?|\p{Nd}{1,2}:\p{Nd}{2})(?!\p{N})/gu;
  for (const match of text.matchAll(dates)) {
    const context = tokens.filter((token) => Math.abs(token.index - match.index) <= 140);
    const firstDigit = match.index + match[0].search(/\p{Nd}/u);
    const first = tokens.find((token) => token.index >= firstDigit);
    const local = clauses.get(first?.clause) ?? context;
    const numericPart = match[0].slice(match[0].search(/\p{Nd}/u));
    const clockRangePart = /^\p{Nd}{1,2}:\p{Nd}{2}$/u.test(numericPart) || /^\p{Nd}{1,2}-\p{Nd}{1,2}$/u.test(numericPart);
    if (clockRangePart && !any(context, deadlineStem) && isOpeningHoursClause(local, text)) continue;
    const procedural = hasProcedure(context);
    if (any(context, deadlineStem) || any(context, limitStem) ||
        procedural && (clockRangePart || any(context, actionStem))) return true;
  }
  return false;
}
