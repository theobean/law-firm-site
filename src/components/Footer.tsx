"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Scale, MapPin, Phone, Mail, Clock, ChevronRight } from "lucide-react";
import { openCookieSettings } from "./CookieBanner";

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <footer className="grain relative overflow-hidden bg-primary text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Logo & tagline */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Scale size={28} className="text-accent" />
              <div className="w-px h-8 bg-accent/60" />
              <div>
                <p className="font-playfair font-bold text-lg uppercase tracking-wider">{t("about.name")}</p>
                <p className="text-xs text-white/50 tracking-widest uppercase">{t("common.firmTagline")}</p>
              </div>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              {t("footer.description")}
            </p>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="font-bold text-white mb-6 text-sm tracking-widest uppercase border-b border-white/10 pb-3">
              {t("nav.contact")}
            </h3>
            <ul className="space-y-4">
              {[
                { icon: MapPin, text: <>{t("contact.addressLine1")}<br />{t("contact.addressLine2")}</>, href: "https://maps.google.com/?cid=10350029232005631470", external: true },
                { icon: Phone, text: "+30 2310 545 261", href: "tel:+302310545261", external: false },
                { icon: Mail, text: "iopapaio@gmail.com", href: "mailto:iopapaio@gmail.com", external: false },
              ].map(({ icon: Icon, text, href, external }) => (
                <li key={href}>
                  <a
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="flex items-center justify-between gap-3 text-white/70 text-sm group
                      bg-white/5 hover:bg-white/10 active:bg-white/5
                      border border-white/10 hover:border-accent/40 active:border-accent/20
                      rounded-sm px-4 py-3
                      shadow-[0_3px_0_0_rgba(0,0,0,0.4)] hover:shadow-[0_3px_0_0_rgba(200,146,42,0.3)]
                      active:shadow-none active:translate-y-[3px]
                      transition-all duration-150"
                  >
                    <div className="flex gap-3 items-center">
                      <Icon size={15} className="text-accent flex-shrink-0" />
                      <span>{text}</span>
                    </div>
                    <ChevronRight size={13} className="flex-shrink-0 text-accent/50 group-hover:text-accent transition-colors" />
                  </a>
                </li>
              ))}
              <li className="flex items-center gap-3 text-white/50 text-sm px-4 py-2">
                <Clock size={15} className="text-accent flex-shrink-0" />
                <span>{t("contact.hoursValue")}</span>
              </li>
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-bold text-white mb-6 text-sm tracking-widest uppercase border-b border-white/10 pb-3">
              {t("nav.navigation")}
            </h3>
            <ul className="space-y-3">
              {[
                { href: `/${locale}`, label: t("nav.home") },
                { href: `/${locale}/about`, label: t("nav.about") },
                { href: `/${locale}/practice-areas`, label: t("nav.practiceAreas") },
                { href: `/${locale}/blog`, label: t("nav.blog") },
                { href: `/${locale}/decisions`, label: t("nav.decisions") },
                { href: `/${locale}/faq`, label: t("nav.faq") },
                { href: `/${locale}/contact`, label: t("nav.contact") },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/60 hover:text-accent text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services / Servicers */}
          <div>
            <h3 className="font-bold text-white mb-6 text-sm tracking-widest uppercase border-b border-white/10 pb-3">
              {t("footer.servicesHeader")}
            </h3>
            <ul className="space-y-3">
              {[
                { href: `/${locale}/pleistariasmos`, label: t("footer.firstResidence") },
                { href: `/${locale}/funds`, label: t("nav.funds") },
                { href: `/${locale}/funds/intrum`, label: "Intrum" },
                { href: `/${locale}/funds/dovalue`, label: "doValue" },
                { href: `/${locale}/funds/cepal`, label: "Cepal" },
                { href: `/${locale}/funds/qquant`, label: "QQuant" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/60 hover:text-accent text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>


            {/* Social */}
            <div className="mt-8 flex flex-col items-start">
              <p className="text-white/40 text-xs mb-3">{t("footer.social")}</p>
              <div className="flex gap-3">
                {/* Facebook */}
                <a href="https://www.facebook.com/IoannisPapaioannouLawyer" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 bg-white/10 hover:bg-accent flex items-center justify-center rounded-sm transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                {/* TikTok */}
                <a href="https://www.tiktok.com/@papaioannoudikigoros" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-10 h-10 bg-white/10 hover:bg-accent flex items-center justify-center rounded-sm transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/></svg>
                </a>
                {/* Instagram */}
                <a href="https://www.instagram.com/papaioannoudikigoros/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 bg-white/10 hover:bg-accent flex items-center justify-center rounded-sm transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                {/* LinkedIn */}
                <a href="https://www.linkedin.com/in/%CE%B9%CF%89%CE%AC%CE%BD%CE%BD%CE%B7%CF%82-%CF%80%CE%B1%CF%80%CE%B1%CF%8A%CF%89%CE%AC%CE%BD%CE%BD%CE%BF%CF%85-367845416/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-10 h-10 bg-white/10 hover:bg-accent flex items-center justify-center rounded-sm transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.24 8h4.52v12.5H.24V8zm7.5 0h4.33v1.71h.06c.6-1.14 2.07-2.34 4.26-2.34 4.56 0 5.4 3 5.4 6.9v6.23h-4.52v-5.52c0-1.32-.02-3.02-1.84-3.02-1.84 0-2.12 1.44-2.12 2.92v5.62H7.74V8z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-white/40 text-xs">
          <span>© {new Date().getFullYear()} {t("about.name")}. {t("footer.rights")}</span>
          <div className="flex gap-4">
            <Link href={`/${locale}/privacy`} className="hover:text-accent transition-colors">{t("footer.privacy")}</Link>
            <Link href={`/${locale}/terms`} className="hover:text-accent transition-colors">{t("footer.terms")}</Link>
            <button onClick={openCookieSettings} className="hover:text-accent transition-colors">{t("cookies.settings")}</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
