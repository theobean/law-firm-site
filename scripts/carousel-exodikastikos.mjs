import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "carousel-exodikastikos");

const W = 1080, H = 1350;
const NAVY = "#0d2d3a", NAVY2 = "#0a3543", GOLD = "#c8922a";
const BRAND = "ΙΩΑΝΝΗΣ ΠΑΠΑΪΩΑΝΝΟΥ · ΔΙΚΗΓΟΡΙΚΟ ΓΡΑΦΕΙΟ";

const navyBg = `
  <defs>
    <linearGradient id="navy" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${NAVY}"/>
      <stop offset="1" stop-color="${NAVY2}"/>
    </linearGradient>
    <linearGradient id="cream" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#f4efe6"/>
      <stop offset="1" stop-color="#ece4d3"/>
    </linearGradient>
  </defs>`;

function brandFooter(color) {
  return `<text x="${W/2}" y="1285" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" letter-spacing="4" fill="${color}">${BRAND}</text>`;
}
function slideNum(n, color) {
  return `<text x="${W-70}" y="90" text-anchor="end" font-family="Georgia, serif" font-size="30" letter-spacing="3" fill="${color}">0${n} / 06</text>`;
}

// SLIDE 1 — HOOK
const s1 = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${navyBg}
  <rect width="${W}" height="${H}" fill="url(#navy)"/>
  ${slideNum(1, "rgba(255,255,255,0.35)")}
  <text x="100" y="280" font-family="Arial, sans-serif" font-size="30" font-weight="bold" letter-spacing="7" fill="${GOLD}">ΠΡΑΓΜΑΤΙΚΗ ΥΠΟΘΕΣΗ</text>
  <text x="100" y="480" font-family="Georgia, serif" font-size="92" fill="rgba(255,255,255,0.45)">€553.797</text>
  <line x1="100" y1="450" x2="560" y2="450" stroke="rgba(200,90,90,0.75)" stroke-width="6"/>
  <text x="100" y="600" font-family="Georgia, serif" font-size="60" fill="${GOLD}">↓</text>
  <text x="100" y="760" font-family="Georgia, serif" font-size="150" font-weight="bold" fill="#ffffff">€128.340</text>
  <text x="105" y="820" font-family="Arial, sans-serif" font-size="42" fill="rgba(255,255,255,0.6)">η τελική οφειλή</text>
  <text x="100" y="1000" font-family="Arial, sans-serif" font-size="44" fill="rgba(255,255,255,0.6)">Μείωση χρέους μέσω</text>
  <text x="100" y="1060" font-family="Arial, sans-serif" font-size="44" fill="rgba(255,255,255,0.6)">εξωδικαστικού μηχανισμού</text>
  ${brandFooter("rgba(255,255,255,0.4)")}
</svg>`;

// SLIDE 2 — REDUCTION
const s2 = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${navyBg}
  <rect width="${W}" height="${H}" fill="url(#navy)"/>
  ${slideNum(2, "rgba(255,255,255,0.35)")}
  <text x="${W/2}" y="600" text-anchor="middle" font-family="Georgia, serif" font-size="280" font-weight="bold" fill="${GOLD}">76<tspan font-size="130">,83%</tspan></text>
  <text x="${W/2}" y="700" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" letter-spacing="6" fill="#ffffff">ΜΕΙΩΣΗ ΟΦΕΙΛΗΣ</text>
  <line x1="340" y1="820" x2="740" y2="820" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
  <text x="${W/2}" y="960" text-anchor="middle" font-family="Georgia, serif" font-size="110" font-weight="bold" fill="#ffffff">€425.457</text>
  <text x="${W/2}" y="1030" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" letter-spacing="6" fill="rgba(255,255,255,0.55)">ΣΥΝΟΛΙΚΗ ΔΙΑΓΡΑΦΗ</text>
  ${brandFooter("rgba(255,255,255,0.4)")}
</svg>`;

// SLIDE 3 — HOW
function check(y) {
  return `<text x="100" y="${y}" font-family="Arial, sans-serif" font-size="50" font-weight="bold" fill="${GOLD}">✓</text>`;
}
const s3 = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${navyBg}
  <rect width="${W}" height="${H}" fill="url(#navy)"/>
  ${slideNum(3, "rgba(255,255,255,0.35)")}
  <text x="100" y="280" font-family="Arial, sans-serif" font-size="30" font-weight="bold" letter-spacing="7" fill="${GOLD}">ΠΩΣ</text>
  <text x="100" y="380" font-family="Georgia, serif" font-size="88" fill="#ffffff">Εξωδικαστικός</text>
  <text x="100" y="480" font-family="Georgia, serif" font-size="88" fill="#ffffff">Μηχανισμός</text>
  <rect x="100" y="540" width="130" height="8" fill="${GOLD}"/>
  ${check(700)}
  <text x="180" y="700" font-family="Arial, sans-serif" font-size="44" fill="rgba(255,255,255,0.88)">Σύμβαση αναδιάρθρωσης</text>
  <text x="180" y="758" font-family="Arial, sans-serif" font-size="44" fill="rgba(255,255,255,0.88)">νομικά δεσμευτική</text>
  ${check(880)}
  <text x="180" y="880" font-family="Arial, sans-serif" font-size="44" fill="rgba(255,255,255,0.88)">Ρύθμιση με το Δημόσιο</text>
  <text x="180" y="938" font-family="Arial, sans-serif" font-size="44" fill="rgba(255,255,255,0.88)">και το ΚΕΑΟ</text>
  ${check(1060)}
  <text x="180" y="1060" font-family="Arial, sans-serif" font-size="44" fill="rgba(255,255,255,0.88)">Συμφωνία με 10</text>
  <text x="180" y="1118" font-family="Arial, sans-serif" font-size="44" fill="rgba(255,255,255,0.88)">χρηματοδοτικούς φορείς</text>
  ${brandFooter("rgba(255,255,255,0.4)")}
