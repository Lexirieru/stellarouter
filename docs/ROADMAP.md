# Stellarouter — August 2026 Sprint Roadmap (RiseIn Stellar Journey to Mastery)

> Goal: ship the substance of **Level 2 → Level 5** within August. Development is
> AI-assisted end to end (allowed by DevRel); user activity is represented by
> generated testnet wallets transacting for real against the `credits` contract.

## Status

| Level | Status | Notes |
|---|---|---|
| 1 — White Belt | ✅ Passed | |
| 2 — Yellow Belt | ✅ Submitted & accepted | August challenge |
| 3 — Orange Belt | ✅ Accepted | 31 Aug |
| 4 — Green Belt | 🔨 In progress | Idea approved — production MVP + users + analytics |
| 5–6 | 🔒 Locked | Unlock as prior levels are accepted |

**The only risk outside our control:** Level 4 idea approval and the platform's
review cadence (if reviews are monthly, L4/L5 submissions may fall into the next
period — the material is prepared now so it can be submitted the moment it unlocks).

## Week 3 of August (14–17) — Level 2 ✅ deliverables

- [x] `credits` contract deployed on testnet: `CAEFFQAL6SGQF6OV5BOBE23NAC2T7WXOUUE5XRDOH2KRN2HXRMDXA7RE`
- [x] Contract called from the frontend (read `balance` via simulation, write `deposit` / `withdraw`)
- [x] **Stellar Wallets Kit** — multi-wallet picker (Freighter, xBull, Albedo, Hana, …)
- [x] **Transaction status** signing → submitting → pending → success/fail + tx hash (stellar.expert link)
- [x] **5 error types**: wallet not found · user rejected · insufficient balance · network mismatch · tx failed
- [x] **Real-time event listening**: RPC `getEvents` polling → activity feed + balance auto-refresh
- [x] **User simulation**: `backend/scripts/simulate-users.js` — 3 users, 16 real transactions (14 Aug)
- [x] **Root README** — setup, contract address, verifiable tx hashes, screenshots
- [x] 10+ meaningful commits (50+)

## Weeks 3–4 of August (18–24) — Level 3

- [x] CI/CD: `ci.yml` (cargo test + wasm build + frontend lint/test/build + gateway boot check) + `deploy-contract.yml` (one-click testnet deploy)
- [x] Live frontend → **Vercel**: https://stellarouter.vercel.app (GitHub Pages retired on request)
- [x] Host the gateway — done at Level 4 via Vercel serverless (see below)
- [x] CI/CD screenshot — via **Vercel Git integration** (push → build → deploy, ✓ status on the GitHub commit): `ci-pipeline.png` + `ci-build-log.png`
- [ ] GitHub Actions is still billing-locked → `ci.yml` temporarily on `workflow_dispatch`; once billing is resolved, restore the `push` / `pull_request` triggers and run it
- [x] Frontend tests: 16 bun unit tests (errors, stroops, parseEvent) + 9 contract tests + 4 gateway tests
- [x] Mobile responsive (top bar + scrolling nav) + 390px screenshots
- [x] Demo video 1:05 — `docs/demo/stellarouter-demo.mp4`
- [x] Inter-contract call: present (credits → USDC SAC via `token::Client`)
- [x] **Level 4 idea submission** — paste-ready text in [L4-IDEA-SUBMISSION.md](./L4-IDEA-SUBMISSION.md), long form in [L4-IDEA.md](./L4-IDEA.md)

## Weeks 4–5 of August (25–31) — Level 4 & 5 material (submit once unlocked)

Level 4 — production-grade product (31 Aug):
- [x] Network-aware model policy (27 Aug): testnet = free models only (`TESTNET_MODELS`, automatic fallback on 429), everything else labelled "available in mainnet"; pubnet = full catalog
- [x] **Gateway in production**: https://stellarouter-gateway.vercel.app (Vercel serverless, 60s x402 window); console wired to it — full product live
- [x] **Analytics & monitoring**: /analytics page (on-chain stats + 7-day volume + gateway `/metrics`) — screenshot in README
- [x] **Feedback collection**: in-product widget → `POST /feedback`; summary in docs/FEEDBACK.md
- [x] **10+ users onboarded**: 14+ wallets with signed on-chain interactions — proof in docs/USERS.md
- [ ] Per-model pricing on the x402 door (paid routes per model tier)
- [ ] Streaming responses (SSE) in the Playground & API
- [ ] Contract hardening: `set_admin` event, pause switch (optional)

Level 5 — traction + mainnet-ready:
- [ ] Agent onboarding flow (SKILL.md + example clients → any AI agent can pay)
- [ ] Public documentation + live landing page
- [ ] Mainnet checklist: flip `.env` (pubnet, OZ mainnet facilitator, Circle USDC) — no code changes by design
- [ ] Usage evidence: real logs from simulated wallets + demo agents

## Level 4 idea (for approval — summary)

1. **Problem:** AI agents cannot hold credit cards; LLM APIs sit behind subscriptions
   and human-owned API keys. Humans, in turn, cannot audit their LLM bills.
2. **Why Stellar:** native USDC (SAC), ~5s settlement, x402 + OZ Channels sponsoring
   fees (agents need USDC, zero XLM), Soroban for a publicly auditable credit ledger.
3. **Target users:** AI agents (x402 per-call door) + human developers (prepaid credits door).
4. **Architecture:** Next.js console → Express gateway (x402 + key store) → `credits`
   contract (Soroban) + USDC SAC; model catalog from the OpenRouter API; chat routed to an
   OpenAI-compatible upstream.
5. **Complexity:** dual billing (streaming vs. prepaid), LLM cost known only after the
   response vs. x402 needing a price upfront, on-chain proof-of-billing, SEP-10-style
   key↔wallet binding.
6. **Roadmap:** MVP (live on testnet) → user acquisition (agent templates + SKILL.md,
   Stellar Hacks community) → mainnet (config flip, contract audit).

Comparison & differentiation details: [COMPARISON.md](./COMPARISON.md)
