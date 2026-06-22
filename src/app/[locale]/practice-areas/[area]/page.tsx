import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMeta } from "@/lib/seo";
import { Link } from "@/navigation";
import { ArrowLeft, ArrowRight, Check, Banknote, Handshake, ShieldCheck, Briefcase, Home, Users, Building2, BookOpen, Receipt, HardHat, Gavel } from "lucide-react";
import { use } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import CategoryArticles from "@/components/CategoryArticles";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; area: string }>;
}): Promise<Metadata> {
  const { locale, area } = await params;
  if (!validAreas.includes(area as AreaKey)) return {};
  const t = await getTranslations({ locale, namespace: "practiceAreas" });
  return {
    title: t(`areas.${area}.title`),
    description: t(`areas.${area}.desc`),
    ...buildPageMeta(locale, `/practice-areas/${area}`),
  };
}

const validAreas = [
  "banking",
  "extrajudicial",
  "criminal",
  "commercial",
  "realEstate",
  "administrative",
  "inheritance",
  "tax",
  "labor",
] as const;

type AreaKey = (typeof validAreas)[number];

const icons: Record<AreaKey, typeof Banknote> = {
  banking: Banknote,
  extrajudicial: Handshake,
  criminal: ShieldCheck,
  commercial: Briefcase,
  realEstate: Home,
  administrative: Building2,
  inheritance: BookOpen,
  tax: Receipt,
  labor: HardHat,
};

export function generateStaticParams() {
  return validAreas.flatMap((area) =>
    ["el", "en"].map((locale) => ({ locale, area }))
  );
}

export default function PracticeAreaDetailPage({
  params,
}: {
  params: Promise<{ locale: string; area: string }>;
}) {
  const { locale, area } = use(params);

  if (!validAreas.includes(area as AreaKey)) notFound();

  const t = useTranslations("practiceAreas");
  const Icon = icons[area as AreaKey];

  const servicesRaw = t.raw(`areas.${area}.services`) as string[];

  return (
    <div className="bg-white">
      <section className="bg-primary py-24 text-white">
        <div className="max-w-4xl mx-auto px-6">
          <Link
            href={`/practice-areas`}
            className="inline-flex items-center gap-2 text-white/60 hover:text-accent text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={14} /> {t("backToAll")}
          </Link>
          <div className="flex items-start gap-6">
            <div className="hidden md:flex w-16 h-16 bg-white/10 border border-accent/40 rounded-sm items-center justify-center flex-shrink-0">
              <Icon className="text-accent" size={32} />
            </div>
            <div className="border-l-4 border-accent pl-6 md:border-l-0 md:pl-0">
              <h1 className="text-4xl md:text-5xl font-playfair font-bold">
                {t(`areas.${area}.title`)}
              </h1>
              <p className="text-white/70 text-xl mt-2">{t(`areas.${area}.desc`)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16">
        <ScrollReveal direction="up" delay={0}>
          <p className="text-gray-700 text-lg leading-relaxed mb-12">
            {t(`areas.${area}.longDesc`)}
          </p>
        </ScrollReveal>

        {(area === "banking" || area === "extrajudicial") && (
          <ScrollReveal direction="up" delay={0.05}>
            <div className="grid sm:grid-cols-2 gap-4 mb-12">
              {area === "banking" && (
                <div className="bg-amber-50 border border-amber-200 rounded-sm p-5 flex flex-col justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-sm bg-accent/15 border border-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Gavel className="text-accent" size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-primary text-sm">{t("pleistariasmosBannerTitle")}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{t("pleistariasmosBannerText")}</p>
                    </div>
                  </div>
                  <Link
                    href={`/pleistariasmos`}
                    className="self-start inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-4 py-2 rounded-sm transition-colors text-xs"
                  >
                    {t("pleistariasmosBannerCta")} <ArrowRight size={12} />
                  </Link>
                </div>
              )}
              <div className="bg-amber-50 border border-amber-200 rounded-sm p-5 flex flex-col justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-sm bg-accent/15 border border-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building2 className="text-accent" size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-primary text-sm">{t("fundsBannerTitle")}</p>
                    <p className="text-gray-600 text-xs mt-0.5">{t("fundsBannerText")}</p>
                  </div>
                </div>
                <Link
                  href={`/funds`}
                  className="self-start inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-4 py-2 rounded-sm transition-colors text-xs"
                >
                  {t("fundsBannerCta")} <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        )}

        <div className="grid md:grid-cols-2 gap-12">
          <ScrollReveal direction="left" delay={0.1}>
            <h2 className="text-2xl font-playfair font-bold text-primary mb-6 border-l-4 border-accent pl-4">
              {t("servicesTitle")}
            </h2>
            <ul className="space-y-3">
              {servicesRaw.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700">
                  <div className="mt-1 w-5 h-5 rounded-full bg-accent/15 border border-accent flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-accent" strokeWidth={3} />
                  </div>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={0.2}>
            <h2 className="text-2xl font-playfair font-bold text-primary mb-6 border-l-4 border-accent pl-4">
              {t("approachTitle")}
            </h2>
            <p className="text-gray-600 leading-relaxed">{t(`areas.${area}.approach`)}</p>
          </ScrollReveal>
        </div>

        <ScrollReveal direction="up" delay={0.1}>
          <CategoryArticles category={area} locale={locale} />
        </ScrollReveal>
      </section>

      <section className="bg-primary py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-playfair font-bold text-white mb-4">
            {t("ctaTitle")}
          </h2>
          <p className="text-white/70 mb-8">{t("ctaText")}</p>
          <Link
            href={`/contact`}
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-4 rounded-sm transition-colors"
          >
            {t("ctaTitle")} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
