import { getTranslations } from "next-intl/server";
import { getInterviews } from "@/sanity/client";
import MediaGrid from "@/components/MediaGrid";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "media" });
  return { title: t("seoTitle"), description: t("seoDescription") };
}

export default async function MediaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "media" });
  const interviews = await getInterviews();

  return (
    <main className="bg-primary min-h-screen">
      {/* Hero */}
      <section className="grain relative overflow-hidden bg-primary border-b border-white/10 py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-4">
            {t("eyebrow")}
          </p>
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">
            {t("title")}
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">{t("subtitle")}</p>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <MediaGrid interviews={interviews} locale={locale} />
      </section>
    </main>
  );
}
