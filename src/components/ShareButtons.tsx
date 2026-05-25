"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: Props) {
  const t = useTranslations("blog");
  const [copied, setCopied] = useState(false);

  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const twUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  const btn =
    "w-10 h-10 flex items-center justify-center rounded-sm bg-gray-100 hover:bg-accent hover:text-white text-gray-600 transition-colors";

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm text-gray-500 font-semibold">{t("share")}:</span>

      <a href={fbUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={btn}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      </a>

      <a href={liUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className={btn}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 18.34V9.99H5.67v8.35h2.67zm-1.33-9.5a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1zm11.33 9.5v-4.57c0-2.47-1.32-3.62-3.08-3.62-1.42 0-2.06.78-2.41 1.33V9.99h-2.67c.04.75 0 8.35 0 8.35h2.67v-4.66c0-.24.02-.48.09-.65.19-.48.63-.97 1.36-.97.96 0 1.35.73 1.35 1.81v4.47h2.69z" />
        </svg>
      </a>

      <a href={twUrl} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className={btn}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M18.244 2H21l-6.52 7.45L22 22h-6.78l-4.78-6.4L4.8 22H2l6.97-7.97L2 2h6.92l4.33 5.85L18.244 2zm-1.18 18h1.65L7.06 4H5.3l11.764 16z" />
        </svg>
      </a>

      <button
        onClick={copyLink}
        aria-label={t("copyLink")}
        className={`${btn} ${copied ? "bg-accent text-white" : ""}`}
      >
        {copied ? <Check size={18} /> : <Link2 size={18} />}
      </button>

      {copied && <span className="text-xs text-accent font-semibold">{t("linkCopied")}</span>}
    </div>
  );
}
