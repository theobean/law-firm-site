import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getPublicContentPages, publicStaticPaths } from "@/lib/public-pages";
import { localizedPageUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = new Map<string, MetadataRoute.Sitemap[number]>();

  for (const locale of routing.locales) {
    for (const path of publicStaticPaths) {
      const url = localizedPageUrl(locale, path);
      entries.set(url, { url });
    }
  }

  for (const { locales, path, lastModified } of await getPublicContentPages()) {
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
