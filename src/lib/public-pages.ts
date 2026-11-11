import { getPropertyPurchaseGuide } from "@/app/[locale]/blog/[slug]/propertyPurchaseGuide";
import { routing } from "@/i18n/routing";
import { contentPagePath } from "@/lib/seo";
import { getSitemapDocuments } from "@/sanity/client";

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

export const publicStaticPaths = [...staticPaths, ...practiceAreas.map(area => "/practice-areas/" + area)];

export async function getPublicContentPages() {
  return (await getSitemapDocuments()).flatMap(({ _type, slug, updatedAt }) => {
    if (!slug.trim() || slug === "." || slug === "..") return [];
    const guide = _type === "article" && getPropertyPurchaseGuide(slug, routing.defaultLocale);
    return [{
      locales: guide ? routing.locales : [routing.defaultLocale],
      path: contentPagePath(collections[_type], slug),
      // The guide's translated content is maintained in code, not in the CMS.
      lastModified: !guide && updatedAt ? new Date(updatedAt) : undefined,
    }];
  });
}
