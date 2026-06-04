"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  FileText, Download, Eye, Calendar, Landmark,
  ChevronLeft, ChevronRight, X, Images, ZoomIn,
} from "lucide-react";
import { useTranslations } from "next-intl";
import ShareButtons from "@/components/ShareButtons";

interface DecisionImage {
  url: string;
  width?: number;
  height?: number;
}

interface Decision {
  _id: string;
  title: string;
  fileUrl: string | null;
  images?: DecisionImage[];
  date?: string;
  court?: string;
  category?: string;
  description?: string;
}

const PAGE_SIZE = 6;

const categoryColors: Record<string, string> = {
  banking:        "bg-blue-900/40 text-blue-300 border-blue-700/40",
  extrajudicial:  "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
  criminal:       "bg-red-900/40 text-red-300 border-red-700/40",
  commercial:     "bg-amber-900/40 text-amber-300 border-amber-700/40",
  realEstate:     "bg-orange-900/40 text-orange-300 border-orange-700/40",
  administrative: "bg-purple-900/40 text-purple-300 border-purple-700/40",
  inheritance:    "bg-teal-900/40 text-teal-300 border-teal-700/40",
  tax:            "bg-indigo-900/40 text-indigo-300 border-indigo-700/40",
  labor:          "bg-rose-900/40 text-rose-300 border-rose-700/40",
};

// ── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  startIndex,
  title,
  onClose,
}: {
  images: DecisionImage[];
  startIndex: number;
  title: string;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const [mounted, setMounted] = useState(false);

  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    setMounted(true);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [onClose, prev, next]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black flex" onClick={onClose}>

      {/* Prev arrow */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          aria-label="Προηγούμενη"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
        >
          <ChevronLeft size={26} />
        </button>
      )}

      {/* Image — truly full screen, object-contain */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[idx].url}
        alt={`${title} — εικόνα ${idx + 1}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full object-contain"
      />

      {/* Next arrow */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="Επόμενη"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
        >
          <ChevronRight size={26} />
        </button>
      )}

      {/* Close + counter */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        {images.length > 1 && (
          <span className="text-white/60 text-sm">{idx + 1} / {images.length}</span>
        )}
        <button
          onClick={onClose}
          aria-label="Κλείσιμο"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>,
    document.body
  );
}

// ── DecisionCard ─────────────────────────────────────────────────────────────

function DecisionCard({
  decision,
  locale,
  index,
}: {
  decision: Decision;
  locale: string;
  index: number;
}) {
  const t = useTranslations("decisions");
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const hasImages = (decision.images?.length ?? 0) > 0;
  const hasPdf = !!decision.fileUrl;

  useEffect(() => {
    const el = ref.current;
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

  const formattedDate = decision.date
    ? new Date(decision.date).toLocaleDateString(
        locale === "el" ? "el-GR" : locale === "de" ? "de-DE" : "en-GB",
        { day: "numeric", month: "long", year: "numeric" }
      )
    : null;

  const categoryLabel = decision.category ? t(`categories.${decision.category}`) : null;
  const colorClass = decision.category
    ? categoryColors[decision.category] ?? "bg-gray-800/40 text-gray-300 border-gray-600/40"
    : "";

  const delay = (index % PAGE_SIZE) * 0.07;

  return (
    <div
      ref={ref}
      style={visible ? { animation: `reveal-up 0.5s cubic-bezier(0.4,0,0.2,1) ${delay}s both` } : { opacity: 0 }}
    >
      {/* Lightbox */}
      {lightboxIdx !== null && hasImages && (
        <Lightbox
          images={decision.images!}
          startIndex={lightboxIdx}
          title={decision.title}
          onClose={() => setLightboxIdx(null)}
        />
      )}

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
        className={`flex flex-col border rounded-sm overflow-hidden transition-shadow duration-300 group bg-primary ${
          hovered ? "shadow-2xl border-accent/40" : "border-white/10 shadow-none"
        }`}
      >
        {/* Image thumbnail — shown if has images */}
        {hasImages && (
          <button
            onClick={() => setLightboxIdx(0)}
            className="relative w-full aspect-video overflow-hidden bg-black/40 group/img"
            aria-label="Προβολή εικόνων"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={decision.images![0].url}
              alt={decision.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
            />
            <div className="absolute inset-0 bg-black/30 group-hover/img:bg-black/50 transition-colors duration-300 flex items-center justify-center">
              <ZoomIn size={28} className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
            </div>
            {decision.images!.length > 1 && (
              <span className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-sm">
                <Images size={10} />
                {decision.images!.length}
              </span>
            )}
          </button>
        )}

        <div className="p-6 flex flex-col flex-1">
          {/* Top row: icon + category badge */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="w-10 h-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-accent/15 group-hover:border-accent/30 transition-colors">
              {hasPdf
                ? <FileText size={18} className="text-white/40 group-hover:text-accent transition-colors" />
                : <Images size={18} className="text-white/40 group-hover:text-accent transition-colors" />
              }
            </div>
            {categoryLabel && (
              <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-sm border ${colorClass}`}>
                {categoryLabel}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-white font-semibold text-base leading-snug mb-3 group-hover:text-accent transition-colors line-clamp-3 min-h-[4.5rem]">
            {decision.title}
          </h3>

          {/* Meta */}
          <div className="flex flex-col gap-1.5 mb-4">
            {decision.court && (
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Landmark size={11} className="shrink-0" />
                <span>{decision.court}</span>
              </div>
            )}
            {formattedDate && (
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Calendar size={11} className="shrink-0" />
                <span>{formattedDate}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {decision.description && (
            <p className="text-white/40 text-xs leading-relaxed mb-4 line-clamp-2">
              {decision.description}
            </p>
          )}

          {/* Actions */}
          <div className="mt-auto flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {/* Image viewer button */}
              {hasImages && (
                <button
                  onClick={() => setLightboxIdx(0)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-accent hover:bg-accent/90 px-3 py-2 rounded-sm transition-colors"
                >
                  <Images size={12} />
                  {decision.images!.length > 1
                    ? `Εικόνες (${decision.images!.length})`
                    : "Προβολή εικόνας"}
                </button>
              )}
              {/* PDF buttons */}
              {hasPdf && (
                <>
                  <a
                    href={decision.fileUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-sm transition-colors ${
                      hasImages
                        ? "text-white/70 border border-white/20 hover:border-accent hover:text-accent"
                        : "text-white bg-accent hover:bg-accent/90"
                    }`}
                  >
                    <Eye size={12} />
                    {t("view")} PDF
                  </a>
                  <a
                    href={`${decision.fileUrl}?dl=`}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white/70 border border-white/20 hover:border-accent hover:text-accent px-3 py-2 rounded-sm transition-colors"
                  >
                    <Download size={12} />
                    {t("download")}
                  </a>
                </>
              )}
            </div>

            {(hasPdf || hasImages) && (
              <div className="border-t border-white/10 pt-3">
                <ShareButtons
                  url={`${typeof window !== "undefined" ? window.location.origin : "https://www.ioannispapaioannou.lawyer"}/${locale}/decisions/${decision._id}`}
                  title={decision.title}
                  shareLabel={t("share")}
                  copyLinkLabel={t("copyLink")}
                  linkCopiedLabel={t("linkCopied")}
                  dark
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DecisionsGrid ─────────────────────────────────────────────────────────────

export default function DecisionsGrid({
  decisions,
  locale,
}: {
  decisions: Decision[];
  locale: string;
}) {
  const t = useTranslations("decisions");
  const tCat = useTranslations("decisions.categories");

  const allCategories = [
    "banking", "extrajudicial", "criminal", "commercial",
    "realEstate", "administrative", "inheritance", "tax", "labor",
  ];

  const presentCategories = allCategories.filter((c) =>
    decisions.some((d) => d.category === c)
  );

  const [active, setActive] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtered = active ? decisions.filter((d) => d.category === active) : decisions;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleFilter(cat: string | null) {
    setActive(cat);
    setPage(1);
  }

  function handlePage(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (decisions.length === 0) {
    return <p className="text-gray-400 text-center py-20">{t("empty")}</p>;
  }

  return (
    <div>
      {/* Category filter chips */}
      {presentCategories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => handleFilter(null)}
            className={`px-4 py-1.5 rounded-sm text-sm font-medium border transition-colors ${
              active === null
                ? "bg-accent text-white border-accent"
                : "text-gray-500 border-gray-200 hover:border-accent hover:text-accent"
            }`}
          >
            Όλες
          </button>
          {presentCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleFilter(active === cat ? null : cat)}
              className={`px-4 py-1.5 rounded-sm text-sm font-medium border transition-colors ${
                active === cat
                  ? "bg-accent text-white border-accent"
                  : "text-gray-500 border-gray-200 hover:border-accent hover:text-accent"
              }`}
            >
              {tCat(cat as Parameters<typeof tCat>[0])}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {paginated.map((d, i) => (
          <DecisionCard key={d._id} decision={d} locale={locale} index={i} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button
            onClick={() => handlePage(page - 1)}
            disabled={page === 1}
            className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-sm text-gray-500 hover:border-accent hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => handlePage(p)}
              className={`w-9 h-9 flex items-center justify-center rounded-sm text-sm font-semibold border transition-colors ${
                p === page
                  ? "bg-primary text-white border-primary"
                  : "border-gray-200 text-gray-600 hover:border-accent hover:text-accent"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => handlePage(page + 1)}
            disabled={page === totalPages}
            className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-sm text-gray-500 hover:border-accent hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
