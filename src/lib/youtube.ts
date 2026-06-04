// ── YouTube ────────────────────────────────────────────────────────────────

export function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.hostname.includes("youtube.com")) {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const parts = u.pathname.split("/");
      const idx = parts.findIndex((p) => p === "embed" || p === "shorts" || p === "v");
      if (idx !== -1) return parts[idx + 1];
    }
  } catch { /* invalid URL */ }
  return null;
}

export function getThumbnailUrl(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export function getEmbedUrl(id: string): string {
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
}

// ── Facebook ───────────────────────────────────────────────────────────────

export function isFacebookUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === "www.facebook.com" || u.hostname === "facebook.com" ||
           u.hostname === "fb.watch";
  } catch { return false; }
}

/**
 * Returns the Facebook plugin embed URL (no JS SDK required).
 * Works for public videos.
 */
export function getFacebookEmbedUrl(originalUrl: string): string {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(originalUrl)}&show_text=false&width=560&autoplay=true`;
}

// ── Generic helper ─────────────────────────────────────────────────────────

export type VideoType = "youtube" | "facebook" | "unknown";

export function getVideoType(url: string): VideoType {
  if (getYouTubeId(url)) return "youtube";
  if (isFacebookUrl(url)) return "facebook";
  return "unknown";
}
