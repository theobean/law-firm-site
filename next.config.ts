import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// CSP without unsafe-eval — used for all public pages
const publicCSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://api.web3forms.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://cdn.sanity.io https://www.google-analytics.com https://www.googletagmanager.com https://img.youtube.com",
  "connect-src 'self' https://api.web3forms.com https://cdn.sanity.io https://*.sanity.io https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://www.googletagmanager.com",
  "frame-src https://www.google.com https://maps.google.com https://www.youtube.com",
].join("; ");

// CSP with unsafe-eval — required by Sanity Studio
const studioCSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.web3forms.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://cdn.sanity.io https://www.google-analytics.com https://www.googletagmanager.com https://img.youtube.com",
  "connect-src 'self' https://api.web3forms.com https://cdn.sanity.io https://*.sanity.io https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://www.googletagmanager.com",
  "frame-src https://www.google.com https://maps.google.com https://www.youtube.com",
].join("; ");

const baseHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
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
