import { getArticle, getRelatedArticles } from "@/sanity/client";
import { urlFor } from "@/sanity/image";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { readingTime } from "@/lib/readingTime";
import ShareButtons from "@/components/ShareButtons";
import AuthorCard from "@/components/AuthorCard";
import RelatedArticles from "@/components/RelatedArticles";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { siteUrl, ogDefaults } from "@/lib/seo";

export const revalidate = 60;

// Normalises article body pasted from Word/PDF, where the whole text often
// lands inside a single span with literal "\n" characters:
//   - double newline ("\n\n")  = a real paragraph break  -> new <p> block
//   - single newline ("\n")    = a soft line-wrap         -> joined with a space
// Blocks that are already well-structured pass through unchanged.
function normalizeBody(blocks: any[]): any[] {
  const result: any[] = [];
  let key = 0;

  for (const block of blocks) {
    if (block._type !== "block" || !block.children) {
      result.push(block);
      continue;
    }

    let current: any[] = [];
    const flush = () => {
      if (current.some((c) => c._type !== "span" || c.text.trim() !== "")) {
        result.push({ ...block, _key: `${block._key}-${key++}`, children: current });
      }
      current = [];
    };

    for (const child of block.children) {
      if (child._type !== "span" || typeof child.text !== "string") {
        current.push(child);
        continue;
      }
      // Split this span on paragraph breaks (2+ newlines).
      const paras: string[] = child.text.split(/\n{2,}/);
      paras.forEach((para: string, idx: number) => {
        if (idx > 0) flush(); // paragraph boundary inside the span
        const cleaned = para.replace(/\s*\n\s*/g, " ").replace(/[ \t]{2,}/g, " ");
        current.push({ ...child, _key: `${child._key}-${key++}`, text: cleaned });
      });
    }
    flush();
  }

  return result;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const article = await getArticle(slug);
  if (!article) return {};

  const articleUrl = `${siteUrl}/${locale}/blog/${slug}`;
  const metaTitle = article.seoTitle || article.title;
  const description = article.seoDescription || article.excerpt || article.title;
  const ogImage = article.mainImage
    ? urlFor(article.mainImage).width(1200).height(630).url()
    : `${siteUrl}/δικηγορος.png`;

  return {
    title: metaTitle,
    description,
    alternates: { canonical: articleUrl },
    openGraph: {
      ...ogDefaults(locale),
      title: metaTitle,
      description,
      url: articleUrl,
      type: "article",
      publishedTime: article.publishedAt,
      images: [{ url: ogImage, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const article = await getArticle(slug);

  if (!article) notFound();

  const t = await getTranslations("blog");

  const minutes = readingTime(article.body);
  const related = article.category
    ? await getRelatedArticles(slug, article.category, 3)
    : [];

  // Silo link back to the matching practice-area pillar (skip "general").
  const pillarAreas = ["banking", "extrajudicial", "criminal", "commercial", "realEstate", "administrative", "inheritance", "tax", "labor"];
  const pillar = article.category && pillarAreas.includes(article.category) ? article.category : null;
  const tAreas = pillar ? await getTranslations("practiceAreas") : null;
  const lang = locale === "de" || locale === "en" ? locale : "el";
  const siloLabels: Record<string, { area: string; view: string }> = {
    el: { area: "Σχετικός τομέας δικαίου", view: "Δείτε τον τομέα" },
    en: { area: "Related practice area", view: "View practice area" },
    de: { area: "Verwandtes Rechtsgebiet", view: "Zum Rechtsgebiet" },
  };

  const articleUrl = `${siteUrl}/${locale}/blog/${slug}`;

  return (
    <div className="bg-white">
      <section className="bg-primary py-24 text-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex flex-wrap items-center gap-4 text-white/50 text-sm mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={14} />
              <span>
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString(
                      locale === "el" ? "el-GR" : "en-US"
                    )
                  : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>{t("readingTime", { minutes })}</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-playfair font-bold border-l-4 border-accent pl-6">
            {article.title}
          </h1>
        </div>
      </section>

      {article.mainImage && (
        <div className="relative h-72 md:h-96 w-full">
          <Image
            src={urlFor(article.mainImage).width(1200).height(600).url()}
            alt={article.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <article className="max-w-3xl mx-auto px-6 pt-12 pb-8">
        <div className="mb-8 pb-6 border-b border-gray-100">
          <ShareButtons url={articleUrl} title={article.title} />
        </div>

        {article.excerpt && (
          <p className="text-xl text-gray-600 leading-relaxed border-l-4 border-accent pl-6 mb-10 italic">
            {article.excerpt}
          </p>
        )}

        <div className="prose prose-lg max-w-none prose-headings:font-playfair prose-headings:text-primary prose-a:text-accent prose-p:leading-relaxed prose-p:mb-6">
          {article.body && (
            <PortableText
              value={normalizeBody(article.body)}
            />
          )}
        </div>

        {pillar && tAreas && (
          <div className="mt-10 bg-primary/5 border border-primary/10 rounded-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">{siloLabels[lang].area}</p>
              <p className="text-primary font-playfair font-semibold text-lg">{tAreas(`areas.${pillar}.title`)}</p>
            </div>
            <Link
              href={`/${locale}/practice-areas/${pillar}`}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-5 py-3 rounded-sm transition-colors text-sm flex-shrink-0 self-start sm:self-auto"
            >
              {siloLabels[lang].view} <ArrowRight size={16} />
            </Link>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-gray-100">
          <ShareButtons url={articleUrl} title={article.title} />
        </div>

        {article.author && (
          <div className="mt-10">
            <AuthorCard author={article.author} />
          </div>
        )}
      </article>

      {related.length > 0 && <RelatedArticles articles={related} locale={locale} />}
    </div>
  );
}
