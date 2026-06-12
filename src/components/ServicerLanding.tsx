import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, Check, AlertTriangle, Clock, Phone, Scale } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import FaqAccordion from "@/components/FaqAccordion";
import ServicerDecisions from "@/components/ServicerDecisions";

/**
 * Shared landing-page body for servicer-specific SEO pages
 * (/funds/dovalue, /funds/intrum, ...). The namespace must provide the
 * full key set used below — all three locales, or the page crashes.
 */
export default function ServicerLanding({
  locale,
  namespace,
}: {
  locale: string;
  namespace: string;
}) {
  const t = useTranslations(namespace);

  const deadlines = t.raw("deadlines") as { title: string; desc: string }[];
  const negotiationPoints = t.raw("negotiationPoints") as string[];
  const anakopiPoints = t.raw("anakopiPoints") as string[];
  const faqItems = t.raw("faq") as { q: string; a: string }[];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero — H1 */}
      <section className="bg-primary py-24 text-white">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-accent font-semibold tracking-widest text-sm uppercase mb-3">
            {t("heroCity")}
          </p>
          <div className="border-l-4 border-accent pl-6">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold leading-tight">
              {t("heroTitle")}
            </h1>
            <p className="text-white/70 text-xl mt-3">{t("heroSubtitle")}</p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16">
        <ScrollReveal direction="up" delay={0}>
          <p className="text-gray-700 text-lg leading-relaxed mb-12">{t("intro")}</p>
        </ScrollReveal>

        {/* What is the servicer */}
        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="text-2xl font-playfair font-bold text-primary mb-6 border-l-4 border-accent pl-4">
            {t("whatTitle")}
          </h2>
          <p className="text-gray-600 leading-relaxed mb-16">{t("whatText")}</p>
        </ScrollReveal>

        {/* H2: Protection of primary residence */}
        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="text-2xl font-playfair font-bold text-primary mb-6 border-l-4 border-accent pl-4">
            {t("protectTitle")}
          </h2>
          <p className="text-gray-600 leading-relaxed mb-16">{t("protectText")}</p>
        </ScrollReveal>

        {/* H3: Deadlines */}
        <ScrollReveal direction="up" delay={0.1}>
          <h3 className="text-xl font-playfair font-bold text-primary mb-4 border-l-4 border-accent pl-4">
            {t("deadlinesTitle")}
          </h3>
          <p className="text-gray-600 leading-relaxed mb-8">{t("deadlinesIntro")}</p>
          <div className="grid sm:grid-cols-3 gap-5 mb-8">
            {deadlines.map((d, i) => (
              <div key={i} className="border border-gray-200 rounded-sm p-6 hover:border-accent/40 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mb-4">
                  <Clock size={14} />
                </div>
                <h4 className="font-playfair font-semibold text-primary text-base leading-snug mb-2">
                  {d.title}
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-6 flex gap-4 mb-12">
            <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={22} />
            <p className="text-amber-800 text-sm leading-relaxed font-medium">{t("deadlinesWarning")}</p>
          </div>
        </ScrollReveal>

        {/* Inline CTA 1 */}
        <ScrollReveal direction="up" delay={0.1}>
          <div className="bg-primary/5 border border-primary/10 rounded-sm p-8 mb-16">
            <p className="text-primary font-playfair text-xl font-semibold mb-2">{t("cta1Title")}</p>
            <p className="text-gray-600 text-sm mb-5">{t("cta1Text")}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/${locale}/contact`}
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-6 py-3 rounded-sm transition-colors text-sm"
              >
                {t("ctaButton")} <ArrowRight size={16} />
              </Link>
              <a
                href="tel:+302310545261"
                className="inline-flex items-center gap-2 border border-primary/20 hover:border-accent text-primary font-semibold px-6 py-3 rounded-sm transition-colors text-sm"
              >
                <Phone size={16} /> {t("ctaPhone")}
              </a>
            </div>
          </div>
        </ScrollReveal>

        {/* H3: Negotiation */}
        <ScrollReveal direction="up" delay={0.1}>
          <h3 className="text-xl font-playfair font-bold text-primary mb-4 border-l-4 border-accent pl-4">
            {t("negotiationTitle")}
          </h3>
          <p className="text-gray-600 leading-relaxed mb-6">{t("negotiationIntro")}</p>
          <ul className="space-y-4 mb-6">
            {negotiationPoints.map((p, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-700">
                <div className="mt-1 w-5 h-5 rounded-full bg-accent/15 border border-accent flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-accent" strokeWidth={3} />
                </div>
                <span className="leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
          <p className="text-primary font-medium leading-relaxed mb-12">{t("negotiationOutro")}</p>
        </ScrollReveal>

        {/* Inline CTA 2 */}
        <ScrollReveal direction="up" delay={0.1}>
          <div className="bg-primary/5 border border-primary/10 rounded-sm p-8 mb-16">
            <p className="text-primary font-playfair text-xl font-semibold mb-2">{t("cta2Title")}</p>
            <p className="text-gray-600 text-sm mb-5">{t("cta2Text")}</p>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-6 py-3 rounded-sm transition-colors text-sm"
            >
              {t("ctaButton")} <ArrowRight size={16} />
            </Link>
          </div>
        </ScrollReveal>

        {/* H3: Objection / suspension */}
        <ScrollReveal direction="up" delay={0.1}>
          <h3 className="text-xl font-playfair font-bold text-primary mb-4 border-l-4 border-accent pl-4">
            {t("anakopiTitle")}
          </h3>
          <p className="text-gray-600 leading-relaxed mb-6">{t("anakopiText1")}</p>
          <ul className="space-y-4 mb-6">
            {anakopiPoints.map((p, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-700">
                <div className="mt-1 w-5 h-5 rounded-full bg-accent/15 border border-accent flex items-center justify-center flex-shrink-0">
                  <Scale size={11} className="text-accent" strokeWidth={2.5} />
                </div>
                <span className="leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
          <p className="text-gray-600 leading-relaxed mb-16">{t("anakopiText2")}</p>
        </ScrollReveal>

        {/* Related decisions */}
        <ScrollReveal direction="up" delay={0.1}>
          <ServicerDecisions locale={locale} />
        </ScrollReveal>

        {/* FAQ */}
        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="text-2xl font-playfair font-bold text-primary mb-6 border-l-4 border-accent pl-4">
            {t("faqTitle")}
          </h2>
          <FaqAccordion items={faqItems} />
        </ScrollReveal>
      </section>

      {/* Final CTA */}
      <section className="bg-primary py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-playfair font-bold text-white mb-4">{t("ctaTitle")}</h2>
          <p className="text-white/70 mb-8">{t("ctaText")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-4 rounded-sm transition-colors"
            >
              {t("ctaButton")} <ArrowRight size={18} />
            </Link>
            <a
              href="tel:+302310545261"
              className="inline-flex items-center gap-2 border border-white/30 hover:border-accent text-white font-semibold px-8 py-4 rounded-sm transition-colors"
            >
              <Phone size={18} /> {t("ctaPhone")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
