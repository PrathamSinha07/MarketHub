import type { NextConfig } from "next";

/**
 * Headers that matter for a deployment behind HTTPS. They are cheap, do not
 * depend on runtime configuration and are verified by the Playwright suite
 * (which runs against `next build` + `next start`).
 *
 * A full Content-Security-Policy with a `script-src` directive is deliberately
 * NOT set here: Next.js ships inline bootstrap scripts, so a strict policy
 * needs per-request nonces wired into the app router. That is tracked as a
 * follow-up instead of shipping a policy that looks protective but is either
 * full of `unsafe-inline` holes or breaks the app in production.
 */
const securityHeaders = [
  // Clickjacking: the app never needs to be framed.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
  // Browsers must never guess the content type of a response.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer only travels in full to the same origin; the API and third
  // parties never see query strings from app pages.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Feature policy: nothing in a marketplace needs device sensors.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // HSTS is ignored by browsers over plain http, so this is inert in local
  // development and takes effect as soon as the site is served over HTTPS.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Do not advertise the framework in every response header.
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
