import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function AboutTeaser() {
  const t = useTranslations("about");
  const locale = useLocale();

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Photo */}
          <div className="relative order-2 md:order-1">
            <div className="aspect-square max-w-sm mx-auto rounded-sm overflow-hidden relative">
              <Image
                src="/γραφειο.png"
                alt={t("teaser")}
                fill
                className="object-cover object-center"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 w-full h-full border-2 border-accent/30 rounded-sm -z-10" />
          </div>

          {/* Text */}
          <div className="order-1 md:order-2">
            <div className="border-l-4 border-accent pl-6 mb-8">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-primary">
                {t("teaser")}
              </h2>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed mb-4">{t("bio1")}</p>
            <p className="text-gray-500 leading-relaxed mb-8">{t("teaserSub")}</p>
            <Link
              href={`/${locale}/about`}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-4 rounded-sm transition-colors"
            >
              {t("teaserCta")} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
