import { hasAnalyticsConsent } from "./cookie-consent.mjs";

const propertyContactSources = [
  "thessaloniki",
  "athens",
  "new-build",
  "purchase-guide",
  "deposit-guide",
  "golden-visa",
] as const;

export type PropertyContactSource = (typeof propertyContactSources)[number];
type PropertyContactEvent = "generate_lead" | "phone_click";

const propertyPurchaseService = "property-purchase";

export function getPropertyContactSource(value: unknown): PropertyContactSource | undefined {
  return propertyContactSources.find((source) => source === value);
}

export function propertyContactHref(source: PropertyContactSource) {
  return {
    pathname: "/contact",
    query: { service: propertyPurchaseService, source },
    hash: "contact-form",
  };
}

export function trackPropertyContact(
  event: PropertyContactEvent,
  source?: PropertyContactSource,
): void {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;

  const analyticsWindow = window as Window & {
    gtag?: (
      command: "event",
      name: PropertyContactEvent,
      parameters: {
        service: typeof propertyPurchaseService;
        service_source: PropertyContactSource | "contact";
      },
    ) => void;
  };
  if (typeof analyticsWindow.gtag !== "function") return;

  try {
    analyticsWindow.gtag("event", event, {
      service: propertyPurchaseService,
      service_source: getPropertyContactSource(source) ?? "contact",
    });
  } catch {
    // Optional analytics must not interfere with contacting the office.
  }
}
