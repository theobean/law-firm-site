import { neon } from "@neondatabase/serverless";
import { getPublicContentPages, publicStaticPaths } from "./public-pages";

export type TrafficLocale = "el" | "en" | "de";
export type TrafficCount = { day: string; locale: TrafficLocale; page: string; count: number };

const dateFormat = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Athens", dateStyle: "short" });
const staticPages = new Set<string>([...publicStaticPaths, "/privacy", "/terms"]);
const knownBot = /bot|crawler|spider|slurp|headless|lighthouse|preview|curl|wget|python|facebookexternalhit|chatgpt-user|claude-user|perplexity-user/i;
const prefetchHeaders = ["rsc", "next-router-prefetch", "next-router-segment-prefetch", "x-middleware-prefetch", "x-nextjs-data"];

let publicContentCatalog: Promise<Set<string>> | undefined;
let publicContentExpiresAt = 0;

export function trafficDay(date = new Date()): string {
  return dateFormat.format(date);
}

function publicContentPaths() {
  if (!publicContentCatalog || Date.now() >= publicContentExpiresAt) {
    publicContentExpiresAt = Date.now() + 5 * 60_000;
    publicContentCatalog = getPublicContentPages().then(pages =>
      new Set(pages.flatMap(({ path, locales }) => locales.map(locale => "/" + locale + path))),
    );
  }
  return publicContentCatalog;
}

export function canRecordTraffic(method: string, headers: Headers) {
  if (process.env.VERCEL_ENV !== "production" || !process.env.TRAFFIC_WRITE_DATABASE_URL) return false;
  if (method !== "GET" || !headers.get("accept")?.includes("text/html")) return false;
  if (prefetchHeaders.some(header => headers.has(header))) return false;
  const purpose = (headers.get("purpose") ?? "") + " " + (headers.get("sec-purpose") ?? "");
  if (/prefetch|prerender/i.test(purpose)) return false;

  const destination = headers.get("sec-fetch-dest");
  const mode = headers.get("sec-fetch-mode");
  if (destination !== null && destination !== "document") return false;
  if (mode !== null && mode !== "navigate") return false;

  // The agent string is used only for this check. The counter never stores it.
  const agent = headers.get("user-agent");
  return Boolean(agent && !knownBot.test(agent));
}

export async function recordTrafficRequest(pathname: string, day: string) {
  const connection = process.env.TRAFFIC_WRITE_DATABASE_URL;
  if (!connection) return;
  const route = /^\/(el|en|de)(\/.*)?$/.exec(pathname);
  if (!route) return;
  const locale = route[1] as TrafficLocale;
  const path = (route[2] ?? "").replace(/%[a-f0-9]{2}/gi, escape => escape.toUpperCase());
  if (path.length > 400) return;

  try {
    if (!staticPages.has(path)) {
      if (!/^\/(blog|decisions|media)\/[^/]+$/.test(path)) return;
      if (!(await publicContentPaths()).has("/" + locale + path)) return;
    }
    await neon(connection).query(
      "SELECT site_traffic.record_request($1::date, $2::text, $3::text)",
      [day, locale, path || "/"],
      { fetchOptions: { signal: AbortSignal.timeout(2500) } },
    );
  } catch {
    // Reporting outages must not block the site. Avoid logging request details.
  }
}

export async function readTrafficCounts(from: string, to: string): Promise<TrafficCount[]> {
  const connection = process.env.TRAFFIC_READ_DATABASE_URL;
  if (!connection) throw new Error("traffic_database_unavailable");
  const rows = await neon(connection).query(
    "SELECT day::text, locale, page, hits::text FROM site_traffic.daily_counts WHERE day BETWEEN $1::date AND $2::date ORDER BY day, locale, page",
    [from, to],
    { fetchOptions: { signal: AbortSignal.timeout(5000) } },
  );
  return rows.map(({ day, locale, page, hits }) => ({ day, locale, page, count: Number(hits) }));
}
