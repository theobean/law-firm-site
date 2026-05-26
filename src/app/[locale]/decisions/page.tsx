import { getTranslations } from "next-intl/server";
import { getDecisions } from "@/sanity/client";
import DecisionsGrid from "@/components/DecisionsGrid";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "decisions" });
  return { title: t("seoTitle"), description: t("seoDescription") };
}

export default async function DecisionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "decisions" });
  const decisions = await getDecisions();

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-primary py-24 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="border-l-4 border-accent pl-6">
            <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-2">
              {t("eyebrow")}
            </p>
            <h1 className="text-4xl md:text-5xl font-playfair font-bold">{t("title")}</h1>
            <p className="text-white/70 text-xl mt-2">{t("subtitle")}</p>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <DecisionsGrid decisions={decisions} locale={locale} />
      </section>
    </div>
  );
}
