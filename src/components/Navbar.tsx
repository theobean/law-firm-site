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
            className="ml-4 text-xs font-bold border border-white/30 text-white/70 hover:border-accent hover:text-accent px-3 py-1 rounded transition-colors"
          >
            {otherLocale.toUpperCase()}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
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
          <button
            onClick={() => { switchLocale(); setOpen(false); }}
            className="text-left text-sm font-bold text-accent"
          >
            {otherLocale === "el" ? "Ελληνικά" : "English"}
          </button>
        </div>
      </div>
    </header>
  );
}