</svg>`;

// SLIDE 4 — DOCUMENT (proof). White card filled with the redacted scan via composite.
const sDoc = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${navyBg}
  <rect width="${W}" height="${H}" fill="url(#navy)"/>
  ${slideNum(4, "rgba(255,255,255,0.35)")}
  <text x="100" y="200" font-family="Arial, sans-serif" font-size="30" font-weight="bold" letter-spacing="7" fill="${GOLD}">ΤΕΚΜΗΡΙΩΣΗ</text>
  <text x="100" y="290" font-family="Georgia, serif" font-size="68" fill="#ffffff">Όχι λόγια — έγγραφο.</text>
  <rect x="190" y="350" width="700" height="640" fill="#ffffff" rx="4"/>
  <text x="${W/2}" y="1085" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" font-weight="bold" fill="#ffffff">Σύμβαση αναδιάρθρωσης · Ν. 4738/2020</text>
  <text x="${W/2}" y="1140" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.55)">Γεν. Γραμματεία Διαχείρισης Ιδιωτικού Χρέους</text>
  <text x="${W/2}" y="1195" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-style="italic" fill="rgba(200,146,42,0.85)">Στοιχεία πελάτη καλυμμένα για λόγους εμπιστευτικότητας</text>
  ${brandFooter("rgba(255,255,255,0.4)")}
</svg>`;

// SLIDE 5 — IMPORTANT (cream)
const s4 = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${navyBg}
  <rect width="${W}" height="${H}" fill="url(#cream)"/>
  ${slideNum(5, "rgba(13,45,58,0.3)")}
  <text x="100" y="380" font-family="Arial, sans-serif" font-size="30" font-weight="bold" letter-spacing="7" fill="#b5832a">ΜΕ ΕΙΛΙΚΡΙΝΕΙΑ</text>
  <text x="100" y="510" font-family="Georgia, serif" font-size="64" fill="${NAVY}">Καμία διαγραφή δεν</text>
  <text x="100" y="590" font-family="Georgia, serif" font-size="64" fill="${NAVY}">είναι <tspan fill="#b5832a" font-weight="bold">εγγυημένη.</tspan></text>
  <rect x="100" y="700" width="8" height="280" fill="${GOLD}"/>
  <text x="150" y="745" font-family="Arial, sans-serif" font-size="38" fill="rgba(13,45,58,0.7)">Κάθε υπόθεση κρίνεται στα δικά της</text>
  <text x="150" y="800" font-family="Arial, sans-serif" font-size="38" fill="rgba(13,45,58,0.7)">πραγματικά δεδομένα. Δεν υποσχόμαστε</text>
  <text x="150" y="855" font-family="Arial, sans-serif" font-size="38" fill="rgba(13,45,58,0.7)">αποτελέσματα — σχεδιάζουμε, οργανώνουμε</text>
  <text x="150" y="910" font-family="Arial, sans-serif" font-size="38" fill="rgba(13,45,58,0.7)">και υλοποιούμε με στρατηγική και ρεαλισμό.</text>
  ${brandFooter("rgba(13,45,58,0.4)")}
</svg>`;

// SLIDE 6 — CTA
const s5 = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${navyBg}
  <rect width="${W}" height="${H}" fill="url(#navy)"/>
  ${slideNum(6, "rgba(255,255,255,0.35)")}
  <text x="${W/2}" y="430" text-anchor="middle" font-family="Georgia, serif" font-size="90" fill="${GOLD}">&#9878;</text>
  <text x="${W/2}" y="600" text-anchor="middle" font-family="Georgia, serif" font-size="64" fill="#ffffff">Έχετε οφειλές σε</text>
  <text x="${W/2}" y="685" text-anchor="middle" font-family="Georgia, serif" font-size="64" fill="#ffffff">τράπεζες ή servicers;</text>
  <text x="${W/2}" y="810" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" fill="rgba(255,255,255,0.65)">Πρώτα έλεγχος του φακέλου,</text>
  <text x="${W/2}" y="868" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" fill="rgba(255,255,255,0.65)">μετά στρατηγική.</text>
  <rect x="${W/2-280}" y="960" width="560" height="100" rx="6" fill="${GOLD}"/>
  <text x="${W/2}" y="1023" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="${NAVY}">Επικοινωνήστε μαζί μας</text>
  <text x="${W/2}" y="1150" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" letter-spacing="3" fill="rgba(255,255,255,0.5)">ioannispapaioannou.lawyer</text>
  ${brandFooter("rgba(255,255,255,0.4)")}
</svg>`;

// Prepare the redacted document scan to fit the white card (660x600 inside the 700x640 card).
const docBuf = await sharp(path.join(OUT, "doc-1.jpg"))
  .resize({ width: 660 })
  .extract({ left: 0, top: 0, width: 660, height: 600 }) // top portion = title + state header
  .toBuffer();

// slide -> { svg, composites }
const slides = [
  { svg: s1 },
  { svg: s2 },
  { svg: s3 },
  { svg: sDoc, composites: [{ input: docBuf, left: 210, top: 370 }] },
  { svg: s4 },
  { svg: s5 },
];

for (let i = 0; i < slides.length; i++) {
  const file = path.join(OUT, `slide-${i + 1}.png`);
  let img = sharp(Buffer.from(slides[i].svg));
  if (slides[i].composites) img = img.composite(slides[i].composites);
  await img.png().toFile(file);
  console.log("✓", file);
}
console.log("Done — 6 slides");
