"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Scale } from "lucide-react";

export default function Navbar() {
  const t = useTranslations();
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const otherLocale = locale === "el" ? "en" : "el";

  function switchLocale() {
    // Replace /el/ or /en/ prefix in pathname
    const newPath = pathname.replace(`/${locale}`, `/${otherLocale}`);
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
    <header className="sticky top-0 z-50 bg-primary shadow-md">
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
        <Link href={`/${locale}`} className="flex items-center gap-2 text-white">
          <Scale size={28} className="text-accent" />
          <div className="leading-tight">
            <p className="font-playfair font-bold text-lg uppercase tracking-wider">{t("about.name")}</p>
            <p className="text-xs text-white/60 tracking-widest uppercase">{t("common.firmTagline")}</p>
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
          <button
            onClick={switchLocale}
            className="ml-4 text-xs font-bold border border-white/40 text-white bg-white/10 hover:bg-accent hover:border-accent active:scale-95 px-3 py-1.5 rounded transition-all"
          >
            {otherLocale.toUpperCase()}
          </button>
        </div>

        {/* Mobile right: language + hamburger */}
        <div className="md:hidden flex items-center gap-3">
          <button
            onClick={switchLocale}
            className="text-xs font-bold border border-white/40 text-white bg-white/10 hover:bg-accent hover:border-accent active:scale-95 px-3 py-1.5 rounded transition-all"
          >
            {otherLocale.toUpperCase()}
          </button>
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
