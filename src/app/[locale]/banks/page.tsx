import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/navigation";
import { buildPageMeta } from "@/lib/seo";
import { ArrowRight, AlertTriangle, Landmark } from "lucide-react";
import { use } from "react";
import ScrollReveal from "@/components/ScrollReveal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "banks" });
  return {
    title: t("seoTitle"),
    description: t("seoDescription"),
    ...buildPageMeta(locale, "/banks"),
  };
}

export default function BanksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const t = useTranslations("banks");

  const cards = t.raw("cards") as { slug: string; name: string; desc: string }[];

  return (
    <div className="bg-white">
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

        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="text-2xl font-playfair font-bold text-primary mb-6 border-l-4 border-accent pl-4">
            {t("cardsTitle")}
          </h2>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 gap-5 mb-16">
          {cards.map((c, i) => (
            <ScrollReveal key={c.slug} direction="up" delay={0.1 + i * 0.05}>
              <Link
                href={`/banks/${c.slug}`}
                className="group block h-full border border-gray-200 hover:border-accent/50 rounded-sm p-6 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                    <Landmark size={16} />
                  </div>
                  <h3 className="font-playfair font-bold text-primary text-lg">{c.name}</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{c.desc}</p>
                <span className="inline-flex items-center gap-2 text-accent font-semibold text-sm group-hover:gap-3 transition-all">
                  {t("cardCta")} <ArrowRight size={15} />
                </span>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal direction="up" delay={0.1}>
          <div className="border border-accent/30 bg-accent/5 rounded-sm p-6 mb-12">
            <p className="text-primary font-playfair text-lg font-semibold mb-1">{t("servicersNoteTitle")}</p>
            <p className="text-gray-600 text-sm mb-4">{t("servicersNoteText")}</p>
            <Link
              href={`/funds`}
              className="inline-flex items-center gap-2 text-accent font-semibold text-sm hover:gap-3 transition-all"
            >
              {t("servicersNoteCta")} <ArrowRight size={16} />
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.1}>
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-6 flex gap-4 mb-12">
            <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={22} />
            <div>
              <p className="font-semibold text-amber-900 mb-1">{t("urgencyTitle")}</p>
              <p className="text-amber-800 text-sm leading-relaxed">{t("urgencyText")}</p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <section className="bg-primary py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-playfair font-bold text-white mb-4">{t("ctaTitle")}</h2>
          <p className="text-white/70 mb-8">{t("ctaText")}</p>
          <Link
            href={`/contact`}
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-4 rounded-sm transition-colors"
          >
            {t("ctaButton")} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
