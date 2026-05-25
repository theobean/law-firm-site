import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Scale, MapPin, Phone, Mail, Clock } from "lucide-react";

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <footer className="bg-primary text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo & tagline */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Scale size={28} className="text-accent" />
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
              <li className="flex items-start gap-3 text-white/60 text-sm">
                <MapPin size={16} className="text-accent flex-shrink-0 mt-0.5" />
                <span>{t("contact.addressLine1")}<br />{t("contact.addressLine2")}</span>
              </li>
              <li className="flex items-center gap-3 text-white/60 text-sm">
                <Phone size={16} className="text-accent flex-shrink-0" />
                <span>+30 2310 545 261</span>
              </li>
              <li className="flex items-center gap-3 text-white/60 text-sm">
                <Mail size={16} className="text-accent flex-shrink-0" />
                <span>iopapaio@gmail.com</span>
              </li>
              <li className="flex items-center gap-3 text-white/60 text-sm">
                <Clock size={16} className="text-accent flex-shrink-0" />
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
                { href: `/${locale}/contact`, label: t("nav.contact") },
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
              <div className="flex">
                {/* Facebook */}
                <a href="https://www.facebook.com/ioannis.papaioannou.94" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-12 h-12 bg-white/10 hover:bg-accent flex items-center justify-center rounded-sm transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
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
          </div>
        </div>
      </div>
    </footer>
  );
}
