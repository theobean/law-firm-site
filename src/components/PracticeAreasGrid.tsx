import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Scale, ShieldCheck, Briefcase, Building, HardHat, Landmark, ScrollText, Calculator, ArrowRight } from "lucide-react";

const areaKeys = ["civil", "criminal", "commercial", "realEstate", "labor", "administrative", "inheritance", "tax"] as const;

const icons = {
  civil: Scale,
  criminal: ShieldCheck,
  commercial: Briefcase,
  realEstate: Building,
  labor: HardHat,
  administrative: Landmark,
  inheritance: ScrollText,
  tax: Calculator,
};

interface Props {
  preview?: boolean;
}

export default function PracticeAreasGrid({ preview = false }: Props) {
  const t = useTranslations("practiceAreas");
  const locale = useLocale();

  const areas = preview ? areaKeys.slice(0, 5) : areaKeys;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {preview && (
          <div className="mb-12 border-l-4 border-accent pl-6">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-primary">
              {t("title")}
            </h2>
            <p className="text-gray-500 text-xl mt-1">{t("subtitle")}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((key) => {
            const Icon = icons[key];
            return (
              <Link
                key={key}
                href={`/${locale}/practice-areas/${key}`}
                className="group bg-primary hover:bg-primary/90 p-8 rounded-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="mb-5 flex items-center justify-center w-12 h-12 rounded-sm bg-accent/15 border border-accent/30 group-hover:bg-accent/25 transition-colors">
                  <Icon className="text-accent" size={22} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2 border-b border-accent pb-2 inline-block">
                  {t(`areas.${key}.title`)}
                </h3>
                <p className="text-white/60 text-sm mt-3 leading-relaxed">
                  {t(`areas.${key}.desc`)}
                </p>
                <p className="text-accent text-xs mt-4 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t("viewAll")} <ArrowRight size={12} />
                </p>
              </Link>
            );
          })}
        </div>

        {preview && (
          <div className="mt-10 text-center">
            <Link
              href={`/${locale}/practice-areas`}
              className="inline-flex items-center gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold px-8 py-3 rounded-sm transition-colors"
            >
              {t("viewAll")} <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
