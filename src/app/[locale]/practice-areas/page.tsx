import PracticeAreasGrid from "@/components/PracticeAreasGrid";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("practiceAreasTitle"), description: t("practiceAreasDescription") };
}

export default function PracticeAreasPage() {
  const t = useTranslations("practiceAreas");

  return (
    <main className="bg-primary min-h-screen">
      <section className="grain relative overflow-hidden border-b border-white/10 py-20 text-white">
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
    </main>
  );
}
