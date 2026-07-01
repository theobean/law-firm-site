"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Scale, ChevronDown, ChevronRight, FileText, Tv, BookOpen, Landmark, Handshake } from "lucide-react";

const localeConfig = {
  el: { flag: "/flags/gr.svg", label: "ΕΛ" },
  en: { flag: "/flags/gb.svg", label: "EN" },
  de: { flag: "/flags/de.svg", label: "DE" },
} as const;

function FlagImg({ locale: l, size = "md" }: { locale: "el" | "en" | "de"; size?: "sm" | "md" }) {
  const { flag, label } = localeConfig[l];
  return (
    <span className={`block overflow-hidden rounded-[2px] shadow-sm shrink-0 ${size === "sm" ? "w-[16px] h-[11px]" : "w-[20px] h-[13px]"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={flag} alt={label} width={40} height={27} className="w-full h-full object-cover" />
    </span>
  );
}

function LangDropdown({ switchLocale }: { switchLocale: (l: string) => void }) {
  const locale = useLocale() as "el" | "en" | "de";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const others = (["el", "en", "de"] as const).filter((l) => l !== locale);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 border border-white/20 rounded-sm hover:border-accent/50 transition-colors"
      >
        <FlagImg locale={locale} />
        <span className="text-[9px] font-bold tracking-wider text-accent">{localeConfig[locale].label}</span>
        <ChevronDown
          size={11}
          className={`text-white/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div className={`absolute top-full right-0 mt-1.5 w-24 bg-primary border border-white/10 shadow-xl rounded-sm overflow-hidden transition-all duration-150 z-50 ${
        open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
      }`}>
        {others.map((l) => (
          <button
            key={l}
            onClick={() => { switchLocale(l); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-white/70 hover:text-accent hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
          >
            <FlagImg locale={l} size="sm" />
            <span className="text-[10px] font-bold tracking-wider">{localeConfig[l].label}</span>
          </button>
        ))}
      </div>
    </div>
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
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [mobileUpdatesOpen, setMobileUpdatesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const servicesCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function switchLocale(target: string) {
    document.cookie = `locale-pref=${target}; max-age=${60 * 60 * 24 * 30}; path=/; samesite=lax`;
    const newPath = pathname.replace(`/${locale}`, `/${target}`);
    router.push(newPath);
  }

  // Rendered BEFORE the Services/Updates dropdowns
  const links = [
    { href: "/", label: tNav("home") },
    { href: `/about`, label: tNav("about") },
    { href: `/practice-areas`, label: tNav("practiceAreas") },
  ];

  // Rendered AFTER the dropdowns (support + conversion last)
  const endLinks = [
    { href: `/faq`, label: tNav("faq") },
    { href: `/contact`, label: tNav("contact") },
  ];

  const fundsSubLinks = [
    { href: `/funds/dovalue`, label: "doValue" },
    { href: `/funds/intrum`, label: "Intrum" },
    { href: `/funds/cepal`, label: "Cepal" },
    { href: `/funds/qquant`, label: "QQuant" },
  ];

  const bankingLawSubLinks = [
    { href: `/funds`, label: tNav("funds"), subLinks: fundsSubLinks },
    { href: `/pleistariasmos`, label: tNav("pleistariasmos"), subLinks: null },
  ];

  const servicesLinks = [
    { href: `/practice-areas/banking`, label: tNav("bankingLaw"), icon: Landmark, subLinks: bankingLawSubLinks },
    { href: `/exodikastikos`, label: tNav("exodikastikos"), icon: Handshake, subLinks: null },
  ];

  const updatesLinks = [
    { href: `/blog`, label: tNav("blog"), icon: BookOpen },
    { href: `/media`, label: tNav("media"), icon: Tv },
    { href: `/decisions`, label: tNav("decisions"), icon: FileText },
  ];

  const isUpdatesActive = updatesLinks.some((l) => pathname.startsWith(l.href));

  function handleMouseEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setDropdownOpen(true);
  }
  function handleMouseLeave() {
    closeTimer.current = setTimeout(() => setDropdownOpen(false), 120);
  }
  function handleServicesMouseEnter() {
    if (servicesCloseTimer.current) clearTimeout(servicesCloseTimer.current);
    setServicesDropdownOpen(true);
  }
  function handleServicesMouseLeave() {
    servicesCloseTimer.current = setTimeout(() => setServicesDropdownOpen(false), 120);
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
              <p className="font-playfair font-bold text-sm md:text-base uppercase tracking-wide truncate">{t("about.name")}</p>
              <p className="text-[9px] md:text-[10px] text-white/60 tracking-widest uppercase truncate">{t("common.firmTagline")}</p>
            </div>
          </button>
        ) : (
          <Link href="/" className="flex items-center gap-2 text-white min-w-0 shrink">
            <Scale size={22} className="text-accent shrink-0" />
            <div className="w-px h-6 bg-accent/60 shrink-0" />
            <div className="leading-tight min-w-0">
              <p className="font-playfair font-bold text-sm md:text-base uppercase tracking-wide truncate">{t("about.name")}</p>
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

          {/* Υπηρεσίες dropdown */}
          <div
            className="relative"
            onMouseEnter={handleServicesMouseEnter}
            onMouseLeave={handleServicesMouseLeave}
          >
            <button className={`flex items-center gap-1 text-sm font-medium whitespace-nowrap transition-colors ${
              servicesLinks.some((l) => pathname.startsWith(l.href)) ? "text-accent" : "text-white/80 hover:text-accent"
            }`}>
              {tNav("services")}
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${servicesDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-primary border border-white/10 shadow-xl rounded-sm transition-all duration-150 ${
              servicesDropdownOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
            }`}>
              {servicesLinks.map(({ href, label, icon: Icon, subLinks }) => {
                const itemClass = `flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors ${
                  pathname.startsWith(href) ? "text-accent bg-accent/10" : "text-white/80 hover:text-accent hover:bg-white/5"
                }`;
                if (!subLinks) {
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setServicesDropdownOpen(false)}
                      className={`${itemClass} border-b border-white/5 last:border-0`}
                    >
                      <Icon size={13} className="shrink-0 opacity-70" />
                      {label}
                    </Link>
                  );
                }
                return (
                  <div key={href} className="relative group/sub border-b border-white/5 last:border-0">
                    <Link
                      href={href}
                      onClick={() => setServicesDropdownOpen(false)}
                      className={itemClass}
                    >
                      <Icon size={13} className="shrink-0 opacity-70" />
                      {label}
                      <ChevronRight size={12} className="ml-auto shrink-0 opacity-60" />
                    </Link>
                    {/* Flyout submenu */}
                    <div className="absolute left-full top-0 w-36 bg-primary border border-white/10 shadow-xl rounded-sm opacity-0 -translate-x-1 pointer-events-none transition-all duration-150 group-hover/sub:opacity-100 group-hover/sub:translate-x-0 group-hover/sub:pointer-events-auto">
                      {subLinks.map((sub) => {
                        const subClass = `flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b border-white/5 last:border-0 ${
                          pathname.startsWith(sub.href) ? "text-accent bg-accent/10" : "text-white/80 hover:text-accent hover:bg-white/5"
                        }`;
                        if (!sub.subLinks) {
                          return (
                            <Link key={sub.href} href={sub.href} onClick={() => setServicesDropdownOpen(false)} className={subClass}>
                              {sub.label}
                            </Link>
                          );
                        }
                        return (
                          <div key={sub.href} className="relative group/sub2 border-b border-white/5 last:border-0">
                            <Link href={sub.href} onClick={() => setServicesDropdownOpen(false)} className={subClass}>
                              {sub.label}
                              <ChevronRight size={11} className="ml-auto shrink-0 opacity-60" />
                            </Link>
                            {/* Nested flyout: named funds */}
                            <div className="absolute left-full top-0 w-32 bg-primary border border-white/10 shadow-xl rounded-sm overflow-hidden opacity-0 -translate-x-1 pointer-events-none transition-all duration-150 group-hover/sub2:opacity-100 group-hover/sub2:translate-x-0 group-hover/sub2:pointer-events-auto">
                              {sub.subLinks.map((leaf) => (
                                <Link
                                  key={leaf.href}
                                  href={leaf.href}
                                  onClick={() => setServicesDropdownOpen(false)}
                                  className={`block px-4 py-2.5 text-sm font-medium transition-colors border-b border-white/5 last:border-0 ${
                                    pathname.startsWith(leaf.href) ? "text-accent bg-accent/10" : "text-white/80 hover:text-accent hover:bg-white/5"
                                  }`}
                                >
                                  {leaf.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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

          {/* End links (FAQ + Contact) — after dropdowns */}
          {endLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-white/80 hover:text-accent transition-colors text-sm font-medium whitespace-nowrap"
            >
              {l.label}
            </Link>
          ))}

          {/* Language dropdown */}
          <LangDropdown switchLocale={switchLocale} />
        </div>

        {/* Mobile right: language dropdown + hamburger */}
        <div className="md:hidden flex items-center gap-3 shrink-0">
          <LangDropdown switchLocale={switchLocale} />
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

          {/* Υπηρεσίες accordion in mobile */}
          <button
            onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
            className={`flex items-center justify-between w-full font-medium py-2.5 border-b border-white/10 transition-colors ${
              servicesLinks.some((l) => pathname.startsWith(l.href)) ? "text-accent" : "text-white/80"
            }`}
          >
            {tNav("services")}
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${mobileServicesOpen ? "rotate-180 text-accent" : "text-white/40"}`}
            />
          </button>
          <div className={`overflow-hidden transition-all duration-200 ${mobileServicesOpen ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"}`}>
            {servicesLinks.map(({ href, label, icon: Icon, subLinks }) => (
              <div key={href}>
                <Link
                  href={href}
                  onClick={() => { setOpen(false); setMobileServicesOpen(false); }}
                  className="flex items-center gap-2 text-white/70 hover:text-accent transition-colors text-sm py-2 pl-4 border-b border-white/5"
                >
                  <Icon size={13} className="shrink-0" />
                  {label}
                </Link>
                {subLinks &&
                  subLinks.map((sub) => (
                    <div key={sub.href}>
                      <Link
                        href={sub.href}
                        onClick={() => { setOpen(false); setMobileServicesOpen(false); }}
                        className="flex items-center gap-2 text-white/60 hover:text-accent transition-colors text-sm py-2 pl-10 border-b border-white/5"
                      >
                        <ChevronRight size={11} className="shrink-0 opacity-60" />
                        {sub.label}
                      </Link>
                      {sub.subLinks &&
                        sub.subLinks.map((leaf) => (
                          <Link
                            key={leaf.href}
                            href={leaf.href}
                            onClick={() => { setOpen(false); setMobileServicesOpen(false); }}
                            className="flex items-center gap-2 text-white/50 hover:text-accent transition-colors text-sm py-2 pl-16 border-b border-white/5"
                          >
                            <ChevronRight size={10} className="shrink-0 opacity-50" />
                            {leaf.label}
                          </Link>
                        ))}
                    </div>
                  ))}
              </div>
            ))}
          </div>

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

          {/* End links (FAQ + Contact) — after dropdowns */}
          {endLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-accent transition-colors font-medium py-2.5 border-b border-white/10"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
