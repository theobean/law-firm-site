"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/navigation";
import { useTranslations } from "next-intl";
import { X, ArrowRight, AlertTriangle, Home } from "lucide-react";
import { propertyContactHref, type PropertyContactSource } from "@/lib/property-contact";

const SESSION_KEY = "urgent-cta-dismissed";
const PROPERTY_SESSION_KEY = "property-cta-dismissed";
const propertyRoutes: Partial<Record<string, PropertyContactSource>> = {
  "/practice-areas/realEstate": "thessaloniki",
  "/practice-areas/realEstate/agora-akinitou-athina": "athens",
  "/practice-areas/realEstate/agora-neodmitou": "new-build",
  "/practice-areas/realEstate/golden-visa-property": "golden-visa",
  "/blog/agora-akiniton-vimata": "purchase-guide",
  "/blog/prokatavoli-agora-akinitou": "deposit-guide",
};

export default function UrgentCTABar() {
  const t = useTranslations("urgentCta");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const propertySource = propertyRoutes[pathname];
  const propertyContact = pathname === "/contact" &&
    searchParams.getAll("service").length === 1 &&
    searchParams.get("service") === "property-purchase";
  const sessionKey = propertyContact ? null : propertySource ? PROPERTY_SESSION_KEY : SESSION_KEY;
  const [visibleKey, setVisibleKey] = useState<string | null>(null);
  const visible = sessionKey !== null && visibleKey === sessionKey;

  useEffect(() => {
    if (!sessionKey || sessionStorage.getItem(sessionKey)) return;
    const timer = setTimeout(() => setVisibleKey(sessionKey), 1200);
    return () => clearTimeout(timer);
  }, [sessionKey]);

  if (!sessionKey) return null;

  const dismiss = () => {
    setVisibleKey(null);
    sessionStorage.setItem(sessionKey, "1");
  };
  const href = propertySource ? propertyContactHref(propertySource) : "/contact";
  const title = t(propertySource ? "propertyText" : "text");
  const subtitle = t(propertySource ? "propertySub" : "sub");
  const action = t(propertySource ? "propertyCta" : "cta");
  const Icon = propertySource ? Home : AlertTriangle;

  return (
    <div
      inert={!visible}
      aria-hidden={!visible}
      className={`overflow-hidden transition-[max-height] duration-500 ease-out ${
        visible ? "max-h-60" : "max-h-0"
      }`}
    >
      <div className="bg-primary border-t-2 border-accent shadow-2xl">

        {/* ── MOBILE layout ── */}
        <div className="sm:hidden px-3 pt-2.5 pb-3 relative">
          <button
            type="button"
            onClick={dismiss}
            aria-label={t("close")}
            className="absolute top-1.5 right-1.5 text-white/40 hover:text-white/80 transition-colors p-1.5"
          >
            <X size={14} />
          </button>
          <div className="flex items-start gap-2 mb-2 pr-7">
            <Icon size={16} className="text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-white text-[12.5px] leading-snug font-medium">{title}</p>
          </div>
          <Link
            href={href}
            onClick={dismiss}
            className="flex items-center justify-center gap-1.5 bg-accent text-primary text-xs font-bold tracking-wide uppercase px-3 py-2.5 rounded-sm hover:bg-accent/90 transition-colors w-full"
          >
            {action}
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* ── DESKTOP layout ── */}
        <div className="hidden sm:flex max-w-6xl mx-auto px-4 py-3 items-center gap-4">
          <div className="w-1 self-stretch bg-accent rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-snug">{title}</p>
            <p className="text-white/60 text-xs mt-0.5 leading-snug">{subtitle}</p>
          </div>
          <Link
            href={href}
            onClick={dismiss}
            className="flex-shrink-0 flex items-center gap-1.5 bg-accent text-primary text-xs font-bold tracking-wide uppercase px-4 py-2.5 rounded-sm hover:bg-accent/90 transition-colors whitespace-nowrap"
          >
            {action}
            <ArrowRight size={13} />
          </Link>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t("close")}
            className="flex-shrink-0 text-white/40 hover:text-white/80 transition-colors p-1"
          >
            <X size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
