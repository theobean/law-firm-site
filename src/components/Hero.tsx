import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  const t = useTranslations("hero");
  const locale = useLocale();

  return (
    <section className="relative min-h-[90vh] flex items-center bg-primary overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
          backgroundSize: "20px 20px"
        }} />
      </div>

      {/* Accent line */}
      <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-accent" />

      <div className="relative max-w-6xl mx-auto px-6 py-32 grid md:grid-cols-2 gap-16 items-center">
        {/* Text */}
        <div>
          <div className="border-l-4 border-accent pl-6 mb-8">
            <h1 className="font-playfair font-bold text-4xl md:text-4xl lg:text-5xl 2xl:text-6xl text-white leading-tight uppercase whitespace-nowrap">
              {t("tagline")}
              <br />
              <span className="text-accent">{t("tagline2")}</span>
            </h1>
          </div>
          <p className="text-white/70 text-lg md:text-xl leading-relaxed mb-10 max-w-lg">
            {t("subtitle")}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-4 rounded-sm transition-colors"
            >
              {t("cta")} <ArrowRight size={18} />
            </Link>
            <Link
              href={`/${locale}/about`}
              className="inline-flex items-center gap-2 border border-white/30 hover:border-accent text-white hover:text-accent font-semibold px-8 py-4 rounded-sm transition-colors"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>

        {/* Why us card */}
        <div className="hidden md:block">
          <div className="relative">
            <div className="bg-white/5 border border-white/10 rounded-sm p-10 backdrop-blur-sm">
              <p className="text-accent text-xs font-bold tracking-widest uppercase mb-6">{t("whyUs")}</p>
              <div className="space-y-5">
                {[
                  { text: t("why1") },
                  { text: t("why2") },
                  { text: t("why3") },
                  { text: t("why4") },
                ].map(({ text }) => (
                  <div key={text} className="flex items-start gap-4 border-b border-white/10 pb-5 last:border-0 last:pb-0">
                    <div className="w-5 h-5 rounded-full bg-accent/20 border border-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                        <path d="M2 6l3 3 5-5" stroke="#c8922a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-white/80 text-sm leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -top-3 -right-3 w-full h-full border border-accent/30 rounded-sm -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
