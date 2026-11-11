import { neon } from "@neondatabase/serverless";
import { publicTrafficPage } from "./traffic";
import type { TrafficFilters } from "./traffic-dashboard/report";

export type TrafficBounceSummary = { entries: number; continued: number };

export async function recordTrafficBounce(pathname: string, day: string, continued: boolean) {
  const connection = process.env.TRAFFIC_WRITE_DATABASE_URL;
  if (!connection) return false;
  const entry = await publicTrafficPage(pathname);
  if (!entry) return false;
  try {
    await neon(connection).query(
      "SELECT site_traffic.record_bounce($1::date, $2::text, $3::text, $4::boolean)",
      [day, entry.locale, entry.page, continued],
      { fetchOptions: { signal: AbortSignal.timeout(2500) } },
    );
    return true;
  } catch {
    // Keep bounce measurement independent of pageview reporting.
    return false;
  }
}

export async function readTrafficBounce(filters: TrafficFilters): Promise<TrafficBounceSummary | undefined> {
  const connection = process.env.TRAFFIC_READ_DATABASE_URL;
  if (!connection) return;
  const from = filters.day || filters.from;
  const to = filters.day || filters.to;
  const [summary] = await neon(connection).query(
    `SELECT CASE WHEN EXISTS (SELECT 1 FROM site_traffic.daily_bounce WHERE day <= $2::date)
                 THEN COALESCE(SUM(entries), 0)::text END AS entries,
            COALESCE(SUM(continued), 0)::text AS continued
       FROM site_traffic.daily_bounce
      WHERE day BETWEEN $1::date AND $2::date
        AND ($3::text = '' OR locale = $3::text)
        AND ($4::text = '' OR page = $4::text)`,
    [from, to, filters.lang, filters.page],
    { fetchOptions: { signal: AbortSignal.timeout(5000) } },
  );
  if (summary?.entries == null) return;
  return { entries: Number(summary.entries), continued: Number(summary.continued) };
}
