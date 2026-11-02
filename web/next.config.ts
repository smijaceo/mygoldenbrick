import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is off: every data page renders per request so agents never
  // see stale leads or listings. See docs/03-design.md.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
