import { getTranslations } from "next-intl/server";
import { getInterviews } from "@/sanity/client";
import MediaGrid from "@/components/MediaGrid";
import type { Metadata } from "next";
import { buildPageMeta } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "media" });
  return { title: t("seoTitle"), description: t("seoDescription"), ...buildPageMeta(locale, "/media") };
}

export default async function MediaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "media" });
  const interviews = await getInterviews();

  return (
    <div className="bg-white">
      {/* Hero — dark like other pages */}
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

      {/* Grid — white background like other pages */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <MediaGrid interviews={interviews} locale={locale} />
      </section>
    </div>
  );
}
