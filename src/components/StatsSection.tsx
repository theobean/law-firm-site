"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLocale } from "next-intl";

const stats = [
  { value: "25+", key: "experience" },
  { value: "1000+", key: "cases" },
  { value: "350+", key: "clients" },
  { value: "9", key: "areas" },
] as const;

export default function StatsSection() {
  const t = useTranslations("stats");
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative bg-primary/95 py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary" />

      <div className="relative max-w-6xl mx-auto px-6">
        <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, key }, i) => (
            <div
              key={key}
              className="border-l-2 border-accent pl-6"
              style={
                visible
                  ? { animation: `reveal-left 0.6s cubic-bezier(0.4,0,0.2,1) ${i * 0.15}s both` }
                  : { opacity: 0 }
              }
            >
              <p className="text-4xl md:text-5xl font-playfair font-bold text-white mb-2">
                {value}
              </p>
              <p className="text-white/60 text-sm leading-tight">{t(key)}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href={`/${locale}/contact`}
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-10 py-4 rounded-sm transition-colors text-lg"
          >
            {t("cta")} →
          </Link>
        </div>
      </div>
    </section>
  );
}
