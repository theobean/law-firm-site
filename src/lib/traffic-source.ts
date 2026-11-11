const sources = ["google", "search", "social", "direct", "referral", "internal"] as const;
export type TrafficSource = (typeof sources)[number];

const googleHost = /(?:^|\.)google\.(?:com|[a-z]{2}|(?:co|com)\.[a-z]{2})$/;
const searchHosts = [
  "bing.com", "duckduckgo.com", "search.yahoo.com", "search.brave.com", "ecosia.org",
  "qwant.com", "yandex.com", "yandex.ru", "startpage.com", "baidu.com", "search.naver.com",
];
const socialHosts = [
  "facebook.com", "fb.com", "fb.me", "messenger.com", "instagram.com", "instagr.am",
  "linkedin.com", "lnkd.in", "reddit.com", "redd.it", "t.co", "twitter.com", "x.com",
  "youtube.com", "youtu.be", "tiktok.com", "pinterest.com", "pin.it", "whatsapp.com",
  "wa.me", "threads.net", "threads.com", "snapchat.com", "t.me", "telegram.org",
  "bsky.app", "tumblr.com",
];

export function isTrafficSource(value: unknown): value is TrafficSource {
  return sources.some(source => source === value);
}

function matchesHost(host: string, domains: string[]) {
  return domains.some(domain => host === domain || host.endsWith("." + domain));
}

function normalizeHost(host: string) {
  return host.toLowerCase().replace(/\.$/, "");
}

export function trafficSource(referrer: string, siteHost: string, navigationType?: string): TrafficSource {
  if (navigationType === "reload" || navigationType === "back_forward") return "internal";
  if (!referrer) return "direct";
  let referringUrl: URL;
  try {
    referringUrl = new URL(referrer);
  } catch {
    return "direct";
  }
  if (referringUrl.protocol !== "https:" && referringUrl.protocol !== "http:") return "direct";

  const host = normalizeHost(referringUrl.hostname);
  if (host.replace(/^www\./, "") === normalizeHost(siteHost).replace(/^www\./, "")) return "internal";
  if (googleHost.test(host)) return "google";
  if (matchesHost(host, searchHosts)) return "search";
  if (matchesHost(host, socialHosts)) return "social";
  return "referral";
}
