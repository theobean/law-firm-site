"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLocale } from "next-intl";

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

      <div className="relative max-w-5xl mx-auto px-6">
        <div ref={ref} className="flex items-start gap-8">
          <div
            className="shrink-0 w-1 bg-accent self-stretch"
            style={
              visible
                ? { animation: "slide-from-left 0.5s cubic-bezier(0.4,0,0.2,1) both" }
                : { opacity: 0 }
            }
          />
          <p
            className="font-playfair text-3xl md:text-4xl lg:text-5xl text-white leading-snug"
            style={
              visible
                ? { animation: "slide-from-left 0.7s cubic-bezier(0.4,0,0.2,1) 0.1s both" }
                : { opacity: 0 }
            }
          >
            {t("cases")}
          </p>
        </div>

        <div
          className="mt-16"
          style={
            visible
              ? { animation: "slide-from-left 0.7s cubic-bezier(0.4,0,0.2,1) 0.35s both" }
              : { opacity: 0 }
          }
        >
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
