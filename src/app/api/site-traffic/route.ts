import { isBrowserTraffic, recordTrafficRequest, trafficDay, trafficRecordingEnabled } from "@/lib/traffic";

function emptyResponse(status: number) {
  return new Response(null, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const { headers } = request;
  const fetchSite = headers.get("sec-fetch-site");
  if (headers.get("origin") !== new URL(request.url).origin ||
      (fetchSite !== null && fetchSite !== "same-origin")) {
    return emptyResponse(403);
  }

  // Only the pathname is supplied. The existing writer checks it against the public site.
  const pathname = headers.get("x-traffic-page");
  if (!pathname || pathname.length > 403 || /[?#]/.test(pathname)) return emptyResponse(400);

  if (trafficRecordingEnabled() && isBrowserTraffic(headers)) {
    await recordTrafficRequest(pathname, trafficDay());
  }
  return emptyResponse(204);
}
