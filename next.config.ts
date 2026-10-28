import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Site imagery is flat sticker-style PNG art; the optimizer's lossy WebP
    // re-encode visibly smudges it, so serve the exported files as-is.
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      // Artwork uploads are capped at 25MB client-side; leave headroom for
      // multipart/form-data overhead.
      bodySizeLimit: "30mb",
    },
  },
  // Static security headers for every response. The Content-Security-Policy
  // needs a per-request nonce, so it's set in proxy.ts instead.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
