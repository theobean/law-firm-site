import { createHash, timingSafeEqual } from "node:crypto";
import { readTrafficCounts, trafficDay, type TrafficCount } from "@/lib/traffic";
import { readTrafficBounce } from "@/lib/traffic-bounce";
import { trafficFilters, trafficReport } from "@/lib/traffic-dashboard/report";
import { renderDashboard, renderDashboardNotice } from "@/lib/traffic-dashboard/render";

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

function csvField(value: string | number) {
  const text = String(value);
  // Spreadsheet programs may evaluate certain imported strings as formulas.
  const literal = /^[=+\-@\t\r\n]/.test(text) ? "'" + text : text;
  return '"' + literal.replaceAll('"', '""') + '"';
}

function csvResponse(rows: TrafficCount[], from: string, to: string) {
  const lines = [
    "date,language,page,requests",
    ...rows.map(row => [row.day, row.locale, row.page, row.count].map(csvField).join(",")),
  ];
  return new Response("\uFEFF" + lines.join("\r\n") + "\r\n", {
    headers: {
      ...dashboardHeaders,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="traffic-${from}-${to}.csv"`,
    },
  });
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
  const filters = trafficFilters(today, params);
  const invalidRange = params.get("period") === "custom" && filters.period !== "custom";
  const download = params.get("format") === "csv";
  if (download && invalidRange) {
    return new Response(renderDashboardNotice("Επίλεξε έγκυρη περίοδο για την εξαγωγή CSV."), {
      status: 400,
      headers: dashboardHeaders,
    });
  }
  try {
    const [{ firstRecordedDay, rows }, bounce] = await Promise.all([
      readTrafficCounts(filters.previousFrom, filters.to),
      download ? undefined : readTrafficBounce(filters).catch(() => undefined),
    ]);
    const report = trafficReport(filters, firstRecordedDay, rows);
    if (download) {
      return csvResponse(report.detailRows, filters.day || filters.from, filters.day || filters.to);
    }
    return new Response(renderDashboard(report, today, invalidRange, bounce), { headers: dashboardHeaders });
  } catch {
    return new Response(renderDashboardNotice("Τα στατιστικά δεν είναι διαθέσιμα αυτή τη στιγμή."), {
      status: 503,
      headers: dashboardHeaders,
    });
  }
}
