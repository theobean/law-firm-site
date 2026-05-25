"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/image";
import { Calendar, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { readingTime } from "@/lib/readingTime";

interface Article {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt?: string;
  excerpt?: string;
  mainImage?: { _type: string; asset: { _ref: string } } | null;
  category?: string;
  body?: Array<{ _type: string; children?: Array<{ text?: string }> }>;
}

interface Props {
  articles: Article[];
  locale: string;
  categoryLabels: Record<string, string>;
}

export default function BlogList({ articles, locale, categoryLabels }: Props) {
  const t = useTranslations("blog");
  const [selected, setSelected] = useState<string>("all");

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => a.category && set.add(a.category));
    return Array.from(set);
  }, [articles]);

  const filtered = useMemo(() => {
    if (selected === "all") return articles;
    return articles.filter((a) => a.category === selected);
  }, [articles, selected]);

  const chip = (active: boolean) =>
    `px-4 py-2 rounded-sm text-sm font-semibold transition-colors ${
      active
        ? "bg-primary text-white"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  return (
    <>
      {availableCategories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setSelected("all")}
            className={chip(selected === "all")}
          >
            {t("categoryAll")}
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelected(cat)}
              className={chip(selected === cat)}
            >
              {categoryLabels[cat] ?? cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-20">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((article) => (
            <Link
              key={article._id}
              href={`/${locale}/blog/${article.slug.current}`}
              className="group block border border-gray-100 rounded-sm overflow-hidden hover:shadow-lg transition-shadow bg-primary"
            >
              {article.mainImage && (
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={urlFor(article.mainImage).width(600).height(400).url()}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-6 bg-primary">
                <div className="flex items-center gap-2 text-white/50 text-xs mb-3">
                  <Calendar size={12} />
                  <span>
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString(
                          locale === "el" ? "el-GR" : "en-US"
                        )
                      : ""}
                  </span>
                  <span>·</span>
                  <Clock size={12} />
                  <span>{t("readingTime", { minutes: readingTime(article.body) })}</span>
                  {article.category && categoryLabels[article.category] && (
                    <>
                      <span>·</span>
                      <span className="text-accent">{categoryLabels[article.category]}</span>
                    </>
                  )}
                </div>
                <h2 className="text-white font-bold text-lg mb-2 border-b border-accent pb-2 inline-block">
                  {article.title}
                </h2>
                {article.excerpt && (
                  <p className="text-white/60 text-sm leading-relaxed mt-3 line-clamp-3">
                    {article.excerpt}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
