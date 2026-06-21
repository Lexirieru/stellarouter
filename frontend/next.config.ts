import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Consume the shared workspace package's TS/JSX source directly.
  transpilePackages: ["@stellarouter/ui"],
};

export default nextConfig;
