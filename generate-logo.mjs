import sharp from "sharp";

// Square 1200x1200 logo — centered layout
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <!-- Background -->
  <rect width="1200" height="1200" fill="#0f2c3f"/>

  <!-- Gold accent bar top -->
  <rect x="0" y="0" width="1200" height="6" fill="#c9a84c"/>

  <!-- Scale icon centered, large -->
  <g transform="translate(480, 320)">
    <!-- beam -->
    <line x1="0" y1="30" x2="240" y2="30" stroke="#c9a84c" stroke-width="8" stroke-linecap="round"/>
    <!-- center pole -->
    <line x1="120" y1="30" x2="120" y2="160" stroke="#c9a84c" stroke-width="8" stroke-linecap="round"/>
    <!-- base -->
    <line x1="70" y1="160" x2="170" y2="160" stroke="#c9a84c" stroke-width="8" stroke-linecap="round"/>
    <!-- left chain -->
    <line x1="0" y1="30" x2="0" y2="90" stroke="#c9a84c" stroke-width="6" stroke-linecap="round"/>
    <!-- right chain -->
    <line x1="240" y1="30" x2="240" y2="90" stroke="#c9a84c" stroke-width="6" stroke-linecap="round"/>
    <!-- left pan -->
    <path d="M-38 90 Q0 130 38 90" stroke="#c9a84c" stroke-width="6" fill="none" stroke-linecap="round"/>
    <!-- right pan -->
    <path d="M202 90 Q240 130 278 90" stroke="#c9a84c" stroke-width="6" fill="none" stroke-linecap="round"/>
    <!-- top dot -->
    <circle cx="120" cy="26" r="10" fill="#c9a84c"/>
  </g>

  <!-- Horizontal gold divider -->
  <line x1="300" y1="570" x2="900" y2="570" stroke="#c9a84c" stroke-width="1.5" opacity="0.4"/>

  <!-- Name -->
  <text x="600" y="680"
    font-family="Georgia, 'Times New Roman', serif"
    font-weight="700"
    font-size="86"
    letter-spacing="6"
    fill="white"
    text-anchor="middle">ΙΩΑΝΝΗΣ</text>

  <text x="600" y="780"
    font-family="Georgia, 'Times New Roman', serif"
    font-weight="700"
    font-size="86"
    letter-spacing="6"
    fill="white"
    text-anchor="middle">ΠΑΠΑΪΩΑΝΝΟΥ</text>

  <!-- Horizontal gold divider -->
  <line x1="300" y1="820" x2="900" y2="820" stroke="#c9a84c" stroke-width="1.5" opacity="0.4"/>

  <!-- Tagline -->
  <text x="600" y="890"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="400"
    font-size="32"
    letter-spacing="7"
    fill="rgba(255,255,255,0.55)"
    text-anchor="middle">ΔΙΚΗΓΟΡΙΚΟ ΓΡΑΦΕΙΟ &amp; ΣΥΝΕΡΓΑΤΕΣ</text>
</svg>`;

const buf = Buffer.from(svg);

await sharp(buf)
  .png()
  .toFile("logo.png");

console.log("✓ logo.png created (1200x1200)");
