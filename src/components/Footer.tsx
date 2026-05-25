import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Scale, MapPin, Phone, Mail, Clock, ChevronRight } from "lucide-react";

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <footer className="grain relative overflow-hidden bg-primary text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
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
                { icon: MapPin, text: <>{t("contact.addressLine1")}<br />{t("contact.addressLine2")}</>, href: "https://maps.google.com/?q=Λέοντος+του+Σοφού+12,+54625+Θεσσαλονίκη", external: true },
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
