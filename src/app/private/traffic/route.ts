import { createHash, timingSafeEqual } from "node:crypto";
import { readTrafficCounts, trafficDay } from "@/lib/traffic";
import {
  dateRange,
  renderDashboard,
  renderDashboardNotice,
} from "@/lib/traffic-dashboard/render";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const dashboardHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Type": "text/html; charset=utf-8",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function authorized(header: string | null, password: string) {
  if (!header || header.length > 1024) return false;
  const credentials = /^Basic ([A-Za-z0-9+/]+={0,2})$/i.exec(header)?.[1];
  if (!credentials) return false;

  const supplied = createHash("sha256").update(Buffer.from(credentials, "base64")).digest();
  const expected = createHash("sha256").update(`stats:${password}`).digest();
  return timingSafeEqual(supplied, expected);
}

export async function GET(request: Request) {
  const password = process.env.TRAFFIC_DASHBOARD_PASSWORD;
  if (!password) {
    return new Response(renderDashboardNotice("Ο πίνακας δεν έχει ενεργοποιηθεί."), {
      status: 503,
      headers: dashboardHeaders,
    });
  }

  if (!authorized(request.headers.get("authorization"), password)) {
    return new Response(renderDashboardNotice("Συνδέσου για να δεις τα στατιστικά."), {
      status: 401,
      headers: {
        ...dashboardHeaders,
        "WWW-Authenticate": 'Basic realm="Site traffic", charset="UTF-8"',
      },
    });
  }

  const params = new URL(request.url).searchParams;
  const today = trafficDay();
  const days = dateRange(today, params.get("period"));
  try {
    const rows = await readTrafficCounts(days[0], today);
    return new Response(renderDashboard(days, params, rows), { headers: dashboardHeaders });
  } catch {
    return new Response(renderDashboardNotice("Τα στατιστικά δεν είναι διαθέσιμα αυτή τη στιγμή."), {
      status: 503,
      headers: dashboardHeaders,
    });
  }
}
