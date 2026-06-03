"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";

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

  const anim = (delay: number) =>
    visible
      ? { animation: `slide-from-left 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}s both` }
      : { opacity: 0 };

  return (
    <section className="relative bg-primary py-28 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
        backgroundSize: "20px 20px"
      }} />

      <div className="relative max-w-4xl mx-auto px-6">
        <div ref={ref}>
          <p
            className="text-accent text-xs font-bold tracking-widest uppercase mb-8"
            style={anim(0)}
          >
            {t("eyebrow")}
          </p>

          <div className="border-l-4 border-accent pl-8" style={anim(0.15)}>
            <h2 className="font-playfair font-bold italic text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
              {t("cases")}
            </h2>
          </div>

          <div className="mt-14 pl-8" style={anim(0.35)}>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-4 rounded-sm transition-colors"
            >
              {t("cta")} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
