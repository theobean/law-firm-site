"use client";

import { Link } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, Gavel, Building2 } from "lucide-react";

export default function AuctionBanner() {
  const t = useTranslations("auctionBanner");
  const locale = useLocale();

  return (
    <section className="bg-amber-50 border-y border-amber-200">
      <div className="max-w-6xl mx-auto px-6 py-8 grid sm:grid-cols-2 gap-6">

        {/* Πλειστηριασμοί */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-sm bg-accent/15 border border-accent flex items-center justify-center flex-shrink-0 mt-0.5">
            <Gavel className="text-accent" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-accent font-bold text-xs tracking-widest uppercase mb-1">
              {t("eyebrow")}
            </p>
            <p className="font-playfair font-bold text-primary text-base leading-snug mb-1">
              {t("title")}
            </p>
            <p className="text-gray-600 text-sm mb-3">{t("text")}</p>
            <Link
              href={`/${locale}/pleistariasmos`}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-sm transition-colors text-sm"
            >
              {t("cta")} <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Funds */}
        <div className="flex items-start gap-4 sm:border-l sm:border-amber-200 sm:pl-6">
          <div className="w-10 h-10 rounded-sm bg-accent/15 border border-accent flex items-center justify-center flex-shrink-0 mt-0.5">
            <Building2 className="text-accent" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-accent font-bold text-xs tracking-widest uppercase mb-1">
              {t("fundsEyebrow")}
            </p>
            <p className="font-playfair font-bold text-primary text-base leading-snug mb-1">
              {t("fundsTitle")}
            </p>
            <p className="text-gray-600 text-sm mb-3">{t("fundsText")}</p>
            <Link
              href={`/${locale}/funds`}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-sm transition-colors text-sm"
            >
              {t("fundsCta")} <ArrowRight size={14} />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
