import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Artwork uploads are capped at 25MB client-side; leave headroom for
      // multipart/form-data overhead.
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
