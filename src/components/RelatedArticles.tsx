import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/image";
import { useTranslations } from "next-intl";
import { Calendar } from "lucide-react";

interface Article {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt?: string;
  excerpt?: string;
  mainImage?: { _type: string; asset: { _ref: string } } | null;
}

export default function RelatedArticles({
  articles,
  locale,
}: {
  articles: Article[];
  locale: string;
}) {
  const t = useTranslations("blog");

  if (!articles || articles.length === 0) return null;

  return (
    <section className="bg-gray-50 py-16 mt-16">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-playfair font-bold text-primary mb-8 border-l-4 border-accent pl-4">
          {t("relatedTitle")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link
              key={article._id}
              href={`/${locale}/blog/${article.slug.current}`}
              className="group block bg-white border border-gray-100 rounded-sm overflow-hidden hover:shadow-lg transition-shadow"
            >
              {article.mainImage && (
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={urlFor(article.mainImage).width(400).height(250).url()}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                  <Calendar size={12} />
                  <span>
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString(
                          locale === "el" ? "el-GR" : "en-US"
                        )
                      : ""}
                  </span>
                </div>
                <h3 className="text-primary font-bold text-base group-hover:text-accent transition-colors line-clamp-2">
                  {article.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
