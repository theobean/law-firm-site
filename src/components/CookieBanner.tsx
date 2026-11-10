"use client";

import { useEffect, useState } from "react";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { Cookie } from "lucide-react";
import { setCookieConsent } from "@/lib/cookie-consent.mjs";
import useCookieConsent from "./useCookieConsent";

const REOPEN_EVENT = "cookie-banner:reopen";

export default function CookieBanner() {
  const t = useTranslations("cookies");
  const consent = useCookieConsent();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    const onReopen = () => setSettingsOpen(true);
    window.addEventListener(REOPEN_EVENT, onReopen);
    return () => window.removeEventListener(REOPEN_EVENT, onReopen);
  }, []);

  function saveChoice(choice: "accepted" | "rejected") {
    const saved = setCookieConsent(choice);
    setStorageError(!saved);
    if (saved) setSettingsOpen(false);
  }

  if (consent !== null && !settingsOpen && !storageError) return null;

  return (
    <div role="region" aria-label={t("label")} className="bg-primary/95 backdrop-blur-md text-white border-t border-accent/40 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
      <div className="max-w-6xl mx-auto px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">

          {/* Left: icon + text */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="hidden md:flex w-10 h-10 rounded-full bg-accent/15 items-center justify-center flex-shrink-0">
              <Cookie className="text-accent" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] md:text-[13.5px] leading-relaxed text-white/85">
                {t("message")}{" "}
                <Link
                  href={`/privacy`}
                  className="text-accent/90 hover:text-accent underline underline-offset-2"
                >
                  {t("learnMore")}
                </Link>
              </p>
              {storageError && <p role="status" className="mt-2 text-[13px] leading-relaxed text-white/85">{t("storageError")}</p>}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex flex-wrap items-center gap-2.5 md:flex-shrink-0">
            <button
              type="button"
              onClick={() => saveChoice("rejected")}
              className="flex-1 bg-accent hover:bg-accent/90 text-primary text-[13px] font-semibold px-5 py-2 border border-accent rounded-sm transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t("reject")}
            </button>
            <button
              type="button"
              onClick={() => saveChoice("accepted")}
              className="flex-1 bg-accent hover:bg-accent/90 text-primary text-[13px] font-semibold px-5 py-2 border border-accent rounded-sm transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t("accept")}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export function openCookieSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(REOPEN_EVENT));
}
