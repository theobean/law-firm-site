import type { Metadata } from "next";
import { Inter, Jost } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getMessages, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import "../globals.css";

const inter = Inter({ subsets: ["latin", "greek"], variable: "--font-inter" });
const jost = Jost({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-playfair",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("defaultTitle"),
      template: `%s | ${t("siteName")}`,
    },
    description: t("defaultDescription"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        el: "/el",
        en: "/en",
        "x-default": "/el",
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "el" ? "el_GR" : "en_US",
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
    robots: { index: true, follow: true },
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: t("siteName"),
    url: `${siteUrl}/${locale}`,
    telephone: "+30 2310 545 261",
    email: "iopapaio@gmail.com",
    image: `${siteUrl}/δικηγορος.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Λέοντος του Σοφού 12",
      addressLocality: "Θεσσαλονίκη",
      postalCode: "54625",
      addressCountry: "GR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 40.6401,
      longitude: 22.9444,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "19:00",
    },
    areaServed: { "@type": "Country", name: "GR" },
    priceRange: "€€",
  };

  return (
    <html lang={locale} className={`${inter.variable} ${jost.variable}`}>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-HFKWE6YF77" />
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-HFKWE6YF77');
        `}} />
      </head>
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
