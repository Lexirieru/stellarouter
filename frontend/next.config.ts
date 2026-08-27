import type { NextConfig } from "next";

// STATIC_EXPORT=1 → static build (for any static file host, e.g. deploying
// `out/` to Vercel). Every console route prerenders statically; on-chain data
// is fetched client-side via RPC/Horizon.
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Consume the shared workspace package's TS/JSX source directly.
  transpilePackages: ["@stellarouter/ui"],
  ...(staticExport && {
    output: "export" as const,
    trailingSlash: true, // /credits → credits/index.html — works on any static host
    images: { unoptimized: true },
  }),
};

export default nextConfig;
