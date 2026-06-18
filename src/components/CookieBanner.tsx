"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "cookieConsent";
const GA_ID = "G-TE25ZYG8WM";
const REOPEN_EVENT = "cookie-banner:reopen";

declare global {
  interface Window {
    dataLayer: unknown[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag: (...args: any[]) => void;
  }
}

function loadGoogleAnalytics() {
  if (typeof window === "undefined") return;
  if (document.getElementById("ga-script-src")) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);

  const script = document.createElement("script");
  script.id = "ga-script-src";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

function purgeAnalyticsCookies() {
  if (typeof document === "undefined") return;
  const host = window.location.hostname;
  const rootDomain = host.split(".").slice(-2).join(".");
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    if (name.startsWith("_ga") || name === "_gid" || name === "_gat") {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${host}`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${rootDomain}`;
    }
  });
}

export default function CookieBanner() {
  const t = useTranslations("cookies");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      setVisible(true);
    } else if (consent === "accepted") {
      loadGoogleAnalytics();
    }

    const onReopen = () => setVisible(true);
    window.addEventListener(REOPEN_EVENT, onReopen);
    return () => window.removeEventListener(REOPEN_EVENT, onReopen);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
    loadGoogleAnalytics();
  }

  function reject() {
    localStorage.setItem(STORAGE_KEY, "rejected");
    setVisible(false);
    purgeAnalyticsCookies();
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-50 bg-primary text-white rounded-sm shadow-2xl border border-accent/30 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-accent" />
      <div className="p-5 relative">
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
          <button
            onClick={reject}
            className="border border-white/30 hover:border-white/60 text-white text-sm font-semibold px-5 py-2 rounded-sm transition-colors"
          >
            {t("reject")}
          </button>
          <Link
            href={`/${locale}/privacy`}
            className="text-white/60 hover:text-accent text-xs underline ml-auto"
          >
            {t("learnMore")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function openCookieSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(REOPEN_EVENT));
}
