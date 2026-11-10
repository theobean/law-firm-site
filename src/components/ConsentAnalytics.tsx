"use client";

import { useEffect } from "react";
import { Analytics, type BeforeSend } from "@vercel/analytics/next";
import { hasAnalyticsConsent, loadGoogleAnalytics, markOptionalServiceStarted } from "@/lib/cookie-consent.mjs";
import useCookieConsent from "./useCookieConsent";

const beforeSend: BeforeSend = (event) => hasAnalyticsConsent() ? event : null;

export default function ConsentAnalytics() {
  const consent = useCookieConsent();

  useEffect(() => {
    if (consent !== "accepted") return;
    markOptionalServiceStarted();
    loadGoogleAnalytics();
  }, [consent]);

  return consent === "accepted" ? <Analytics beforeSend={beforeSend} /> : null;
}
