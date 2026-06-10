import PracticeAreasGrid from "@/components/PracticeAreasGrid";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("practiceAreasTitle"), description: t("practiceAreasDescription"), alternates: buildAlternates(locale, "/practice-areas") };
}

export default function PracticeAreasPage() {
  const t = useTranslations("practiceAreas");

  return (
    <div className="bg-white">
      <section className="bg-primary py-24 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="border-l-4 border-accent pl-6">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold">
              {t("title")}
            </h1>
            <p className="text-white/70 text-xl mt-2">{t("subtitle")}</p>
          </div>
        </div>
      </section>
      <PracticeAreasGrid />
    </div>
  );
}
