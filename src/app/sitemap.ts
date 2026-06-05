import type { MetadataRoute } from "next";
import { getArticles, getDecisions, getInterviews } from "@/sanity/client";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ioannispapaioannou.lawyer";
const locales = ["el", "en", "de"] as const;
const staticPaths = [
  "",
  "/about",
  "/practice-areas",
  "/blog",
  "/faq",
  "/contact",
  "/media",
  "/decisions",
  "/privacy",
  "/terms",
  "/pleistariasmos",
  "/funds",
];
const practiceAreas = [
  "banking",
  "extrajudicial",
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
      (articles ?? [])
        .filter((a: { slug?: { current?: string } }) => a.slug?.current)
        .map((article: { slug: { current: string }; publishedAt?: string }) => ({
          url: `${siteUrl}/${locale}/blog/${article.slug.current}`,
          lastModified: article.publishedAt ? new Date(article.publishedAt) : now,
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }))
    );
  } catch {
    // Sanity unavailable — skip
  }

  let decisionEntries: MetadataRoute.Sitemap = [];
  try {
    const decisions = await getDecisions();
    decisionEntries = locales.flatMap((locale) =>
      (decisions ?? [])
        .filter((d: { slug?: { current?: string } }) => d.slug?.current)
        .map((d: { slug: { current: string }; date?: string }) => ({
          url: `${siteUrl}/${locale}/decisions/${d.slug.current}`,
          lastModified: d.date ? new Date(d.date) : now,
          changeFrequency: "yearly" as const,
          priority: 0.7,
        }))
    );
  } catch {
    // Sanity unavailable — skip
  }

  let interviewEntries: MetadataRoute.Sitemap = [];
  try {
    const interviews = await getInterviews();
    interviewEntries = locales.flatMap((locale) =>
      (interviews ?? [])
        .filter((i: { slug?: { current?: string } }) => i.slug?.current)
        .map((i: { slug: { current: string }; date?: string }) => ({
          url: `${siteUrl}/${locale}/media/${i.slug.current}`,
          lastModified: i.date ? new Date(i.date) : now,
          changeFrequency: "yearly" as const,
          priority: 0.6,
        }))
    );
  } catch {
    // Sanity unavailable — skip
  }

  return [...staticEntries, ...areaEntries, ...articleEntries, ...decisionEntries, ...interviewEntries];
}
