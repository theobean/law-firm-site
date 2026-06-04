"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

const PREVIEW_COUNT = 3;

export default function BiographySection() {
  const t = useTranslations("about");
  const [expanded, setExpanded] = useState(false);

  const paragraphs = t.raw("bioParagraphs") as string[];
  const preview = paragraphs.slice(0, PREVIEW_COUNT);
  const rest = paragraphs.slice(PREVIEW_COUNT);

  return (
    <section className="bg-gray-50 py-20 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6">

        {/* Section label */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-px bg-accent" />
          <p className="text-accent text-sm font-semibold tracking-widest uppercase">
            {t("bioSectionTitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-12 items-start">

          {/* Left: photo + identity */}
          <div className="flex flex-col items-center md:items-start gap-4 md:sticky md:top-24">
            <div className="relative w-48 md:w-full aspect-[3/4] rounded-sm overflow-hidden shadow-lg">
              <Image
                src="/δικηγορος.png"
                alt={t("name")}
                fill
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
            </div>
            <div className="text-center md:text-left">
              <h2 className="font-playfair font-bold text-xl text-primary">{t("name")}</h2>
              <p className="text-accent text-xs font-semibold tracking-wide uppercase mt-1">{t("role")}</p>
            </div>
          </div>

          {/* Right: paragraphs */}
          <div className="flex flex-col gap-5">

            {/* Always visible paragraphs */}
            {preview.map((p, i) => (
              <p key={i} className="text-gray-700 leading-relaxed text-[15px]">{p}</p>
            ))}

            {/* Expandable paragraphs */}
            {rest.length > 0 && (
              <>
                <div
                  className="grid transition-all duration-500 ease-in-out"
                  style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-col gap-5 pt-1">
                      {rest.map((p, i) => (
                        <p key={i} className="text-gray-700 leading-relaxed text-[15px]">{p}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setExpanded(!expanded)}
                  className="self-start flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent/80 transition-colors mt-1"
                >
                  {expanded ? t("bioReadLess") : t("bioReadMore")}
                  <ChevronDown
                    size={15}
                    className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
