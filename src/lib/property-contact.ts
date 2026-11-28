const propertyContactSources = [
  "thessaloniki",
  "athens",
  "new-build",
  "purchase-guide",
  "deposit-guide",
] as const;

export type PropertyContactSource = (typeof propertyContactSources)[number];

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
