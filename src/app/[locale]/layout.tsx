import type { Metadata } from "next";
import { Inter, Jost } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getMessages, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import UrgentCTABar from "@/components/UrgentCTABar";
import ScrollToTop from "@/components/ScrollToTop";
import "../globals.css";

const inter = Inter({ subsets: ["latin", "greek"], variable: "--font-inter" });
const jost = Jost({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-playfair",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ioannispapaioannou.lawyer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  const isEl = locale === "el";

  const ogLocaleMap: Record<string, string> = { el: "el_GR", en: "en_US", de: "de_DE" };
  const ogLocale = ogLocaleMap[locale] ?? "el_GR";
  const ogAlternateLocale = Object.entries(ogLocaleMap)
    .filter(([k]) => k !== locale)
    .map(([, v]) => v);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("defaultTitle"),
      template: `%s | ${t("siteName")}`,
    },
    description: t("defaultDescription"),
    ...(isEl && { authors: [{ name: "Ιωάννης Παπαϊωάννου" }] }),
    alternates: {
      languages: {
        el: "/el",
        en: "/en",
        de: "/de",
        "x-default": "/el",
      },
    },
    openGraph: {
      type: "website",
      locale: ogLocale,
      alternateLocale: ogAlternateLocale,
      url: `${siteUrl}/${locale}`,
      siteName: t("siteName"),
      title: t("defaultTitle"),
      description: t("defaultDescription"),
      images: [{ url: "/δικηγορος.png", width: 1200, height: 630, alt: t("siteName") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("defaultTitle"),
      description: t("defaultDescription"),
      images: ["/δικηγορος.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    ...(isEl && {
      other: {
        "geo.region": "GR-B",
        "geo.placename": "Θεσσαλονίκη",
        "geo.position": "40.6401;22.9444",
        "ICBM": "40.6401, 22.9444",
        "revisit-after": "7 days",
        "rating": "general",
        "language": "Greek",
      },
    }),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "seo" });

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Ιωάννης Παπαϊωάννου – Δικηγόρος Πλειστηριασμών Θεσσαλονίκη",
    alternateName: "Παπαϊωάννου – Λιάμος & Συνεργάτες",
    url: `${siteUrl}/${locale}`,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["LegalService", "LocalBusiness"],
    name: "Παπαϊωάννου Ι. – Λιάμος Γ. & Συνεργάτες",
    alternateName: [
      "Παπαιωάννου δικηγόρος",
      "Παπαϊωάννου δικηγόρος",
      "Παπαιωαννου δικηγορος",
      "Ioannis Papaioannou Lawyer",
      "Papaioannou Lawyer Thessaloniki",
    ],
    description: "Δικηγορικό γραφείο στη Θεσσαλονίκη με εξειδίκευση σε πλειστηριασμούς, ανακοπές, αναστολές κατασχέσεων και τραπεζικό δίκαιο.",
    url: `${siteUrl}/${locale}`,
    telephone: "+302310545261",
    email: "iopapaio@gmail.com",
    image: `${siteUrl}/δικηγορος.png`,
    foundingDate: "2000",
    priceRange: "€€",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Λέοντος Σοφού 12",
      addressLocality: "Θεσσαλονίκη",
      postalCode: "54625",
      addressCountry: "GR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 40.6372647,
      longitude: 22.9371058,
    },
    hasMap: "https://maps.google.com/?cid=10350029232005631470",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:00",
    },
    areaServed: { "@type": "City", name: "Θεσσαλονίκη" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Νομικές Υπηρεσίες",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Ανακοπή Πλειστηριασμού" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Αναστολή Πλειστηριασμού" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Ακύρωση Κατάσχεσης" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Εξωδικαστικός Μηχανισμός" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Τραπεζικό Δίκαιο" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Ανακοπή Διαταγής Πληρωμής" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Αντιμετώπιση Funds & NPL" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Διαπραγμάτευση με Funds" } },
      ],
    },
    sameAs: [
      "https://www.facebook.com/ioannis.papaioannou.94",
      "https://maps.google.com/?cid=10350029232005631470",
    ],
  };

  return (
    <html lang={locale} className={`${inter.variable} ${jost.variable}`}>
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieBanner />
          <UrgentCTABar />
          <ScrollToTop />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
