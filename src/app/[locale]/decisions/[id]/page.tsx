import { getDecisionById, getDecisions } from "@/sanity/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, Landmark, Download, Eye } from "lucide-react";
// import DecisionImageViewer from "@/components/DecisionImageViewer";

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
    const siteUrl = "https://www.ioannispapaioannou.lawyer";
    const pageUrl = `${siteUrl}/${locale}/decisions/${id}`;
    const ogImage = decision.images?.[0]?.url ?? `${siteUrl}/δικηγορος.png`;
    const description = (decision.description ?? "").slice(0, 160) || decision.title;
    return {
      title: decision.title,
      description,
      alternates: { canonical: pageUrl },
      openGraph: { title: decision.title, description, url: pageUrl, type: "article", images: [{ url: ogImage, width: 1200, height: 630, alt: decision.title }] },
      twitter: { card: "summary_large_image", title: decision.title, description, images: [ogImage] },
    };
  } catch {
    return {};
  }
}

const categoryLabels: Record<string, Record<string, string>> = {
  el: { banking: "Τραπεζικό", extrajudicial: "Εξωδικαστικός", criminal: "Ποινικό", commercial: "Εμπορικό", realEstate: "Ακίνητα", administrative: "Διοικητικό", inheritance: "Κληρονομικό", tax: "Φορολογικό", labor: "Εργατικό" },
  en: { banking: "Banking", extrajudicial: "Out-of-Court", criminal: "Criminal", commercial: "Commercial", realEstate: "Real Estate", administrative: "Administrative", inheritance: "Inheritance", tax: "Tax", labor: "Labour" },
  de: { banking: "Bankrecht", extrajudicial: "Außergerichtlich", criminal: "Strafrecht", commercial: "Handelsrecht", realEstate: "Immobilien", administrative: "Verwaltungsrecht", inheritance: "Erbrecht", tax: "Steuerrecht", labor: "Arbeitsrecht" },
};

const ui: Record<string, { back: string; view: string; download: string }> = {
  el: { back: "Όλες οι αποφάσεις", view: "Προβολή", download: "Λήψη" },
  en: { back: "All decisions", view: "View", download: "Download" },
  de: { back: "Alle Entscheidungen", view: "Ansehen", download: "Herunterladen" },
};

export default async function DecisionPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const decision = await getDecisionById(id);
  if (!decision) notFound();

  const lang = (locale === "de" || locale === "en") ? locale : "el";
  const labels = categoryLabels[lang];
  const strings = ui[lang];
  const categoryLabel = decision.category ? (labels[decision.category] ?? null) : null;
  const hasImages = Array.isArray(decision.images) && decision.images.length > 0;

  const formattedDate = decision.date
    ? new Date(decision.date).toLocaleDateString(
        lang === "el" ? "el-GR" : lang === "de" ? "de-DE" : "en-GB",
        { day: "numeric", month: "long", year: "numeric" }
      )
    : null;

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-primary py-20 text-white">
        <div className="max-w-4xl mx-auto px-6">
          <Link href={`/${locale}/decisions`} className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft size={15} /> {strings.back}
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
            {decision.court && <span className="flex items-center gap-1.5"><Landmark size={13} /> {decision.court}</span>}
            {formattedDate && <span className="flex items-center gap-1.5"><Calendar size={13} /> {formattedDate}</span>}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {decision.description && (
          <p className="text-gray-600 text-lg leading-relaxed mb-10 border-l-4 border-accent/30 pl-6 whitespace-pre-line">
            {decision.description}
          </p>
        )}

        {decision.fileUrl && (
          <div className="flex gap-3 mb-10">
            <a href={decision.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-3 rounded-sm hover:bg-primary/90 transition-colors">
              <Eye size={15} /> {strings.view} PDF
            </a>
            <a href={`${decision.fileUrl}?dl=`} className="flex items-center gap-2 border border-gray-200 text-gray-600 text-sm font-semibold px-5 py-3 rounded-sm hover:border-accent hover:text-accent transition-colors">
              <Download size={15} /> {strings.download}
            </a>
          </div>
        )}

        {hasImages && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {decision.images.map((img: { url: string }, i: number) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={img.url} alt={`${decision.title} ${i + 1}`} className="w-full rounded shadow" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
