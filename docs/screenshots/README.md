# Submission screenshots

Files referenced by the root README (names must match exactly):

| File | How to capture |
|---|---|
| `wallet-options.png` | Run the console (`cd frontend && bun run dev`) → click **Connect Wallet** in the sidebar → capture the Stellar Wallets Kit modal listing the wallets (Freighter, xBull, Albedo, Lobstr, Hana, …). This is the multi-wallet proof for the Level 2 checklist. |
| `credits-live-feed.png` | **Credits** page with a wallet connected: the on-chain balance and the **On-chain activity** feed with events. Run `node scripts/simulate-users.js` in `backend/` first so the feed has traffic. |
| `playground.png` | **Playground** page — agent/human toggle visible, ideally with a paid x402 receipt. |

Tips: ~1280px wide window, light mode, tidy crop without the bookmarks bar.

Level 3 files (generated automatically with Playwright):

| File | Contents |
|---|---|
| `mobile-playground.png` / `mobile-credits.png` | Mobile UI at 390×844 ("mobile responsive UI" checklist item) |
| `tests-passing.png` | Real `cargo test` + `bun test` output (9 + 16 passing) |
| `ci-pipeline.png` | GitHub commits page: commit status popover ✓ "Vercel — Deployment has completed" (CD via Git integration) |
| `ci-build-log.png` | Vercel build log for that commit (`vercel inspect <url> --logs`) |
