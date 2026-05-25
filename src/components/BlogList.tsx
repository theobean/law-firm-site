"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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

const PAGE_SIZE = 6;

function AnimatedCard({ article, locale, categoryLabels, index }: {
  article: Article;
  locale: string;
  categoryLabels: Record<string, string>;
  index: number;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  // Scroll reveal
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -9, y: x * 9 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  };

  const delay = (index % PAGE_SIZE) * 0.07;

  return (
    <div
      ref={wrapperRef}
      style={
        visible
          ? { animation: `reveal-up 0.5s cubic-bezier(0.4,0,0.2,1) ${delay}s both` }
          : { opacity: 0 }
      }
    >
      <div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: hovered
            ? `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.04)`
            : "perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)",
          transition: hovered ? "transform 0.08s ease-out" : "transform 0.4s ease-out",
          willChange: "transform",
        }}
        className="group relative h-full"
      >
        <Link
          href={`/${locale}/blog/${article.slug.current}`}
          className={`block h-full border rounded-sm overflow-hidden bg-primary relative transition-shadow duration-300 ${
            hovered ? "shadow-2xl border-accent/40" : "border-gray-100 shadow-none"
          }`}
        >
          {article.mainImage && (
            <div className="relative h-44 overflow-hidden">
              <Image
                src={urlFor(article.mainImage).width(600).height(400).url()}
                alt={article.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
            </div>
          )}
          <div className="p-5">
            <div className="flex items-center flex-wrap gap-2 text-white/50 text-xs mb-3">
              <Calendar size={11} />
              <span>
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString(
                      locale === "el" ? "el-GR" : "en-US"
                    )
                  : ""}
              </span>
              <span>·</span>
              <Clock size={11} />
              <span>{readingTime(article.body)} λεπτά</span>
              {article.category && categoryLabels[article.category] && (
                <>
                  <span>·</span>
                  <span className="text-accent font-medium">{categoryLabels[article.category]}</span>
                </>
              )}
            </div>
            {/* Title: no mid-word cut, wraps naturally */}
            <h2 className="text-white font-bold text-base mb-2 border-b border-accent/60 pb-2 leading-snug [overflow-wrap:break-word] [word-break:break-word] line-clamp-3">
              {article.title}
            </h2>
            {article.excerpt && (
              <p className="text-white/55 text-sm leading-relaxed line-clamp-2 [overflow-wrap:break-word]">
                {article.excerpt}
              </p>
            )}
            <div className={`mt-3 flex items-center gap-1 text-accent text-xs font-semibold transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`}>
              Διαβάστε περισσότερα →
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default function BlogList({ articles, locale, categoryLabels }: Props) {
  const t = useTranslations("blog");
  const [selected, setSelected] = useState<string>("all");
  const [page, setPage] = useState(1);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => a.category && set.add(a.category));
    return Array.from(set);
  }, [articles]);

  const filtered = useMemo(() => {
    return selected === "all" ? articles : articles.filter((a) => a.category === selected);
  }, [articles, selected]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilter = (cat: string) => {
    setSelected(cat);
    setPage(1);
  };

  const handlePage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const chip = (active: boolean) =>
    `px-4 py-2 rounded-sm text-sm font-semibold transition-all duration-200 ${
      active ? "bg-primary text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  return (
    <>
      {availableCategories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-10">
          <button onClick={() => handleFilter("all")} className={chip(selected === "all")}>
            {t("categoryAll")}
          </button>
          {availableCategories.map((cat) => (
            <button key={cat} onClick={() => handleFilter(cat)} className={chip(selected === cat)}>
              {categoryLabels[cat] ?? cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-20">{t("empty")}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map((article, i) => (
              <AnimatedCard
                key={article._id}
                article={article}
                locale={locale}
                categoryLabels={categoryLabels}
                index={i}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2 flex-wrap">
              {/* Prev */}
              <button
                onClick={() => handlePage(page - 1)}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ←
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                // Show: first, last, current ±1, ellipsis
                const show = p === 1 || p === totalPages || Math.abs(p - page) <= 1;
                const ellipsisBefore = p === 2 && page > 4;
                const ellipsisAfter = p === totalPages - 1 && page < totalPages - 3;

                if (!show) {
                  if (ellipsisBefore || ellipsisAfter) {
                    return <span key={p} className="text-gray-400 px-1">…</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={p}
                    onClick={() => handlePage(p)}
                    className={`w-10 h-10 flex items-center justify-center rounded-sm text-sm font-semibold transition-all duration-200 ${
                      p === page
                        ? "bg-accent text-white shadow-md border-accent"
                        : "border border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              {/* Next */}
              <button
                onClick={() => handlePage(page + 1)}
                disabled={page === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                →
              </button>
            </div>
          )}

          {/* Info */}
          {totalPages > 1 && (
            <p className="text-center text-gray-400 text-sm mt-4">
              Σελίδα {page} από {totalPages} · {filtered.length} άρθρα
            </p>
          )}
        </>
      )}
    </>
  );
}
