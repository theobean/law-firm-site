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

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID || "hwu5yvsr",
  dataset: env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: env.SANITY_API_TOKEN,
  useCdn: false,
});

const interviews = await client.fetch(
  `*[_type == "interview"] | order(date desc) { _id, title, slug, show, date, description }`
);

console.log(`\n${interviews.length} interviews:\n`);
for (const iv of interviews) {
  console.log(`📺 ${iv.title}`);
  console.log(`   slug: ${iv.slug?.current}`);
  console.log(`   show: ${iv.show || "(none)"} | date: ${iv.date || "(none)"}`);
  console.log(`   description: ${iv.description ? iv.description.slice(0, 150) + "..." : "(EMPTY)"}`);
  console.log("");
}
