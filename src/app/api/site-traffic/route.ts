import { isBrowserTraffic, recordTrafficRequest, trafficDay, trafficRecordingEnabled } from "@/lib/traffic";
import { recordTrafficBounce } from "@/lib/traffic-bounce";
import { isTrafficSource } from "@/lib/traffic-source";
import { recordTrafficEntrySource } from "@/lib/traffic-sources";

function emptyResponse(status: number, receipt?: Record<string, string>) {
  return new Response(null, { status, headers: { "Cache-Control": "no-store", ...receipt } });
}

function validPath(pathname: string | null) {
  return pathname !== null && pathname.length > 0 && pathname.length <= 403 && !/[?#]/.test(pathname);
}

function validEntryDay(day: string, today: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day.startsWith("0000-") || day > today) return false;
  const time = Date.parse(`${day}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === day;
}

export async function POST(request: Request) {
  const { headers } = request;
  const fetchSite = headers.get("sec-fetch-site");
  if (headers.get("origin") !== new URL(request.url).origin ||
      (fetchSite !== null && fetchSite !== "same-origin")) {
    return emptyResponse(403);
  }

  const page = headers.get("x-traffic-page");
  const entry = headers.get("x-traffic-entry");
  const entryDay = headers.get("x-traffic-entry-day");
  const source = headers.get("x-traffic-source");
  const today = trafficDay();

  if (page !== null) {
    if (!validPath(page) || entry !== null || entryDay !== null || source !== null) return emptyResponse(400);
    if (trafficRecordingEnabled() && isBrowserTraffic(headers) && await recordTrafficRequest(page, today)) {
      return emptyResponse(204, { "X-Traffic-Page-Recorded": "1" });
    }
  } else {
    if (entry === null || !validPath(entry) || (entryDay !== null && !validEntryDay(entryDay, today))) {
      return emptyResponse(400);
    }
    if (source !== null && (entryDay !== null || !isTrafficSource(source))) return emptyResponse(400);
    if (trafficRecordingEnabled() && isBrowserTraffic(headers)) {
      const recorded = source === null
        ? await recordTrafficBounce(entry, entryDay ?? today, entryDay !== null)
        : await recordTrafficEntrySource(entry, today, source);
      if (recorded && entryDay === null) return emptyResponse(204, { "X-Traffic-Entry-Day": today });
    }
  }
  return emptyResponse(204);
}
