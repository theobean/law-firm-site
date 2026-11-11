import { routing } from "@/i18n/routing";

export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.ioannispapaioannou.lawyer",
).origin;

const ogLocaleMap: Record<string, string> = { el: "el_GR", en: "en_US", de: "de_DE" };

// must mirror seo.siteName in messages/*.json — buildPageMeta is sync, so we
// can't read translations here
const siteNames: Record<string, string> = {
  el: "Παπαϊωάννου & Συνεργάτες",
  en: "Papaioannou & Associates",
  de: "Papaioannou & Partner",
};

export function localizedPageUrl(locale: string, path: string) {
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");
  return new URL(`/${locale}${trimmedPath ? `/${trimmedPath}` : ""}`, siteUrl).href;
}

export function contentPagePath(collection: "blog" | "decisions" | "media", slug: string) {
  return `/${collection}/${encodeURIComponent(slug)}`;
}

/**
 * Shared OG fields lost when a page defines its own openGraph (Next.js
 * shallow-merges metadata: a page-level openGraph replaces the layout's
 * entirely). Spread this into any page-level openGraph object.
 */
export function ogDefaults(locale: string) {
  return {
    siteName: siteNames[locale] ?? siteNames.el,
    locale: ogLocaleMap[locale] ?? "el_GR",
    alternateLocale: Object.entries(ogLocaleMap)
      .filter(([k]) => k !== locale)
      .map(([, v]) => v),
  };
}

export function buildPageMeta(locale: string, path: string) {
  const canonical = localizedPageUrl(locale, path);
  return {
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(routing.locales.map((language) => [language, localizedPageUrl(language, path)])),
        "x-default": localizedPageUrl(routing.defaultLocale, path),
      },
    },
    openGraph: {
      ...ogDefaults(locale),
      type: "website" as const,
      url: canonical,
      images: [{ url: "/δικηγορος.jpg", width: 1200, height: 1232 }],
    },
  };
}
