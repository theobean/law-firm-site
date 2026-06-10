import { getDecisionBySlug } from "@/sanity/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, Landmark, Download, Eye } from "lucide-react";
import DecisionImageViewer from "@/components/DecisionImageViewer";
import ShareButtons from "@/components/ShareButtons";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  try {
    const { slug, locale } = await params;
    const decision = await getDecisionBySlug(slug);
    if (!decision) return {};
    const pageUrl = `${siteUrl}/${locale}/decisions/${slug}`;
    const ogImage = decision.images?.[0]?.url ?? `${siteUrl}/δικηγορος.png`;
    const description = (decision.description ?? "").slice(0, 160) || decision.title;
    return {
      title: decision.title, description,
      alternates: { canonical: pageUrl },
      openGraph: { title: decision.title, description, url: pageUrl, type: "article", images: [{ url: ogImage, width: 1200, height: 630, alt: decision.title }] },
      twitter: { card: "summary_large_image", title: decision.title, description, images: [ogImage] },
    };
  } catch { return {}; }
}

const cats: Record<string, Record<string, string>> = {
  el: { banking:"Τραπεζικό", extrajudicial:"Εξωδικαστικός", criminal:"Ποινικό", commercial:"Εμπορικό", realEstate:"Ακίνητα", administrative:"Διοικητικό", inheritance:"Κληρονομικό", tax:"Φορολογικό", labor:"Εργατικό" },
  en: { banking:"Banking", extrajudicial:"Out-of-Court", criminal:"Criminal", commercial:"Commercial", realEstate:"Real Estate", administrative:"Administrative", inheritance:"Inheritance", tax:"Tax", labor:"Labour" },
  de: { banking:"Bankrecht", extrajudicial:"Außergerichtlich", criminal:"Strafrecht", commercial:"Handelsrecht", realEstate:"Immobilien", administrative:"Verwaltungsrecht", inheritance:"Erbrecht", tax:"Steuerrecht", labor:"Arbeitsrecht" },
};
const ui: Record<string, Record<string, string>> = {
  el: { back:"Όλες οι αποφάσεις", view:"Προβολή", dl:"Λήψη", share:"Μοιραστείτε την απόφαση", copy:"Αντιγραφή συνδέσμου", copied:"Αντιγράφηκε!" },
  en: { back:"All decisions", view:"View", dl:"Download", share:"Share this decision", copy:"Copy link", copied:"Copied!" },
  de: { back:"Alle Entscheidungen", view:"Ansehen", dl:"Herunterladen", share:"Entscheidung teilen", copy:"Link kopieren", copied:"Kopiert!" },
};

export default async function DecisionPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const decision = await getDecisionBySlug(slug);
  if (!decision) notFound();

  const lang = locale === "de" || locale === "en" ? locale : "el";
  const s = ui[lang];
  const catLabel = decision.category ? (cats[lang][decision.category] ?? null) : null;
  const hasImages = Array.isArray(decision.images) && decision.images.length > 0;
  const formattedDate = decision.date
    ? new Date(decision.date).toLocaleDateString(lang === "el" ? "el-GR" : lang === "de" ? "de-DE" : "en-GB", { day:"numeric", month:"long", year:"numeric" })
    : null;

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-primary py-20 text-white">
        <div className="max-w-4xl mx-auto px-6">
          <Link href={`/${locale}/decisions`} className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft size={15} /> {s.back}
          </Link>
          {catLabel && <div className="mb-4"><span className="text-xs font-bold tracking-widest uppercase text-accent border border-accent/30 px-3 py-1 rounded-sm">{catLabel}</span></div>}
          <h1 className="text-2xl md:text-3xl font-playfair font-bold leading-snug border-l-4 border-accent pl-6">{decision.title}</h1>
          <div className="flex flex-wrap gap-4 mt-6 pl-6 text-white/50 text-sm">
            {decision.court && <span className="flex items-center gap-1.5"><Landmark size={13} />{decision.court}</span>}
            {formattedDate && <span className="flex items-center gap-1.5"><Calendar size={13} />{formattedDate}</span>}
          </div>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {decision.description && (
          <p className="text-gray-600 text-lg leading-relaxed mb-10 border-l-4 border-accent/30 pl-6 whitespace-pre-line">
            {decision.description}
          </p>
        )}
        {/* Share */}
        <div className="mb-8 pb-6 border-b border-gray-100">
          <ShareButtons
            url={`https://www.ioannispapaioannou.lawyer/${locale}/decisions/${slug}`}
            title={decision.title}
            shareLabel={s.share}
            copyLinkLabel={s.copy}
            linkCopiedLabel={s.copied}
          />
        </div>

        {decision.fileUrl && (
          <div className="flex gap-3 mb-10">
            <a href={decision.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-3 rounded-sm hover:bg-primary/90 transition-colors"><Eye size={15}/>{s.view} PDF</a>
            <a href={`${decision.fileUrl}?dl=`} className="flex items-center gap-2 border border-gray-200 text-gray-600 text-sm font-semibold px-5 py-3 rounded-sm hover:border-accent hover:text-accent transition-colors"><Download size={15}/>{s.dl}</a>
          </div>
        )}
        {hasImages && <DecisionImageViewer images={decision.images} title={decision.title} />}
      </div>
    </div>
  );
}
