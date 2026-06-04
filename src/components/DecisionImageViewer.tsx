"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

interface DecisionImage { url: string; width?: number; height?: number; }

function Lightbox({ images, startIndex, title, onClose }: {
  images: DecisionImage[]; startIndex: number; title: string; onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const [mounted, setMounted] = useState(false);
  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", handler); };
  }, [onClose, prev, next]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black flex" onClick={onClose}>
      {images.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors">
          <ChevronLeft size={26} />
        </button>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[idx].url} alt={`${title} — εικόνα ${idx + 1}`}
        onClick={(e) => e.stopPropagation()} className="w-full h-full object-contain" />
      {images.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors">
          <ChevronRight size={26} />
        </button>
      )}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        {images.length > 1 && <span className="text-white/60 text-sm">{idx + 1} / {images.length}</span>}
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors">
          <X size={20} />
        </button>
      </div>
    </div>,
    document.body
  );
}

export default function DecisionImageViewer({ images, title }: { images: DecisionImage[]; title: string }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  return (
    <>
      {lightboxIdx !== null && (
        <Lightbox images={images} startIndex={lightboxIdx} title={title} onClose={() => setLightboxIdx(null)} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setLightboxIdx(i)}
            className="relative aspect-[3/4] overflow-hidden rounded-sm border border-gray-200 hover:border-accent group transition-colors"
            aria-label={`Εικόνα ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={`${title} — σελίδα ${i + 1}`}
              className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-102" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ZoomIn size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-sm">
              {i + 1} / {images.length}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
