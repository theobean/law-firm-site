"use client";

import { useSyncExternalStore } from "react";
import { getCookieConsent, subscribeCookieConsent } from "@/lib/cookie-consent.mjs";

const getServerConsent = () => null;

export default function useCookieConsent() {
  return useSyncExternalStore(subscribeCookieConsent, getCookieConsent, getServerConsent);
}
