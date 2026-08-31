# User Feedback — Collection & Summary (Level 4)

## How feedback is collected

1. **In-product widget** — every console page has a floating **Feedback** button
   (bottom-right): a 1–5 star rating + free text, with the connected wallet
   attached when present. Submissions go to the gateway's `POST /feedback`
   (SQLite store) and surface on the [Analytics](https://stellarouter.vercel.app/analytics)
   page under *Recent feedback*.
2. **Dogfooding log** — during the August testnet pilot the product was exercised
   end-to-end continuously (paid x402 calls, top-ups, refunds, mobile use), and
   every friction point was recorded and triaged below.

> Serverless note: the feedback store lives in `/tmp` on the hosted gateway, so
> entries reset on cold starts. A production build would move this to a hosted
> DB (Postgres/Turso) — the endpoint and widget stay unchanged.

## Feedback summary from the testnet pilot — and what we did about it

| # | Feedback / finding | Severity | Resolution |
|---|---|---|---|
| 1 | Models page showed 0 models when `MODELS_BASE_URL` was unset | high | Default catalog URL baked in; regression covered by the gateway boot check |
| 2 | Paid chat returned "(no content)" — upstream rejected unbounded `max_tokens` on a small balance | high | Flat-price x402 now bounds completions (`UPSTREAM_MAX_TOKENS`, default 512) |
| 3 | "Don't burn real OpenRouter credit while we're on testnet" | high | Network-aware model policy: free models only on testnet, catalog labelled "available in mainnet", full unlock on pubnet |
| 4 | Free models intermittently 429 at the provider — a paying caller got an error | high | Automatic fallback across the enabled free models; `_fallback_from` marks substituted answers |
| 5 | Console unusable at 390px (fixed sidebar squeezed content) | medium | Responsive top bar + horizontally scrolling nav; mobile screenshots in README |
| 6 | `/credits` 404 on the static host | medium | `trailingSlash` export so routes resolve on any static host; later superseded by the Vercel Git build |
| 7 | Deep links & explorer proof wanted for every transaction | medium | Tx lifecycle card + stellar.expert links on every action; activity feed rows link to the explorer |
| 8 | Payment succeeded but the demo agent errored on serverless | medium | Demo agent now pays the deployment's own public URL instead of localhost |
| 9 | "Which wallet am I connected with?" was invisible | low | Wallet id shown in the connect button tooltip; SWK session restore keeps it sticky |

## Still open (roadmap)

- Streaming responses (SSE) — requested for long completions.
- Persistent feedback/keys store on serverless (hosted DB).
- SEP-24 anchor top-ups so users without USDC can fund credits.

## Wallet-verified usage

Proof of 10+ user wallets interacting with the contract (deposits, gateway
debits, withdrawals, x402 settlements) lives in [USERS.md](./USERS.md), with an
explorer link per transaction.
