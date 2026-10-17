import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // The devcontainer is reachable via OrbStack's hostname; Next only allows
  // localhost by default, so dev assets would be blocked there.
  allowedDevOrigins: ["node.odin-devcontainer.orb.local"],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
