import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, AlertTriangle, Clock } from "lucide-react";
import { use } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import FaqAccordion from "@/components/FaqAccordion";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ioannispapaioannou.lawyer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pleistariasmos" });
  return {
    title: t("seoTitle"),
    description: t("seoDescription"),
    alternates: {
      canonical: `${siteUrl}/${locale}/pleistariasmos`,
      languages: {
        el: `${siteUrl}/el/pleistariasmos`,
        en: `${siteUrl}/en/pleistariasmos`,
        de: `${siteUrl}/de/pleistariasmos`,
        "x-default": `${siteUrl}/el/pleistariasmos`,
      },
    },
  };
}

export default function PleistariasmoiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const t = useTranslations("pleistariasmos");

  const services = t.raw("services") as string[];
  const whyItems = t.raw("whyItems") as string[];
  const faqItems = t.raw("faq") as { q: string; a: string }[];
  const options = t.raw("options") as { title: string; desc: string }[];
  const timelineItems = t.raw("timelineItems") as { phase: string; title: string; desc: string }[];

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

        {/* What is + Services */}
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

        {/* 4 Νομικές Επιλογές */}
        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="text-2xl font-playfair font-bold text-primary mb-8 border-l-4 border-accent pl-4">
            {t("optionsTitle")}
          </h2>
          <div className="grid sm:grid-cols-2 gap-5 mb-16">
            {options.map((opt, i) => (
              <div key={i} className="border border-gray-200 rounded-sm p-6 hover:border-accent/40 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <h3 className="font-playfair font-semibold text-primary text-base leading-snug">
                    {opt.title}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{opt.desc}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Inline CTA */}
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

        {/* Χρονοδιάγραμμα */}
        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="text-2xl font-playfair font-bold text-primary mb-8 border-l-4 border-accent pl-4">
            {t("timelineTitle")}
          </h2>
          <div className="relative mb-16">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-accent/20 hidden sm:block" />
            <div className="space-y-6">
              {timelineItems.map((item, i) => (
                <div key={i} className="sm:pl-12 relative">
                  <div className="hidden sm:flex absolute left-0 top-1 w-8 h-8 rounded-full bg-primary text-white items-center justify-center flex-shrink-0">
                    <Clock size={14} />
                  </div>
                  <p className="text-accent font-semibold text-xs tracking-widest uppercase mb-1">{item.phase}</p>
                  <h3 className="font-playfair font-bold text-primary text-lg mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Urgency box */}
        <ScrollReveal direction="up" delay={0.1}>
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-6 flex gap-4 mb-16">
            <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={22} />
            <div>
              <p className="font-semibold text-amber-900 mb-1">{t("urgencyTitle")}</p>
              <p className="text-amber-800 text-sm leading-relaxed">{t("urgencyText")}</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Why us */}
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

        {/* FAQ */}
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
