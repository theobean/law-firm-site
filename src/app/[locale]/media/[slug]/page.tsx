import { getInterviewBySlug } from "@/sanity/client";
import { notFound } from "next/navigation";
import { Link } from "@/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, Tv } from "lucide-react";
import { getYouTubeId, getThumbnailUrl, getEmbedUrl, getFacebookEmbedUrl, getVideoType } from "@/lib/youtube";
import { siteUrl as SITE, ogDefaults } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  try {
    const { slug, locale } = await params;
    const iv = await getInterviewBySlug(slug);
    if (!iv) return {};
    const pageUrl = `${SITE}/${locale}/media/${slug}`;
    const ytId = getYouTubeId(iv.youtubeUrl);
    const ogImage = ytId ? getThumbnailUrl(ytId) : `${SITE}/δικηγορος.png`;
    const year = iv.date ? new Date(iv.date).getFullYear() : null;
    const lawyerLabel = locale === "de" ? "Rechtsanwalt Ioannis Papaioannou" : locale === "en" ? "Lawyer Ioannis Papaioannou" : "Δικηγόρος Ιωάννης Παπαϊωάννου";
    // Word-boundary truncation to avoid cutting mid-word
    const truncate = (s: string, n: number) => {
      if (s.length <= n) return s;
      const cut = s.slice(0, n);
      const lastSpace = cut.lastIndexOf(" ");
      return (lastSpace > n * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,.;:·\-–—]+$/, "").trim() + "…";
    };
    const baseDesc = (iv.description ?? "").trim();
    // Always include lawyer name + show + year for SEO; pad with original description.
    const suffix = [lawyerLabel, iv.show, year].filter(Boolean).join(" · ");
    const description = baseDesc
      ? truncate(`${baseDesc} — ${suffix}`, 160)
      : truncate(`${iv.title}. ${suffix}.`, 160);
    return {
      title: iv.title, description,
      alternates: { canonical: pageUrl },
      openGraph: { ...ogDefaults(locale), title: iv.title, description, url: pageUrl, type: "video.other", images: [{ url: ogImage, width: 1280, height: 720, alt: iv.title }] },
      twitter: { card: "summary_large_image", title: iv.title, description, images: [ogImage] },
    };
  } catch { return {}; }
}

const ui: Record<string, Record<string, string>> = {
  el: { back: "Όλες οι συνεντεύξεις" },
  en: { back: "All interviews" },
  de: { back: "Alle Interviews" },
};

export default async function InterviewPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const iv = await getInterviewBySlug(slug);
  if (!iv) notFound();

  const lang = locale === "de" || locale === "en" ? locale : "el";
  const s = ui[lang];

  const videoType = getVideoType(iv.youtubeUrl);
  const ytId = videoType === "youtube" ? getYouTubeId(iv.youtubeUrl) : null;
  const embedUrl = videoType === "youtube" && ytId
    ? getEmbedUrl(ytId).replace("autoplay=1", "autoplay=0")
    : videoType === "facebook"
    ? getFacebookEmbedUrl(iv.youtubeUrl).replace("autoplay=true", "autoplay=false")
    : null;

  const formattedDate = iv.date
    ? new Date(iv.date).toLocaleDateString(lang === "el" ? "el-GR" : lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-primary py-16 text-white">
        <div className="max-w-4xl mx-auto px-6">
          <Link href={`/${locale}/media`} className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft size={15} /> {s.back}
          </Link>
          <h1 className="text-2xl md:text-3xl font-playfair font-bold leading-snug border-l-4 border-accent pl-6">{iv.title}</h1>
          <div className="flex flex-wrap gap-4 mt-6 pl-6 text-white/50 text-sm">
            {iv.show && <span className="flex items-center gap-1.5 text-accent font-semibold"><Tv size={13} />{iv.show}</span>}
            {formattedDate && <span className="flex items-center gap-1.5"><Calendar size={13} />{formattedDate}</span>}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {embedUrl ? (
          <div className="relative aspect-video bg-black rounded-sm overflow-hidden shadow-xl">
            <iframe
              src={embedUrl}
              title={iv.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : (
          <a href={iv.youtubeUrl} target="_blank" rel="noopener noreferrer" className="block text-accent underline">{iv.youtubeUrl}</a>
        )}

        {iv.description && (
          <p className="text-gray-600 text-lg leading-relaxed mt-10 border-l-4 border-accent/30 pl-6 whitespace-pre-line">
            {iv.description}
          </p>
        )}
      </div>
    </div>
  );
}
