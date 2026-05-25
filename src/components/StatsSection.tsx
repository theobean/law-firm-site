"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

const stats = [
  { value: "20+", key: "experience" },
  { value: "500+", key: "cases" },
  { value: "350+", key: "clients" },
  { value: "8", key: "areas" },
] as const;

export default function StatsSection() {
  const t = useTranslations("stats");
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

      <div ref={ref} className="relative max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, key }, i) => (
            <div
              key={key}
              className="border-l-2 border-accent pl-6 transition-all duration-700"
              style={{
                transitionDelay: `${i * 150}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0)" : "translateX(-40px)",
              }}
            >
              <p className="text-4xl md:text-5xl font-playfair font-bold text-white mb-2">
                {value}
              </p>
              <p className="text-white/60 text-sm leading-tight">{t(key)}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-10 py-4 rounded-sm transition-colors text-lg"
          >
            {t("cta")} →
          </a>
        </div>
      </div>
    </section>
  );
}
