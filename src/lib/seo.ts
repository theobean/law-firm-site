export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ioannispapaioannou.lawyer";

const ogLocaleMap: Record<string, string> = { el: "el_GR", en: "en_US", de: "de_DE" };

// must mirror seo.siteName in messages/*.json — buildPageMeta is sync, so we
// can't read translations here
const siteNames: Record<string, string> = {
  el: "Παπαϊωάννου & Συνεργάτες",
  en: "Papaioannou & Associates",
  de: "Papaioannou & Partner",
};

function cleanPath(path: string) {
  return path === "" ? "" : path.startsWith("/") ? path : `/${path}`;
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
  const p = cleanPath(path);
  const canonical = `${siteUrl}/${locale}${p}`;
  return {
    alternates: {
      canonical,
      languages: {
        el: `${siteUrl}/el${p}`,
        en: `${siteUrl}/en${p}`,
        de: `${siteUrl}/de${p}`,
        "x-default": `${siteUrl}/el${p}`,
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
