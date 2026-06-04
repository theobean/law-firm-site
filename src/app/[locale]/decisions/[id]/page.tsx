import { getDecisionById, getDecisions } from "@/sanity/client";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, Landmark, Download, Eye } from "lucide-react";
import DecisionImageViewer from "@/components/DecisionImageViewer";

export const revalidate = 10;

export async function generateStaticParams() {
  try {
    const decisions = await getDecisions();
    return (decisions ?? []).map((d: { _id: string }) => ({ id: d._id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  try {
    const { id, locale } = await params;
    const decision = await getDecisionById(id);
    if (!decision) return {};

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ioannispapaioannou.lawyer";
    const pageUrl = `${siteUrl}/${locale}/decisions/${id}`;
    const ogImage = decision.images?.[0]?.url ?? `${siteUrl}/δικηγορος.png`;
    const description = decision.description?.slice(0, 160) ||
      [decision.court, decision.date ? new Date(decision.date).getFullYear() : null]
        .filter(Boolean).join(" · ") || decision.title;

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
  } catch {
    return {};
  }
}

const categoryLabels: Record<string, string> = {
  banking: "Τραπεζικό",
  extrajudicial: "Εξωδικαστικός",
  criminal: "Ποινικό",
  commercial: "Εμπορικό",
  realEstate: "Ακίνητα",
  administrative: "Διοικητικό",
  inheritance: "Κληρονομικό",
  tax: "Φορολογικό",
  labor: "Εργατικό",
};

export default async function DecisionPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const decision = await getDecisionById(id);
  if (!decision) notFound();

  const t = await getTranslations({ locale, namespace: "decisions" });

  const formattedDate = decision.date
    ? new Date(decision.date).toLocaleDateString(
        locale === "el" ? "el-GR" : locale === "de" ? "de-DE" : "en-GB",
        { day: "numeric", month: "long", year: "numeric" }
      )
    : null;

  const categoryLabel = decision.category ? categoryLabels[decision.category] : null;
  const hasImages = Array.isArray(decision.images) && decision.images.length > 0;

  const backLabel = locale === "de" ? "Alle Entscheidungen" : locale === "en" ? "All decisions" : "Όλες οι αποφάσεις";

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
            {backLabel}
          </Link>

          {categoryLabel && (
            <div className="mb-4">
              <span className="text-xs font-bold tracking-widest uppercase text-accent border border-accent/30 px-3 py-1 rounded-sm">
                {categoryLabel}
              </span>
            </div>
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
          <p className="text-gray-600 text-lg leading-relaxed mb-10 border-l-4 border-accent/30 pl-6 whitespace-pre-line">
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
        {hasImages && (
          <DecisionImageViewer images={decision.images} title={decision.title} />
        )}
      </div>
    </div>
  );
}
