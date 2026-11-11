import { neon } from "@neondatabase/serverless";
import { publicTrafficPage } from "./traffic";
import { recordTrafficBounce } from "./traffic-bounce";
import { isTrafficSource, type TrafficSource } from "./traffic-source";
import type { TrafficFilters } from "./traffic-dashboard/report";

export type { TrafficSource } from "./traffic-source";
export type TrafficSourceTotal = { source: TrafficSource; entries: number };

export async function recordTrafficEntrySource(pathname: string, day: string, source: TrafficSource) {
  const connection = process.env.TRAFFIC_WRITE_DATABASE_URL;
  if (!connection) return false;
  const entry = await publicTrafficPage(pathname);
  if (!entry) return false;
  try {
    await neon(connection).query(
      "SELECT site_traffic.record_entry_source($1::date, $2::text, $3::text, $4::text)",
      [day, entry.locale, entry.page, source],
      { fetchOptions: { signal: AbortSignal.timeout(2500) } },
    );
    return true;
  } catch (error) {
    // These schema errors roll back the entry. Ambiguous failures cannot be retried.
    if (error instanceof Error && "code" in error && (error.code === "42883" || error.code === "42P01")) {
      return recordTrafficBounce(pathname, day, false);
    }
    return false;
  }
}

export async function readTrafficSources(filters: TrafficFilters): Promise<TrafficSourceTotal[] | undefined> {
  const connection = process.env.TRAFFIC_READ_DATABASE_URL;
  if (!connection) return;
  const rows = await neon(connection).query(
    `SELECT source, SUM(entries)::text AS entries
       FROM site_traffic.daily_sources
      WHERE day BETWEEN $1::date AND $2::date
        AND ($3::text = '' OR locale = $3::text)
        AND ($4::text = '' OR page = $4::text)
      GROUP BY source`,
    [filters.day || filters.from, filters.day || filters.to, filters.lang, filters.page],
    { fetchOptions: { signal: AbortSignal.timeout(5000) } },
  );
  return rows.flatMap(({ source, entries }) =>
    isTrafficSource(source) ? [{ source, entries: Number(entries) }] : [],
  );
}
