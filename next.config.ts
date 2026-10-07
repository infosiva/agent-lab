import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // gate item 23: baseline security headers (CSP is set per-app where inline scripts allow)
  async headers() {
    return [{ source: '/(.*)', headers: [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy-Report-Only', value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
    ] }]
  },
  /* config options here */
};

export default nextConfig;
