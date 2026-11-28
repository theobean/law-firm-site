import { hasAnalyticsConsent } from "./cookie-consent.mjs";
import type { PropertyContactSource } from "./property-contact";

type ContactEvent = "generate_lead" | "phone_click" | "email_click";
type ContactEventParameters = {
  service?: "property-purchase";
  service_source?: PropertyContactSource | "contact";
  debug_mode?: true;
};

export function trackContactEvent(event: ContactEvent, propertySource?: PropertyContactSource | "contact"): void {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;

  const analyticsWindow = window as Window & {
    gtag?: (command: "event", name: ContactEvent, parameters: ContactEventParameters) => void;
  };
  const parameters: ContactEventParameters = {};
  if (propertySource) {
    parameters.service = "property-purchase";
    parameters.service_source = propertySource;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") parameters.debug_mode = true;

  try {
    analyticsWindow.gtag?.("event", event, parameters);
  } catch {
    // Optional analytics must not interfere with contacting the office.
  }
}
