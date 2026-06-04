"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, GraduationCap } from "lucide-react";

type MemberKey = "georgios" | "lamprinι";

const initials: Record<MemberKey, string> = {
  georgios: "ΛΓ",
  "lamprinι": "ΠΛ",
};

const PREVIEW_COUNT = 2;

export default function MemberBioSection({
  memberKey,
  bg = "white",
}: {
  memberKey: MemberKey;
  bg?: "white" | "gray";
}) {
  const t = useTranslations("team");
  const [expanded, setExpanded] = useState(false);

  const name = t(`${memberKey}.name`);
  const role = t(`${memberKey}.role`);
  const edu = t.raw(`${memberKey}.edu`) as string[];
  const specializations = t.raw(`${memberKey}.specializations`) as string[];
  const paragraphs = t.raw(`${memberKey}.bioParagraphs`) as string[];

  const preview = paragraphs.slice(0, PREVIEW_COUNT);
  const rest = paragraphs.slice(PREVIEW_COUNT);

  const bgClass = bg === "gray" ? "bg-gray-50" : "bg-white";

  return (
    <section className={`${bgClass} py-20 border-t border-gray-100`}>
      <div className="max-w-6xl mx-auto px-6">

        {/* Section label */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-px bg-accent" />
          <p className="text-accent text-sm font-semibold tracking-widest uppercase">{name}</p>
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-12 items-start">

          {/* Left: monogram + identity */}
          <div className="flex flex-col items-center md:items-start gap-4 md:sticky md:top-24">
            <div className="relative w-48 md:w-full aspect-[3/4] rounded-sm overflow-hidden shadow-lg bg-primary">
              <span className="absolute inset-0 flex items-center justify-center font-playfair font-bold text-8xl text-accent opacity-20 select-none">
                {initials[memberKey]}
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
            </div>
            <div className="text-center md:text-left">
              <h2 className="font-playfair font-bold text-xl text-primary">{name}</h2>
              <p className="text-accent text-xs font-semibold tracking-wide uppercase mt-1">{role}</p>
            </div>

            {/* Specializations */}
            {specializations.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {specializations.map((s, i) => (
                  <span key={i} className="text-[10px] font-semibold tracking-wide bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-sm">
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Education */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary/50 mb-1">
                <GraduationCap size={13} />
                {t("educationLabel")}
              </div>
              {edu.map((item, i) => (
                <p key={i} className="text-gray-500 text-xs leading-snug border-l-2 border-accent/30 pl-3">{item}</p>
              ))}
            </div>
          </div>

          {/* Right: paragraphs */}
          <div className="flex flex-col gap-5">
            {preview.map((p, i) => (
              <p key={i} className="text-gray-700 leading-relaxed text-[15px]">{p}</p>
            ))}

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
