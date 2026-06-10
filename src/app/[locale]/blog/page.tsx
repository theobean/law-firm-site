import { getTranslations } from "next-intl/server";
import { getArticles } from "@/sanity/client";
import BlogList from "@/components/BlogList";
import type { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("blogTitle"), description: t("blogDescription"), alternates: buildAlternates(locale, "/blog") };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("blog");
  const tAreas = await getTranslations("practiceAreas");
  const articles = await getArticles();

  const categoryKeys = [
    "banking",
    "extrajudicial",
    "criminal",
    "commercial",
    "realEstate",
    "labor",
    "administrative",
    "inheritance",
    "tax",
  ] as const;

  const categoryLabels: Record<string, string> = Object.fromEntries(
    categoryKeys.map((k) => [k, tAreas(`areas.${k}.title`)])
  );
  categoryLabels.general = locale === "el" ? "Γενικά" : locale === "de" ? "Allgemein" : "General";

  return (
    <div className="bg-white">
      <section className="bg-primary py-24 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="border-l-4 border-accent pl-6">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold">{t("title")}</h1>
            <p className="text-white/70 text-xl mt-2">{t("subtitle")}</p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <BlogList articles={articles} locale={locale} categoryLabels={categoryLabels} />
      </section>
    </div>
  );
}
