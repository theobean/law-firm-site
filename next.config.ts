import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// CSP without unsafe-eval — used for all public pages
const publicCSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://cdn.sanity.io https://www.google-analytics.com https://www.googletagmanager.com https://img.youtube.com",
  "connect-src 'self' https://api.web3forms.com https://cdn.sanity.io https://*.sanity.io https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://www.googletagmanager.com",
  "frame-src https://www.google.com https://maps.google.com https://www.youtube.com https://www.facebook.com",
].join("; ");

// CSP with unsafe-eval — required by Sanity Studio
const studioCSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://cdn.sanity.io https://www.google-analytics.com https://www.googletagmanager.com https://img.youtube.com",
  "connect-src 'self' https://api.web3forms.com https://cdn.sanity.io https://*.sanity.io https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://www.googletagmanager.com",
  "frame-src https://www.google.com https://maps.google.com https://www.youtube.com https://www.facebook.com",
].join("; ");

const baseHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Bank pages withdrawn (content not approved) — already indexed, so 308 → contact
      { source: "/:locale/banks", destination: "/:locale/contact", permanent: true },
      { source: "/:locale/banks/:path*", destination: "/:locale/contact", permanent: true },
      // WordPress post ID URLs: /?p=123
      { source: "/", has: [{ type: "query", key: "p" }], destination: "/el", permanent: true },
      // WordPress page ID URLs: /?page_id=123
      { source: "/", has: [{ type: "query", key: "page_id" }], destination: "/el", permanent: true },
      // WordPress category/tag/author archives
      { source: "/category/:slug*", destination: "/el", permanent: true },
      { source: "/tag/:slug*",      destination: "/el", permanent: true },
      { source: "/author/:slug*",   destination: "/el", permanent: true },
      // WordPress feed
      { source: "/feed",            destination: "/el", permanent: true },
      { source: "/feed/:path*",     destination: "/el", permanent: true },
      // WordPress wp-login / wp-admin
      { source: "/wp-login.php",    destination: "/el", permanent: true },
      { source: "/wp-admin/:path*", destination: "/el", permanent: true },
      // WordPress xmlrpc
      { source: "/xmlrpc.php",      destination: "/el", permanent: true },
      // WordPress sitemap plugins
      { source: "/sitemap_index.xml",    destination: "/sitemap.xml", permanent: true },
      { source: "/post-sitemap.xml",     destination: "/sitemap.xml", permanent: true },
      { source: "/page-sitemap.xml",     destination: "/sitemap.xml", permanent: true },
      // Legacy WordPress slugs (cached in Google) → semantically closest new page.
      // Next.js matches against the decoded pathname, so we list both the
      // raw-Greek form and the percent-encoded form for safety.
      { source: "/el/ανακοπες-ακυρωσης-κατασχεσης", destination: "/el/practice-areas/banking", permanent: true },
      { source: "/el/%CE%B1%CE%BD%CE%B1%CE%BA%CE%BF%CF%80%CE%B5%CF%82-%CE%B1%CE%BA%CF%85%CF%81%CF%89%CF%83%CE%B7%CF%82-%CE%BA%CE%B1%CF%84%CE%B1%CF%83%CF%87%CE%B5%CF%83%CE%B7%CF%82", destination: "/el/practice-areas/banking", permanent: true },
      { source: "/el/εξωδικαστικη-ρυθμιση-οφειλων", destination: "/el/practice-areas/extrajudicial", permanent: true },
      { source: "/el/%CE%B5%CE%BE%CF%89%CE%B4%CE%B9%CE%BA%CE%B1%CF%83%CF%84%CE%B9%CE%BA%CE%B7-%CF%81%CF%85%CE%B8%CE%BC%CE%B9%CF%83%CE%B7-%CE%BF%CF%86%CE%B5%CE%B9%CE%BB%CF%89%CE%BD", destination: "/el/practice-areas/extrajudicial", permanent: true },
      { source: "/el/79-2", destination: "/el", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  async headers() {
    return [
      {
        // Sanity Studio needs unsafe-eval
        source: "/studio/:path*",
        headers: [...baseHeaders, { key: "Content-Security-Policy", value: studioCSP }],
      },
      {
        // All other pages: stricter CSP without unsafe-eval
        source: "/((?!studio).*)",
        headers: [...baseHeaders, { key: "Content-Security-Policy", value: publicCSP }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
