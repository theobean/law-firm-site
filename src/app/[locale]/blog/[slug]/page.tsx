import { getArticle, getRelatedArticles } from "@/sanity/client";
import { urlFor } from "@/sanity/image";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, Clock } from "lucide-react";
import { readingTime } from "@/lib/readingTime";
import ShareButtons from "@/components/ShareButtons";
import AuthorCard from "@/components/AuthorCard";
import RelatedArticles from "@/components/RelatedArticles";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const article = await getArticle(slug);
  if (!article) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ioannnispapaioannou.lawyer";
  const articleUrl = `${siteUrl}/${locale}/blog/${slug}`;
  const description = article.excerpt || article.title;
  const ogImage = article.mainImage
    ? urlFor(article.mainImage).width(1200).height(630).url()
    : `${siteUrl}/δικηγορος.png`;

  return {
    title: article.title,
    description,
    alternates: { canonical: articleUrl },
    openGraph: {
      title: article.title,
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const articleUrl = `${baseUrl}/${locale}/blog/${slug}`;

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

        <div className="prose prose-lg max-w-none prose-headings:font-playfair prose-headings:text-primary prose-a:text-accent">
          {article.body && <PortableText value={article.body} />}
        </div>

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
