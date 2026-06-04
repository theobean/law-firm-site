import { getDecisionById, getDecisions } from "@/sanity/client";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, Landmark, Download, Eye } from "lucide-react";
import DecisionImageViewer from "@/components/DecisionImageViewer";

export const revalidate = 10;

export async function generateStaticParams() {
  const decisions = await getDecisions();
  return decisions.map((d: { _id: string }) => ({ id: d._id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const decision = await getDecisionById(id);
  if (!decision) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ioannispapaioannou.lawyer";
  const pageUrl = `${siteUrl}/${locale}/decisions/${id}`;
  const ogImage = decision.images?.[0]?.url ?? `${siteUrl}/δικηγορος.png`;
  const description = decision.description ||
    [decision.court, decision.date ? new Date(decision.date).getFullYear() : null]
      .filter(Boolean).join(" · ");

  return {
    title: decision.title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: decision.title,
      description,
      url: pageUrl,
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: decision.title }],
    },
    twitter: { card: "summary_large_image", title: decision.title, description, images: [ogImage] },
  };
}

export default async function DecisionPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const decision = await getDecisionById(id);
  if (!decision) notFound();

  const t = await getTranslations("decisions");

  const formattedDate = decision.date
    ? new Date(decision.date).toLocaleDateString(
        locale === "el" ? "el-GR" : locale === "de" ? "de-DE" : "en-GB",
        { day: "numeric", month: "long", year: "numeric" }
      )
    : null;

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-primary py-20 text-white">
        <div className="max-w-4xl mx-auto px-6">
          <Link
            href={`/${locale}/decisions`}
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={15} />
            {locale === "el" ? "Όλες οι αποφάσεις" : locale === "de" ? "Alle Entscheidungen" : "All decisions"}
          </Link>

          {decision.category && (
            <span className="inline-block text-xs font-bold tracking-widest uppercase text-accent border border-accent/30 px-3 py-1 rounded-sm mb-4">
              {t(`categories.${decision.category}`)}
            </span>
          )}

          <h1 className="text-2xl md:text-3xl font-playfair font-bold leading-snug border-l-4 border-accent pl-6">
            {decision.title}
          </h1>

          <div className="flex flex-wrap gap-4 mt-6 pl-6 text-white/50 text-sm">
            {decision.court && (
              <span className="flex items-center gap-1.5">
                <Landmark size={13} /> {decision.court}
              </span>
            )}
            {formattedDate && (
              <span className="flex items-center gap-1.5">
                <Calendar size={13} /> {formattedDate}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Description */}
        {decision.description && (
          <p className="text-gray-600 text-lg leading-relaxed mb-10 border-l-4 border-accent/30 pl-6">
            {decision.description}
          </p>
        )}

        {/* PDF buttons */}
        {decision.fileUrl && (
          <div className="flex gap-3 mb-10">
            <a
              href={decision.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-3 rounded-sm hover:bg-primary/90 transition-colors"
            >
              <Eye size={15} /> {t("view")} PDF
            </a>
            <a
              href={`${decision.fileUrl}?dl=`}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 text-sm font-semibold px-5 py-3 rounded-sm hover:border-accent hover:text-accent transition-colors"
            >
              <Download size={15} /> {t("download")}
            </a>
          </div>
        )}

        {/* Images */}
        {decision.images?.length > 0 && (
          <DecisionImageViewer images={decision.images} title={decision.title} />
        )}
      </div>
    </div>
  );
}
