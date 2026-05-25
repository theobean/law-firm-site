import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Scale, Shield, Briefcase, Home, Users, Building2, BookOpen, Receipt } from "lucide-react";
import { use } from "react";
import ScrollReveal from "@/components/ScrollReveal";

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
  };
}

const validAreas = [
  "civil",
  "criminal",
  "commercial",
  "realEstate",
  "labor",
  "administrative",
  "inheritance",
  "tax",
] as const;

type AreaKey = (typeof validAreas)[number];

const icons: Record<AreaKey, typeof Scale> = {
  civil: Scale,
  criminal: Shield,
  commercial: Briefcase,
  realEstate: Home,
  labor: Users,
  administrative: Building2,
  inheritance: BookOpen,
  tax: Receipt,
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
            href={`/${locale}/practice-areas`}
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
            {t("ctaTitle")} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
