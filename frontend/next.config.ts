import type { NextConfig } from "next";

// STATIC_EXPORT=1 → build statis (untuk hosting file statis mana pun, mis.
// deploy `out/` ke Vercel). Semua route console memang prerender statis;
// data on-chain diambil client-side via RPC/Horizon.
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Consume the shared workspace package's TS/JSX source directly.
  transpilePackages: ["@stellarouter/ui"],
  ...(staticExport && {
    output: "export" as const,
    trailingSlash: true, // /credits → credits/index.html — jalan di host statis mana pun
    images: { unoptimized: true },
  }),
};

export default nextConfig;
