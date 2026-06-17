import { getArticles } from "@/sanity/client";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ioannispapaioannou.lawyer";

// Greek-only feed: Brevo will read this and email subscribers. EL audience is
// the primary target; EN/DE pages exist but aren't the subscription audience.
const FEED_LOCALE = "el";

const FEED_TITLE = "Δικηγορικό Γραφείο Παπαϊωάννου — Άρθρα";
const FEED_DESC = "Νομικές αναλύσεις και ενημερώσεις από το δικηγορικό γραφείο Παπαϊωάννου & Συνεργάτες, στη Θεσσαλονίκη.";

// Escape XML special characters
function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Convert ISO date → RFC 822 (RSS spec)
function rfc822(iso: string | undefined) {
  if (!iso) return new Date().toUTCString();
  return new Date(iso).toUTCString();
}

export const revalidate = 3600; // re-fetch articles at most once per hour

export async function GET() {
  let articles: Array<{
    _id?: string;
    title?: string;
    slug?: { current?: string };
    excerpt?: string;
    publishedAt?: string;
  }> = [];

  try {
    articles = (await getArticles()) ?? [];
  } catch {
    articles = [];
  }

  const items = articles
    .filter((a) => a.slug?.current && a.title)
    .slice(0, 30)
    .map((a) => {
      const url = `${SITE}/${FEED_LOCALE}/blog/${a.slug!.current}`;
      const desc = a.excerpt || a.title || "";
      return `    <item>
      <title>${esc(a.title!)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${rfc822(a.publishedAt)}</pubDate>
      <description>${esc(desc)}</description>
    </item>`;
    })
    .join("\n");

  const lastBuild = articles[0]?.publishedAt ? rfc822(articles[0].publishedAt) : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(FEED_TITLE)}</title>
    <link>${SITE}/${FEED_LOCALE}/blog</link>
    <description>${esc(FEED_DESC)}</description>
    <language>el-gr</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
