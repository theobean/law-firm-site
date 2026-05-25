"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Scale } from "lucide-react";

const localeConfig = {
  el: { flag: "gr", label: "ΕΛ" },
  en: { flag: "gb", label: "EN" },
  de: { flag: "de", label: "DE" },
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
      className={`flex items-center gap-1.5 transition-all duration-200
        ${compact ? "px-2 py-1.5" : "px-2.5 py-1.5"}
        ${active ? "bg-accent/15" : "hover:bg-white/8"}
        ${bordered ? "border-l border-white/15" : ""}
      `}
    >
      {/* Flag */}
      <span className={`block overflow-hidden rounded-[2px] shadow-sm transition-all duration-200 shrink-0
        ${active ? "ring-1 ring-accent/70" : "opacity-60 group-hover:opacity-90"}
        ${compact ? "w-[20px] h-[13px]" : "w-[22px] h-[15px]"}
      `}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://flagcdn.com/w40/${flag}.png`}
          alt={label}
          width={40}
          height={27}
          className="w-full h-full object-cover"
        />
      </span>
      {/* Label */}
      <span className={`font-semibold tracking-widest leading-none transition-colors duration-200
        ${compact ? "text-[9px]" : "text-[10px]"}
        ${active ? "text-accent" : "text-white/50"}
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
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 md:gap-3 text-white min-w-0">
          <Scale size={24} className="text-accent shrink-0 md:w-7 md:h-7" />
          <div className="w-px h-7 bg-accent/60 shrink-0" />
          <div className="leading-tight min-w-0">
            <p className="font-playfair font-bold text-sm md:text-lg uppercase tracking-wide md:tracking-wider truncate">{t("about.name")}</p>
            <p className="text-[10px] md:text-xs text-white/60 tracking-widest uppercase truncate">{t("common.firmTagline")}</p>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-white/80 hover:text-accent transition-colors text-sm font-medium"
            >
              {l.label}
            </Link>
          ))}
          {/* Desktop language switcher */}
          <div className="ml-4 flex items-center border border-white/20 rounded-sm overflow-hidden">
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
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-4">
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
