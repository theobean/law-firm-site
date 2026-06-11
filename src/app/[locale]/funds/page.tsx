import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMeta } from "@/lib/seo";
import { ArrowRight, Check, AlertTriangle } from "lucide-react";
import { use } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import FaqAccordion from "@/components/FaqAccordion";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "funds" });
  return {
    title: t("seoTitle"),
    description: t("seoDescription"),
    ...buildPageMeta(locale, "/funds"),
  };
}

export default function FundsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const t = useTranslations("funds");

  const services = t.raw("services") as string[];
  const whyItems = t.raw("whyItems") as string[];
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
          <p className="text-gray-700 text-lg leading-relaxed mb-12">
            {t("intro")}
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <ScrollReveal direction="left" delay={0.1}>
            <h2 className="text-2xl font-playfair font-bold text-primary mb-6 border-l-4 border-accent pl-4">
              {t("whatTitle")}
            </h2>
            <p className="text-gray-600 leading-relaxed">{t("whatText")}</p>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={0.2}>
            <h2 className="text-2xl font-playfair font-bold text-primary mb-6 border-l-4 border-accent pl-4">
              {t("servicesTitle")}
            </h2>
            <ul className="space-y-3">
              {services.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700">
                  <div className="mt-1 w-5 h-5 rounded-full bg-accent/15 border border-accent flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-accent" strokeWidth={3} />
                  </div>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>

        <ScrollReveal direction="up" delay={0.1}>
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-6 flex gap-4 mb-12">
            <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={22} />
            <div>
              <p className="font-semibold text-amber-900 mb-1">{t("urgencyTitle")}</p>
              <p className="text-amber-800 text-sm leading-relaxed">{t("urgencyText")}</p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.1}>
          <div className="border border-accent/30 bg-accent/5 rounded-sm p-6 mb-12">
            <p className="text-primary font-playfair text-lg font-semibold mb-1">{t("servicersLinkTitle")}</p>
            <p className="text-gray-600 text-sm mb-4">{t("servicersLinkText")}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-8">
              <Link
                href={`/${locale}/funds/dovalue`}
                className="inline-flex items-center gap-2 text-accent font-semibold text-sm hover:gap-3 transition-all"
              >
                {t("dovalueLinkCta")} <ArrowRight size={16} />
              </Link>
              <Link
                href={`/${locale}/funds/intrum`}
                className="inline-flex items-center gap-2 text-accent font-semibold text-sm hover:gap-3 transition-all"
              >
                {t("intrumLinkCta")} <ArrowRight size={16} />
              </Link>
              <Link
                href={`/${locale}/funds/cepal`}
                className="inline-flex items-center gap-2 text-accent font-semibold text-sm hover:gap-3 transition-all"
              >
                {t("cepalLinkCta")} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.1}>
          <div className="bg-primary/5 border border-primary/10 rounded-sm p-8 mb-16">
            <p className="text-primary font-playfair text-xl font-semibold mb-2">{t("ctaInlineTitle")}</p>
            <p className="text-gray-600 text-sm mb-5">{t("ctaInlineText")}</p>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-6 py-3 rounded-sm transition-colors text-sm"
            >
              {t("ctaButton")} <ArrowRight size={16} />
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="text-2xl font-playfair font-bold text-primary mb-6 border-l-4 border-accent pl-4">
            {t("whyTitle")}
          </h2>
          <ul className="grid sm:grid-cols-2 gap-4 mb-16">
            {whyItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-700">
                <div className="mt-1 w-5 h-5 rounded-full bg-accent/15 border border-accent flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-accent" strokeWidth={3} />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="text-2xl font-playfair font-bold text-primary mb-6 border-l-4 border-accent pl-4">
            {t("faqTitle")}
          </h2>
          <FaqAccordion items={faqItems} />
        </ScrollReveal>
      </section>

      <section className="bg-primary py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-playfair font-bold text-white mb-4">
            {t("ctaTitle")}
          </h2>
          <p className="text-white/70 mb-8">{t("ctaText")}</p>
          <Link
            href={`/${locale}/contact`}
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-4 rounded-sm transition-colors"
          >
            {t("ctaButton")} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
