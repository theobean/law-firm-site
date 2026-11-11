import type { MetadataRoute } from "next";
import { getPropertyPurchaseGuide } from "@/app/[locale]/blog/[slug]/propertyPurchaseGuide";
import { routing } from "@/i18n/routing";
import { contentPagePath, localizedPageUrl } from "@/lib/seo";
import { getSitemapDocuments } from "@/sanity/client";

export const revalidate = 3600;

const staticPaths = [
  "",
  "/about",
  "/practice-areas",
  "/practice-areas/realEstate/agora-akinitou-athina",
  "/practice-areas/realEstate/agora-neodmitou",
  "/blog",
  "/blog/prokatavoli-agora-akinitou",
  "/faq",
  "/contact",
  "/media",
  "/decisions",
  "/pleistariasmos",
  "/exodikastikos",
  "/funds",
  "/funds/dovalue",
  "/funds/intrum",
  "/funds/cepal",
  "/funds/qquant",
  // Bank loan pages: hub + retail (idiotes) and business (epicheiriseis) per bank
  "/banks",
  "/banks/eurobank",
  "/banks/eurobank/epicheiriseis",
  "/banks/alpha",
  "/banks/alpha/epicheiriseis",
  "/banks/piraeus",
  "/banks/piraeus/epicheiriseis",
  "/banks/ethniki",
  "/banks/ethniki/epicheiriseis",
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

const collections = {
  article: "blog",
  decision: "decisions",
  interview: "media",
} as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = [...staticPaths, ...practiceAreas.map((area) => `/practice-areas/${area}`)];
  const entries = new Map<string, MetadataRoute.Sitemap[number]>();

  for (const locale of routing.locales) {
    for (const path of paths) {
      const url = localizedPageUrl(locale, path);
      entries.set(url, { url });
    }
  }

  for (const { _type, slug, updatedAt } of await getSitemapDocuments()) {
    if (!slug.trim() || slug === "." || slug === "..") continue;

    const guide = _type === "article" && getPropertyPurchaseGuide(slug, routing.defaultLocale);
    const locales = guide ? routing.locales : [routing.defaultLocale];
    const path = contentPagePath(collections[_type], slug);
    // The guide's translated content is maintained in code, not in the CMS.
    const lastModified = !guide && updatedAt ? new Date(updatedAt) : undefined;

    for (const locale of locales) {
      const url = localizedPageUrl(locale, path);
      if (entries.has(url)) continue;
      entries.set(url, {
        url,
        ...(lastModified && Number.isFinite(lastModified.getTime()) ? { lastModified } : {}),
      });
    }
  }

  return [...entries.values()];
}
