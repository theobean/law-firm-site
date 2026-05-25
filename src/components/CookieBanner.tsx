"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useTranslations, useLocale } from "next-intl";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "cookieConsent";
const GA_ID = "G-HFKWE6YF77";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export default function CookieBanner() {
  const t = useTranslations("cookies");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      setVisible(true);
    } else if (consent === "accepted") {
      setConsented(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
    setConsented(true);
  }

  return (
    <>
      {consented && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
        </>
      )}

      {visible && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-50 bg-primary text-white rounded-sm shadow-2xl border border-accent/30 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-accent" />
          <div className="p-5 pr-12 relative">
            <button
              onClick={accept}
              aria-label="Close"
              className="absolute top-3 right-3 text-white/50 hover:text-white"
            >
              <X size={18} />
            </button>
            <div className="flex items-start gap-3 mb-4">
              <Cookie className="text-accent flex-shrink-0 mt-1" size={20} />
              <p className="text-sm leading-relaxed text-white/80">{t("message")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                onClick={accept}
                className="bg-accent hover:bg-accent/90 text-white text-sm font-semibold px-5 py-2 rounded-sm transition-colors"
              >
                {t("accept")}
              </button>
              <Link
                href={`/${locale}/privacy`}
                className="text-white/60 hover:text-accent text-xs underline"
              >
                {t("learnMore")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
