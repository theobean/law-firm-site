"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trafficSource } from "@/lib/traffic-source";

// This survives layout remounts in the same document, such as a language change.
let lastPathname: string | undefined;
let entry: { pathname: string; day: Promise<string | null | undefined>; continued: boolean } | undefined;

function sendTraffic(headers: Record<string, string>) {
  return fetch("/api/site-traffic", {
    method: "POST",
    headers,
    credentials: "omit",
    mode: "same-origin",
    referrerPolicy: "origin",
    redirect: "error",
    keepalive: true,
  }).catch(() => undefined);
}

export default function TrafficNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === lastPathname) return;
    lastPathname = pathname;
    if (!entry) {
      // The server already counts the pageview. Register only the entry.
      const [navigation] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      const source = trafficSource(document.referrer, window.location.hostname, navigation?.type);
      const day = sendTraffic({ "X-Traffic-Entry": pathname, "X-Traffic-Source": source }).then(response =>
        response?.headers.get("X-Traffic-Entry-Day"),
      );
      entry = { pathname, day, continued: false };
      return;
    }

    const visit = entry;
    const pageview = sendTraffic({ "X-Traffic-Page": pathname });
    if (visit.continued || pathname === visit.pathname) return;
    void Promise.all([pageview, visit.day]).then(([response, day]) => {
      if (visit.continued || !day || !response?.headers.has("X-Traffic-Page-Recorded")) return;
      // Wait for both writes to succeed and record at most one continuation.
      visit.continued = true;
      return sendTraffic({ "X-Traffic-Entry": visit.pathname, "X-Traffic-Entry-Day": day });
    });
  }, [pathname]);

  return null;
}
