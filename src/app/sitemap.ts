import type { MetadataRoute } from "next";
import { getArticles } from "@/sanity/client";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const locales = ["el", "en"] as const;
const staticPaths = [
  "",
  "/about",
  "/practice-areas",
  "/blog",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
];
const practiceAreas = [
  "civil",
  "criminal",
  "commercial",
  "realEstate",
  "labor",
  "administrative",
  "inheritance",
  "tax",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1.0 : 0.7,
    }))
  );

  const areaEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    practiceAreas.map((area) => ({
      url: `${siteUrl}/${locale}/practice-areas/${area}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }))
  );

  let articleEntries: MetadataRoute.Sitemap = [];
  try {
    const articles = await getArticles();
    articleEntries = locales.flatMap((locale) =>
      articles.map((article: { slug: { current: string }; publishedAt?: string }) => ({
        url: `${siteUrl}/${locale}/blog/${article.slug.current}`,
        lastModified: article.publishedAt ? new Date(article.publishedAt) : now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }))
    );
  } catch {
    // Sanity unavailable — skip article entries
  }

  return [...staticEntries, ...areaEntries, ...articleEntries];
}
