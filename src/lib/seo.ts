const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ioannispapaioannou.lawyer";

function cleanPath(path: string) {
  return path === "" ? "" : path.startsWith("/") ? path : `/${path}`;
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
    openGraph: { url: canonical },
  };
}

// backward compat for funds/pleistariasmos
export const buildAlternates = (locale: string, path: string) =>
  buildPageMeta(locale, path).alternates;
