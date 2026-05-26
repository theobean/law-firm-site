"use client";

import { useState } from "react";
import { FileText, Download, Eye, Calendar, Landmark, Tag } from "lucide-react";
import { useTranslations } from "next-intl";

interface Decision {
  _id: string;
  title: string;
  fileUrl: string | null;
  date?: string;
  court?: string;
  category?: string;
  description?: string;
}

const categoryColors: Record<string, string> = {
  banking: "bg-blue-50 text-blue-700 border-blue-200",
  extrajudicial: "bg-emerald-50 text-emerald-700 border-emerald-200",
  criminal: "bg-red-50 text-red-700 border-red-200",
  commercial: "bg-amber-50 text-amber-700 border-amber-200",
  realEstate: "bg-orange-50 text-orange-700 border-orange-200",
  administrative: "bg-purple-50 text-purple-700 border-purple-200",
  inheritance: "bg-teal-50 text-teal-700 border-teal-200",
  tax: "bg-indigo-50 text-indigo-700 border-indigo-200",
  labor: "bg-rose-50 text-rose-700 border-rose-200",
};

function DecisionCard({ decision, locale }: { decision: Decision; locale: string }) {
  const t = useTranslations("decisions");

  const formattedDate = decision.date
    ? new Date(decision.date).toLocaleDateString(
        locale === "el" ? "el-GR" : locale === "de" ? "de-DE" : "en-GB",
        { day: "numeric", month: "long", year: "numeric" }
      )
    : null;

  const categoryLabel = decision.category
    ? t(`categories.${decision.category}`)
    : null;

  const colorClass = decision.category
    ? categoryColors[decision.category] ?? "bg-gray-50 text-gray-600 border-gray-200"
    : "";

  return (
    <div className="flex flex-col border border-gray-100 rounded-sm p-6 hover:border-accent/40 hover:shadow-md transition-all duration-300 group bg-white">
      {/* Top row: icon + category badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="w-10 h-10 rounded-sm bg-primary/8 border border-primary/10 flex items-center justify-center shrink-0 group-hover:bg-accent/10 group-hover:border-accent/20 transition-colors">
          <FileText size={18} className="text-primary/60 group-hover:text-accent transition-colors" />
        </div>
        {categoryLabel && (
          <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-sm border ${colorClass}`}>
            {categoryLabel}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-primary font-semibold text-base leading-snug mb-3 group-hover:text-accent transition-colors">
        {decision.title}
      </h3>

      {/* Meta */}
      <div className="flex flex-col gap-1.5 mb-4">
        {decision.court && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Landmark size={11} className="shrink-0" />
            <span>{decision.court}</span>
          </div>
        )}
        {formattedDate && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar size={11} className="shrink-0" />
            <span>{formattedDate}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {decision.description && (
        <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2">
          {decision.description}
        </p>
      )}

      {/* Actions */}
      {decision.fileUrl && (
        <div className="mt-auto flex gap-2">
          <a
            href={decision.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-accent hover:bg-accent/90 px-3 py-2 rounded-sm transition-colors"
          >
            <Eye size={12} />
            {t("view")}
          </a>
          <a
            href={`${decision.fileUrl}?dl=`}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/20 hover:border-accent hover:text-accent px-3 py-2 rounded-sm transition-colors"
          >
            <Download size={12} />
            {t("download")}
          </a>
        </div>
      )}
    </div>
  );
}

export default function DecisionsGrid({
  decisions,
  locale,
}: {
  decisions: Decision[];
  locale: string;
}) {
  const t = useTranslations("decisions");
  const tPA = useTranslations("decisions.categories");

  const allCategories = [
    "banking", "extrajudicial", "criminal", "commercial",
    "realEstate", "administrative", "inheritance", "tax", "labor",
  ];

  const presentCategories = allCategories.filter((c) =>
    decisions.some((d) => d.category === c)
  );

  const [active, setActive] = useState<string | null>(null);

  const filtered = active ? decisions.filter((d) => d.category === active) : decisions;

  if (decisions.length === 0) {
    return (
      <p className="text-gray-400 text-center py-20">{t("empty")}</p>
    );
  }

  return (
    <div>
      {/* Category filter chips */}
      {presentCategories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setActive(null)}
            className={`px-4 py-1.5 rounded-sm text-sm font-medium border transition-colors ${
              active === null
                ? "bg-primary text-white border-primary"
                : "text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
            }`}
          >
            Όλες
          </button>
          {presentCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(active === cat ? null : cat)}
              className={`px-4 py-1.5 rounded-sm text-sm font-medium border transition-colors ${
                active === cat
                  ? "bg-primary text-white border-primary"
                  : "text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
              }`}
            >
              {tPA(cat as Parameters<typeof tPA>[0])}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((d) => (
          <DecisionCard key={d._id} decision={d} locale={locale} />
        ))}
      </div>
    </div>
  );
}
