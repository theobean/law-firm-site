"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Tv, Calendar } from "lucide-react";
import { getYouTubeId, getThumbnailUrl, getEmbedUrl } from "@/lib/youtube";
import { useTranslations } from "next-intl";

interface Interview {
  _id: string;
  title: string;
  youtubeUrl: string;
  show?: string;
  date?: string;
  description?: string;
}

function InterviewCard({ interview, locale }: { interview: Interview; locale: string }) {
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const id = getYouTubeId(interview.youtubeUrl);
  const thumbnail = id ? getThumbnailUrl(id) : null;
  const embedUrl = id ? getEmbedUrl(id) : null;

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

  const formattedDate = interview.date
    ? new Date(interview.date).toLocaleDateString(
        locale === "el" ? "el-GR" : locale === "de" ? "de-DE" : "en-GB",
        { day: "numeric", month: "long", year: "numeric" }
      )
    : null;

  return (
    <div
      ref={ref}
      style={visible ? { animation: "reveal-up 0.5s cubic-bezier(0.4,0,0.2,1) both" } : { opacity: 0 }}
      className="flex flex-col rounded-sm overflow-hidden border border-white/10 bg-white/5 hover:border-accent/40 transition-all duration-300 hover:shadow-xl hover:shadow-black/30 group"
    >
      {/* Video / Thumbnail */}
      <div className="relative aspect-video bg-black overflow-hidden">
        {playing && embedUrl ? (
          <iframe
            src={embedUrl}
            title={interview.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : thumbnail ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnail}
              alt={interview.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />
            <button
              onClick={() => setPlaying(true)}
              aria-label="Αναπαραγωγή"
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="w-16 h-16 rounded-full bg-accent/90 hover:bg-accent flex items-center justify-center shadow-lg shadow-black/50 transition-all duration-200 hover:scale-110 group-hover:scale-105">
                <Play size={28} className="text-white ml-1" fill="white" />
              </span>
            </button>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/80">
            <Tv size={40} className="text-white/20" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {(interview.show || formattedDate) && (
          <div className="flex items-center gap-3 text-white/50 text-xs">
            {interview.show && (
              <span className="flex items-center gap-1 text-accent font-semibold">
                <Tv size={11} />
                {interview.show}
              </span>
            )}
            {interview.show && formattedDate && <span>·</span>}
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {formattedDate}
              </span>
            )}
          </div>
        )}
        <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2">
          {interview.title}
        </h3>
        {interview.description && (
          <p className="text-white/50 text-xs leading-relaxed line-clamp-2">
            {interview.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function MediaGrid({ interviews, locale }: { interviews: Interview[]; locale: string }) {
  const t = useTranslations("media");

  if (interviews.length === 0) {
    return <p className="text-white/40 text-center py-20">{t("empty")}</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {interviews.map((iv) => (
        <InterviewCard key={iv._id} interview={iv} locale={locale} />
      ))}
    </div>
  );
}
