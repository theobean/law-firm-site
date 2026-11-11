import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["el", "en", "de"],
  defaultLocale: "el",
  // Only pages with translated content declare alternates in their HTML metadata.
  alternateLinks: false,
});
