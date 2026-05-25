import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  const t = useTranslations("notFound");
  const locale = useLocale();

  return (
    <section className="min-h-[70vh] bg-primary flex items-center justify-center px-6 py-24">
      <div className="text-center max-w-md">
        <p className="font-playfair font-bold text-7xl md:text-8xl text-accent mb-2">404</p>
        <div className="w-16 h-1 bg-accent mx-auto mb-8" />
        <h1 className="text-3xl md:text-4xl font-playfair font-bold text-white mb-4">
          {t("title")}
        </h1>
        <p className="text-white/60 mb-10 leading-relaxed">{t("message")}</p>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-4 rounded-sm transition-colors"
        >
          <ArrowLeft size={16} /> {t("cta")}
        </Link>
      </div>
    </section>
  );
}
