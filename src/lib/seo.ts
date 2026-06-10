const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ioannispapaioannou.lawyer";

export function buildAlternates(locale: string, path: string) {
  const cleanPath = path === "" ? "" : path.startsWith("/") ? path : `/${path}`;
  return {
    canonical: `${siteUrl}/${locale}${cleanPath}`,
    languages: {
      el: `${siteUrl}/el${cleanPath}`,
      en: `${siteUrl}/en${cleanPath}`,
      de: `${siteUrl}/de${cleanPath}`,
      "x-default": `${siteUrl}/el${cleanPath}`,
    },
  };
}
