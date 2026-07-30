import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, ".."),
  outputFileTracingIncludes: {
    "/api/chat": ["recipes/**/*.md"],
  },
  turbopack: {
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;
