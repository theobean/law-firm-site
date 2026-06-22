// node scripts/patch-olap-seo.mjs
// Ενημερώνει seoTitle + seoDescription και στα 2 ΟλΑΠ άρθρα ώστε να
// εμφανίζονται στη Google για "Απόφαση 6/2026 της Ολομέλειας του Αρείου Πάγου"

import { createClient } from "next-sanity";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env.local");

const env = {};
try {
  readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
    const [k, ...v] = line.split("=");
    if (k?.trim()) env[k.trim()] = v.join("=").trim();
  });
} catch {}

const token = env.SANITY_API_TOKEN;
if (!token) { console.error("❌  Λείπει SANITY_API_TOKEN"); process.exit(1); }

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID || "hwu5yvsr",
  dataset: env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

const patches = [
  {
    slug: "olap-6-2026-nomos-katseli-atomiki-energeia-daneiolithpti",
    // 50 chars
    seoTitle: "Απόφαση 6/2026 Ολομέλεια Αρείου Πάγου: Κατσέλη",
    // 159 chars
    seoDescription:
      "Η Απόφαση 6/2026 της Ολομέλειας του Αρείου Πάγου για τον Νόμο Κατσέλη: τόκοι επί μηνιαίας δόσης, επανυπολογισμός οφειλών και βήματα για κάθε δανειολήπτη.",
  },
  {
    slug: "olap-6-2026-funds-iraklis-dimosio-symferon-nomothetiki-paremvasi",
    // 47 chars
    seoTitle: "Απόφαση 6/2026 Ολομέλεια Αρείου Πάγου: Funds",
    // 146 chars
    seoDescription:
      "Η Απόφαση 6/2026 Ολομέλειας Αρείου Πάγου δικαιώνει δανειολήπτες Κατσέλη. Ο κίνδυνος τιτλοποιήσεων «Ηρακλής» δεν μετακυλίεται στους πολίτες.",
  },
];

for (const p of patches) {
  const doc = await client.fetch(
    `*[_type == "article" && slug.current == $slug][0]{ _id, title, seoTitle }`,
    { slug: p.slug }
  );

  if (!doc) {
    console.warn(`⚠️  Δεν βρέθηκε: ${p.slug}`);
    continue;
  }

  await client.patch(doc._id).set({
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
  }).commit();

  console.log(`✅  ${doc.title.slice(0, 50)}...`);
  console.log(`    seoTitle (${p.seoTitle.length} chars): ${p.seoTitle}`);
  console.log(`    seoDescription (${p.seoDescription.length} chars): ${p.seoDescription.slice(0, 60)}...`);
}

console.log("\n🎯 Έτοιμο! Οι αλλαγές εφαρμόζονται σε ~1 λεπτό στο Vercel (revalidate=60).");
