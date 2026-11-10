"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Play, X } from "lucide-react";
import { getCookieConsent, markOptionalServiceStarted, subscribeCookieConsent } from "@/lib/cookie-consent.mjs";

export default function ExternalEmbed({ src, title, provider, sourceUrl, video = false, compact = false }: {
  src: string;
  title: string;
  provider: string;
  sourceUrl: string;
  video?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("externalContent");
  const [loaded, setLoaded] = useState(false);
  const loadButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(false);

  useEffect(() => subscribeCookieConsent(() => {
    if (getCookieConsent() !== "accepted") setLoaded(false);
  }), []);
  useEffect(() => {
    if (loaded) markOptionalServiceStarted();
    else if (restoreFocusRef.current) {
      loadButtonRef.current?.focus({ preventScroll: true });
      restoreFocusRef.current = false;
    }
  }, [loaded]);

  if (loaded) return (
    <div className="relative w-full h-full">
      <iframe
        src={src}
        title={title}
        className="w-full h-full border-0"
        allow={video ? "autoplay; encrypted-media; picture-in-picture" : undefined}
        allowFullScreen
        referrerPolicy="no-referrer"
      />
      <button type="button" onClick={() => { restoreFocusRef.current = true; setLoaded(false); }} aria-label={t("close", { provider })}
        className="absolute top-2 right-2 rounded-sm bg-primary text-white p-2 shadow-lg border border-white/30">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center gap-2 bg-primary text-white text-center ${compact ? "p-3" : "p-5"}`}>
      <p className={`text-white/80 leading-relaxed ${compact ? "text-[11px]" : "text-sm"}`}>{t("notice", { provider })}</p>
      <button ref={loadButtonRef} type="button" onClick={() => setLoaded(true)}
        className="inline-flex items-center justify-center gap-2 rounded-sm border border-accent bg-accent text-primary px-3 py-2 text-xs font-semibold">
        {video && <Play size={14} aria-hidden="true" />} {t("load", { provider })}
      </button>
      <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-white/75 underline underline-offset-2">{t("openExternal")}</a>
    </div>
  );
}
