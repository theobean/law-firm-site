"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// This survives layout remounts in the same document, such as a language change.
let lastPathname: string | undefined;

export default function TrafficNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === lastPathname) return;
    const isDocumentLoad = lastPathname === undefined;
    lastPathname = pathname;
    if (isDocumentLoad) return; // The server counts the document request.

    void fetch("/api/site-traffic", {
      method: "POST",
      headers: { "X-Traffic-Page": pathname },
      credentials: "omit",
      mode: "same-origin",
      referrerPolicy: "origin",
      redirect: "error",
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
