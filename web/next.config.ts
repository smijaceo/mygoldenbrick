import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is off: every data page renders per request so agents never
  // see stale leads or listings. See docs/03-design.md.
  cacheComponents: false,
  // The motion experience is the homepage on this branch. The earlier landing page stays in
  // app/(marketing); remove this rewrite to bring it back.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/prototype/motion" }],
      afterFiles: [],
      fallback: [],
    };
  },
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
