import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/app/api/chat": ["recipes/**/*.md"],
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
