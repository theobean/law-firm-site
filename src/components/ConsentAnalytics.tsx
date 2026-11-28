"use client";

import { useEffect } from "react";
import { Analytics, type BeforeSend } from "@vercel/analytics/next";
import { trackContactEvent } from "@/lib/contact-analytics";
import { hasAnalyticsConsent, loadGoogleAnalytics, markOptionalServiceStarted } from "@/lib/cookie-consent.mjs";
import { getPropertyContactSource } from "@/lib/property-contact";
import useCookieConsent from "./useCookieConsent";

const beforeSend: BeforeSend = (event) => hasAnalyticsConsent() ? event : null;

function onContactLinkClick(event: MouseEvent) {
  if (!(event.target instanceof Element)) return;
  const link = event.target.closest<HTMLAnchorElement>("a[href]");
  if (!link || (link.protocol !== "tel:" && link.protocol !== "mailto:")) return;

  const source = link.dataset.propertyContactSource;
  const propertySource = source === "contact" ? source : getPropertyContactSource(source);
  trackContactEvent(link.protocol === "tel:" ? "phone_click" : "email_click", propertySource);
}

export default function ConsentAnalytics() {
  const consent = useCookieConsent();

  useEffect(() => {
    if (consent !== "accepted") return;
    markOptionalServiceStarted();
    loadGoogleAnalytics();
    document.addEventListener("click", onContactLinkClick, true);
    return () => document.removeEventListener("click", onContactLinkClick, true);
  }, [consent]);

  return consent === "accepted" ? <Analytics beforeSend={beforeSend} /> : null;
}
