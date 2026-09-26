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
};

export default nextConfig;
