"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, Gavel } from "lucide-react";

export default function AuctionBanner() {
  const t = useTranslations("auctionBanner");
  const locale = useLocale();

  return (
    <section className="bg-amber-50 border-y border-amber-200">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className="w-11 h-11 rounded-sm bg-accent/15 border border-accent flex items-center justify-center flex-shrink-0 mt-0.5">
            <Gavel className="text-accent" size={20} />
          </div>
          <div>
            <p className="text-accent font-bold text-xs tracking-widest uppercase mb-1">
              {t("eyebrow")}
            </p>
            <p className="text-lg font-playfair font-bold text-primary leading-snug">
              {t("title")}
            </p>
            <p className="text-gray-600 text-sm mt-1">{t("text")}</p>
          </div>
        </div>
        <Link
          href={`/${locale}/pleistariasmos`}
          className="whitespace-nowrap inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-sm transition-colors text-sm flex-shrink-0"
        >
          {t("cta")} <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
