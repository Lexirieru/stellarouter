import type { NextConfig } from "next";

// GH_PAGES=1 → build statis untuk GitHub Pages (semua route console memang
// prerender statis; data on-chain diambil client-side via RPC/Horizon).
const ghPages = process.env.GH_PAGES === "1";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Consume the shared workspace package's TS/JSX source directly.
  transpilePackages: ["@stellarouter/ui"],
  ...(ghPages && {
    output: "export" as const,
    basePath: "/stellarouter",
    assetPrefix: "/stellarouter/",
    images: { unoptimized: true },
  }),
};

export default nextConfig;
