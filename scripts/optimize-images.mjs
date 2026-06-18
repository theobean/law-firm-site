import sharp from "sharp";
import { readdir, stat, copyFile, rename } from "fs/promises";
import { join } from "path";

const PUBLIC_DIR = new URL("../public/", import.meta.url).pathname.replace(/^\//, "");

const TARGETS = [
  { file: "δικηγορος.png", maxWidth: 1200, quality: 82 },
  { file: "γραφειο.png",   maxWidth: 1600, quality: 80 },
  { file: "λαμπρινη.png",  maxWidth: 1200, quality: 82 },
];

const fmt = (b) => `${(b / 1024).toFixed(0)} KB`;

for (const { file, maxWidth, quality } of TARGETS) {
  const path = join(PUBLIC_DIR, file);
  const backup = path + ".bak";

  const before = (await stat(path)).size;
  await copyFile(path, backup);

  const img = sharp(path).rotate();
  const meta = await img.metadata();
  const resized = meta.width && meta.width > maxWidth ? img.resize({ width: maxWidth }) : img;

  const buffer = await resized.png({ quality, compressionLevel: 9, palette: true }).toBuffer();

  const fs = await import("fs/promises");
  await fs.writeFile(path, buffer);

  const after = (await stat(path)).size;
  const saved = (((before - after) / before) * 100).toFixed(0);
  console.log(`${file}: ${fmt(before)} → ${fmt(after)} (-${saved}%)`);
}

console.log("\nDone. Backups saved as *.bak — delete after verifying.");
