"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Scale } from "lucide-react";

const localeConfig = {
  el: { flag: "/flags/gr.svg", label: "ΕΛ" },
  en: { flag: "/flags/gb.svg", label: "EN" },
  de: { flag: "/flags/de.svg", label: "DE" },
} as const;

function FlagButton({
  locale: l,
  active,
  onClick,
  bordered,
  compact,
}: {
  locale: "el" | "en" | "de";
  active: boolean;
  onClick: () => void;
  bordered: boolean;
  compact?: boolean;
}) {
  const { flag, label } = localeConfig[l];
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1 transition-all duration-200
        ${compact ? "px-1.5 py-1.5" : "px-2 py-1.5"}
        ${active ? "bg-accent/15" : "hover:bg-white/10"}
        ${bordered ? "border-l border-white/15" : ""}
      `}
    >
      {/* Flag */}
      <span className={`block overflow-hidden rounded-[2px] shadow-sm transition-all duration-200 shrink-0
        ${active ? "ring-1 ring-accent/80" : "opacity-70"}
        ${compact ? "w-[18px] h-[12px]" : "w-[20px] h-[13px]"}
      `}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={flag}
          alt={label}
          width={40}
          height={27}
          className="w-full h-full object-cover"
        />
      </span>
      {/* Label */}
      <span className={`font-bold tracking-wider leading-none transition-colors duration-200
        ${compact ? "text-[8px]" : "text-[9px]"}
        ${active ? "text-accent" : "text-white/60"}
      `}>
        {label}
      </span>
    </button>
  );
}

export default function Navbar() {
  const t = useTranslations();
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const locales = ["el", "en", "de"] as const;

  function switchLocale(target: string) {
    document.cookie = `locale-pref=${target}; max-age=${60 * 60 * 24 * 30}; path=/; samesite=lax`;
    const newPath = pathname.replace(`/${locale}`, `/${target}`);
    router.push(newPath);
  }

  const links = [
    { href: `/${locale}`, label: tNav("home") },
    { href: `/${locale}/about`, label: tNav("about") },
    { href: `/${locale}/practice-areas`, label: tNav("practiceAreas") },
    { href: `/${locale}/blog`, label: tNav("blog") },
    { href: `/${locale}/faq`, label: tNav("faq") },
    { href: `/${locale}/media`, label: tNav("media") },
    { href: `/${locale}/contact`, label: tNav("contact") },
  ];

  return (
    <header className="grain sticky top-0 z-50 bg-primary shadow-md relative overflow-hidden">
      {/* Top bar */}
      <div className="bg-primary/90 border-b border-white/10 text-white/60 text-sm hidden md:block">
        <div className="max-w-6xl mx-auto px-6 py-2 flex justify-between">
          <span>+30 2310 545 261</span>
          <span>iopapaio@gmail.com</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo — scroll to top on home, navigate home on other pages */}
        {pathname === `/${locale}` ? (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 text-white shrink-0 cursor-pointer"
          >
            <Scale size={22} className="text-accent shrink-0" />
            <div className="w-px h-6 bg-accent/60 shrink-0" />
            <div className="leading-tight text-left">
              <p className="font-playfair font-bold text-sm md:text-base uppercase tracking-wide whitespace-nowrap">{t("about.name")}</p>
              <p className="text-[9px] md:text-[10px] text-white/60 tracking-widest uppercase">{t("common.firmTagline")}</p>
            </div>
          </button>
        ) : (
          <Link href={`/${locale}`} className="flex items-center gap-2 text-white shrink-0">
            <Scale size={22} className="text-accent shrink-0" />
            <div className="w-px h-6 bg-accent/60 shrink-0" />
            <div className="leading-tight">
              <p className="font-playfair font-bold text-sm md:text-base uppercase tracking-wide whitespace-nowrap">{t("about.name")}</p>
              <p className="text-[9px] md:text-[10px] text-white/60 tracking-widest uppercase">{t("common.firmTagline")}</p>
            </div>
          </Link>
        )}

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-white/80 hover:text-accent transition-colors text-sm font-medium whitespace-nowrap"
            >
              {l.label}
            </Link>
          ))}
          {/* Desktop language switcher */}
          <div className="ml-2 flex items-center border border-white/20 rounded-sm overflow-hidden">
            {locales.map((l, i) => (
              <FlagButton
                key={l}
                locale={l}
                active={l === locale}
                onClick={() => switchLocale(l)}
                bordered={i > 0}
              />
            ))}
          </div>
        </div>

        {/* Mobile right: language + hamburger */}
        <div className="md:hidden flex items-center gap-3">
          <div className="flex items-center border border-white/20 rounded-sm overflow-hidden">
            {locales.map((l, i) => (
              <FlagButton
                key={l}
                locale={l}
                active={l === locale}
                onClick={() => switchLocale(l)}
                bordered={i > 0}
                compact
              />
            ))}
          </div>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            className="text-white"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`md:hidden bg-primary border-t border-white/10 overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 pt-4 pb-8 flex flex-col gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-accent transition-colors font-medium py-2 border-b border-white/10"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
