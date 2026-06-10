import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";
import FaqAccordion from "@/components/FaqAccordion";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return { title: t("faqTitle"), description: t("faqDescription"), alternates: buildAlternates(locale, "/faq") };
}

export default function FaqPage() {
  const t = useTranslations("faq");

  const items = Array.from({ length: 6 }, (_, i) => ({
    q: t(`q${i + 1}`),
    a: t(`a${i + 1}`),
  }));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <div className="bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="bg-primary py-24 text-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="border-l-4 border-accent pl-6">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold">{t("title")}</h1>
            <p className="text-white/70 text-xl mt-2">{t("subtitle")}</p>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16">
        <FaqAccordion items={items} />
      </section>
    </div>
  );
}
