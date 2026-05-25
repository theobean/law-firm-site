import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

// Cookie set when user manually picks a language — geo won't override it
const PREF_COOKIE = "locale-pref";

const GERMAN_COUNTRIES = new Set(["DE", "AT", "CH", "LI"]);
const GREEK_COUNTRIES  = new Set(["GR", "CY"]);

function geoLocale(country: string | undefined): "el" | "en" | "de" {
  if (!country) return "el";
  if (GERMAN_COUNTRIES.has(country)) return "de";
  if (GREEK_COUNTRIES.has(country))  return "el";
  return "en";
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Already on a locale path (/el, /en, /de) — let next-intl handle it
  const hasLocale = /^\/(el|en|de)(\/|$)/.test(pathname);

  // User has manually chosen a language — respect it, skip geo
  const pref = request.cookies.get(PREF_COOKIE)?.value;

  if (!hasLocale && !pref) {
    // First visit on a non-locale path — detect geo and redirect
    // Vercel sets x-vercel-ip-country on edge; request.geo was removed in newer Next.js types
    const country = request.headers.get("x-vercel-ip-country") ?? undefined;
    const locale = geoLocale(country);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    const res = NextResponse.redirect(url);
    // Remember geo choice for 30 days (user can override via language switcher)
    res.cookies.set(PREF_COOKIE, locale, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });
    return res;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|.*\\.|studio|api).*)"],
};
