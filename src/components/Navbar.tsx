"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Scale, ChevronDown, FileText, Tv, BookOpen } from "lucide-react";

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
      <span className={`block overflow-hidden rounded-[2px] shadow-sm transition-all duration-200 shrink-0
        ${active ? "ring-1 ring-accent/80" : "opacity-70"}
        ${compact ? "w-[18px] h-[12px]" : "w-[20px] h-[13px]"}
      `}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={flag} alt={label} width={40} height={27} className="w-full h-full object-cover" />
      </span>
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileUpdatesOpen, setMobileUpdatesOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    { href: `/${locale}/faq`, label: tNav("faq") },
    { href: `/${locale}/contact`, label: tNav("contact") },
  ];

  const updatesLinks = [
    { href: `/${locale}/blog`, label: tNav("blog"), icon: BookOpen },
    { href: `/${locale}/media`, label: tNav("media"), icon: Tv },
    { href: `/${locale}/decisions`, label: tNav("decisions"), icon: FileText },
  ];

  const isUpdatesActive = updatesLinks.some((l) => pathname.startsWith(l.href));

  function handleMouseEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setDropdownOpen(true);
  }
  function handleMouseLeave() {
    closeTimer.current = setTimeout(() => setDropdownOpen(false), 120);
  }

  return (
    <header className="grain sticky top-0 z-50 bg-primary shadow-md relative overflow-visible">
      {/* Top bar */}
      <div className="bg-primary/90 border-b border-white/10 text-white/60 text-sm hidden md:block">
        <div className="max-w-6xl mx-auto px-6 py-2 flex justify-between">
          <span>+30 2310 545 261</span>
          <span>iopapaio@gmail.com</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        {pathname === `/${locale}` ? (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 text-white min-w-0 shrink cursor-pointer"
          >
            <Scale size={22} className="text-accent shrink-0" />
            <div className="w-px h-6 bg-accent/60 shrink-0" />
            <div className="leading-tight text-left min-w-0">
              <p className="font-playfair font-bold text-sm md:text-base uppercase tracking-wide whitespace-nowrap">{t("about.name")}</p>
              <p className="text-[9px] md:text-[10px] text-white/60 tracking-widest uppercase truncate">{t("common.firmTagline")}</p>
            </div>
          </button>
        ) : (
          <Link href={`/${locale}`} className="flex items-center gap-2 text-white min-w-0 shrink">
            <Scale size={22} className="text-accent shrink-0" />
            <div className="w-px h-6 bg-accent/60 shrink-0" />
            <div className="leading-tight min-w-0">
              <p className="font-playfair font-bold text-sm md:text-base uppercase tracking-wide whitespace-nowrap">{t("about.name")}</p>
              <p className="text-[9px] md:text-[10px] text-white/60 tracking-widest uppercase truncate">{t("common.firmTagline")}</p>
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

          {/* Ενημέρωση dropdown */}
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button className={`flex items-center gap-1 text-sm font-medium whitespace-nowrap transition-colors ${
              isUpdatesActive ? "text-accent" : "text-white/80 hover:text-accent"
            }`}>
              {tNav("updates")}
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown panel */}
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 bg-primary border border-white/10 shadow-xl rounded-sm overflow-hidden transition-all duration-150 ${
              dropdownOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
            }`}>
              {updatesLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setDropdownOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors border-b border-white/5 last:border-0 ${
                    pathname.startsWith(href) ? "text-accent bg-accent/10" : "text-white/80 hover:text-accent hover:bg-white/5"
                  }`}
                >
                  <Icon size={13} className="shrink-0 opacity-70" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Language switcher */}
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
        <div className="md:hidden flex items-center gap-3 shrink-0">
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
          open ? "max-h-[40rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 pt-4 pb-8 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-accent transition-colors font-medium py-2.5 border-b border-white/10"
            >
              {l.label}
            </Link>
          ))}

          {/* Ενημέρωση accordion in mobile */}
          <button
            onClick={() => setMobileUpdatesOpen(!mobileUpdatesOpen)}
            className={`flex items-center justify-between w-full font-medium py-2.5 border-b border-white/10 transition-colors ${
              isUpdatesActive ? "text-accent" : "text-white/80"
            }`}
          >
            {tNav("updates")}
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${mobileUpdatesOpen ? "rotate-180 text-accent" : "text-white/40"}`}
            />
          </button>
          <div className={`overflow-hidden transition-all duration-200 ${mobileUpdatesOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
            {updatesLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => { setOpen(false); setMobileUpdatesOpen(false); }}
                className="flex items-center gap-2 text-white/70 hover:text-accent transition-colors text-sm py-2 pl-4 border-b border-white/5"
              >
                <Icon size={13} className="shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
