import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root — otherwise Turbopack picks up a stray
  // package-lock.json from a parent directory.
  turbopack: { root: __dirname },
};

export default nextConfig;
