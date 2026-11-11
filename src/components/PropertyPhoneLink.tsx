"use client";

import type { ReactNode } from "react";
import { trackPropertyContact, type PropertyContactSource } from "@/lib/property-contact";

export default function PropertyPhoneLink({
  href,
  source,
  className,
  children,
}: {
  href: `tel:${string}`;
  source?: PropertyContactSource;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={className} onClick={() => trackPropertyContact("phone_click", source)}>
      {children}
    </a>
  );
}
