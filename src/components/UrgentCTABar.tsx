"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { X, ArrowRight } from "lucide-react";

const SESSION_KEY = "urgent-cta-dismissed";

export default function UrgentCTABar() {
  const t = useTranslations("urgentCta");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      // Small delay so it slides in after page load
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, "1");
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-primary border-t-2 border-accent shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">

          {/* Accent line */}
          <div className="hidden sm:block w-1 self-stretch bg-accent rounded-full flex-shrink-0" />

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-snug">
              {t("text")}
            </p>
            <p className="text-white/60 text-xs mt-0.5 leading-snug">
              {t("sub")}
            </p>
          </div>

          {/* CTA button */}
          <Link
            href={`/${locale}/contact`}
            onClick={dismiss}
            className="flex-shrink-0 flex items-center gap-1.5 bg-accent text-primary text-xs font-bold tracking-wide uppercase px-4 py-2.5 rounded-sm hover:bg-accent/90 transition-colors whitespace-nowrap"
          >
            {t("cta")}
            <ArrowRight size={13} />
          </Link>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            aria-label="Κλείσιμο"
            className="flex-shrink-0 text-white/40 hover:text-white/80 transition-colors p-1"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
