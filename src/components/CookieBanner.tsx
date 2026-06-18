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
    <div className="fixed inset-x-0 bottom-0 z-50 bg-primary/95 backdrop-blur-md text-white border-t border-accent/40 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
      <div className="max-w-6xl mx-auto px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">

          {/* Left: icon + text */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="hidden md:flex w-10 h-10 rounded-full bg-accent/15 items-center justify-center flex-shrink-0">
              <Cookie className="text-accent" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] md:text-[13.5px] leading-relaxed text-white/85">
                {t("message")}{" "}
                <Link
                  href={`/${locale}/privacy`}
                  className="text-accent/90 hover:text-accent underline underline-offset-2"
                >
                  {t("learnMore")}
                </Link>
              </p>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={reject}
              className="text-white/75 hover:text-white text-[13px] font-medium px-4 py-2 border border-white/20 hover:border-white/40 rounded-sm transition-colors whitespace-nowrap"
            >
              {t("reject")}
            </button>
            <button
              onClick={accept}
              className="bg-accent hover:bg-accent/90 text-primary text-[13px] font-semibold px-5 py-2 rounded-sm transition-colors whitespace-nowrap"
            >
              {t("accept")}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export function openCookieSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(REOPEN_EVENT));
}
