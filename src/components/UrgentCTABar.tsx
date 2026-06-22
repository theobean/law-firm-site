"use client";

import { useState, useEffect } from "react";
import { Link } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";
import { X, ArrowRight, AlertTriangle } from "lucide-react";

const SESSION_KEY = "urgent-cta-dismissed";

export default function UrgentCTABar() {
  const t = useTranslations("urgentCta");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
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
      className={`overflow-hidden transition-[max-height] duration-500 ease-out ${
        visible ? "max-h-60" : "max-h-0"
      }`}
    >
      <div className="bg-primary border-t-2 border-accent shadow-2xl">

        {/* ── MOBILE layout ── */}
        <div className="sm:hidden px-3 pt-2.5 pb-3 relative">
          <button
            onClick={dismiss}
            aria-label="Κλείσιμο"
            className="absolute top-1.5 right-1.5 text-white/40 hover:text-white/80 transition-colors p-1.5"
          >
            <X size={14} />
          </button>
          <div className="flex items-start gap-2 mb-2 pr-7">
            <AlertTriangle size={16} className="text-accent flex-shrink-0 mt-0.5" />
            <p className="text-white text-[12.5px] leading-snug font-medium">{t("text")}</p>
          </div>
          <Link
            href={`/contact`}
            onClick={dismiss}
            className="flex items-center justify-center gap-1.5 bg-accent text-primary text-xs font-bold tracking-wide uppercase px-3 py-2.5 rounded-sm hover:bg-accent/90 transition-colors w-full"
          >
            {t("cta")}
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* ── DESKTOP layout ── */}
        <div className="hidden sm:flex max-w-6xl mx-auto px-4 py-3 items-center gap-4">
          <div className="w-1 self-stretch bg-accent rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-snug">{t("text")}</p>
            <p className="text-white/60 text-xs mt-0.5 leading-snug">{t("sub")}</p>
          </div>
          <Link
            href={`/contact`}
            onClick={dismiss}
            className="flex-shrink-0 flex items-center gap-1.5 bg-accent text-primary text-xs font-bold tracking-wide uppercase px-4 py-2.5 rounded-sm hover:bg-accent/90 transition-colors whitespace-nowrap"
          >
            {t("cta")}
            <ArrowRight size={13} />
          </Link>
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
