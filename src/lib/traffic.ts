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

export function trafficRecordingEnabled() {
  return process.env.VERCEL_ENV === "production" && Boolean(process.env.TRAFFIC_WRITE_DATABASE_URL);
}

export function isBrowserTraffic(headers: Headers) {
  // The agent string is used only for this check. The counter never stores it.
  const agent = headers.get("user-agent");
  return Boolean(agent && !knownBot.test(agent));
}

export function canRecordTraffic(method: string, headers: Headers) {
  if (!trafficRecordingEnabled()) return false;
  if (method !== "GET" || !headers.get("accept")?.includes("text/html")) return false;
  if (prefetchHeaders.some(header => headers.has(header))) return false;
  const purpose = (headers.get("purpose") ?? "") + " " + (headers.get("sec-purpose") ?? "");
  if (/prefetch|prerender/i.test(purpose)) return false;

  const destination = headers.get("sec-fetch-dest");
  const mode = headers.get("sec-fetch-mode");
  if (destination !== null && destination !== "document") return false;
  if (mode !== null && mode !== "navigate") return false;

  return isBrowserTraffic(headers);
}

export async function publicTrafficPage(pathname: string) {
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
    return { locale, page: path || "/" };
  } catch {
    // The CMS can be unavailable. Skip unverified paths.
  }
}

export async function recordTrafficRequest(pathname: string, day: string) {
  const connection = process.env.TRAFFIC_WRITE_DATABASE_URL;
  if (!connection) return false;
  const page = await publicTrafficPage(pathname);
  if (!page) return false;
  try {
    await neon(connection).query(
      "SELECT site_traffic.record_request($1::date, $2::text, $3::text)",
      [day, page.locale, page.page],
      { fetchOptions: { signal: AbortSignal.timeout(2500) } },
    );
    return true;
  } catch {
    // Reporting outages must not block the site. Avoid logging request details.
    return false;
  }
}

export async function readTrafficCounts(from: string, to: string): Promise<{
  firstRecordedDay: string | null;
  rows: TrafficCount[];
}> {
  const connection = process.env.TRAFFIC_READ_DATABASE_URL;
  if (!connection) throw new Error("traffic_database_unavailable");
  const result = await neon(connection).query(
    `WITH coverage AS (
       SELECT MIN(day)::text AS first_recorded_day FROM site_traffic.daily_counts
     )
     SELECT counts.day::text AS day, counts.locale, counts.page, counts.hits::text AS hits, coverage.first_recorded_day
     FROM coverage
     LEFT JOIN site_traffic.daily_counts AS counts ON counts.day BETWEEN $1::date AND $2::date
     ORDER BY counts.day, counts.locale, counts.page`,
    [from, to],
    { fetchOptions: { signal: AbortSignal.timeout(5000) } },
  );
  return {
    firstRecordedDay: result[0]?.first_recorded_day ?? null,
    rows: result.flatMap(({ day, locale, page, hits }) => day ? [{ day, locale, page, count: Number(hits) }] : []),
  };
}
