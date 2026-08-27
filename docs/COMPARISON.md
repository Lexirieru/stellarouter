# Stellarouter vs. the Ecosystem — Comparison & Differentiation

> Source: ecosystem survey via the **Stellar Raven MCP** (stellarlight.xyz project
> directory, Stellar Hacks: Agents / DoraHacks submissions, SCF records) — as of
> 14 August 2026.

## Landscape: "AI pays for APIs on Stellar"

This space is hot and validated — SDF has an official **agentic payments** use case
(x402 + MPP), and the *Stellar Hacks: Agents* hackathon produced a dozen-plus
projects. Almost all of them stop at the **infrastructure / middleware** layer:

| Project | What it is | Layer | Evidence |
|---|---|---|---|
| **REAPP** | Agentic authorization protocol (x402 + Soroban policy + AP2 mandates) as a TypeScript SDK | SDK / protocol | SCF Build **$70k** (round 43) |
| **stellar/stellar-mpp-sdk** | Official Stellar SDK for MPP (charge + payment channels) | Official SDK | active repo |
| **x402 MCP Stellar Template** | Node/Python/Go templates for paid MCP servers | Template | 4th place, Stellar Hacks: Agents |
| **TollPay** | Middleware for monetizing MCP tools per call in USDC | Middleware | Winner, Stellar Hacks: Agents |
| **StellarPay402** | Agent-to-agent API marketplace + Soroban registry | Marketplace | Agentic Hackathon (judge score 1.0) |
| **PUMAx402** | x402 hub: REST catalog + UI + CLI/MCP client (402 → pay → retry) | Generic API hub / catalog | Stellar Hacks: Agents |
| **PLUTO** | Stripe-like payment gateway for merchants + x402 support | General payment gateway | Stellar Hacks: Agents |
| **AXON (DeAI)** | Decentralized AI marketplace, pay-per-inference via x402/MPP | Inference marketplace | Stellar Hacks: Agents |
| **RenderGate** | Pay-per-render headless-browser API via x402 | Single vertical API | 3rd place, Stellar Hacks: Agents |
| **x402kit / Oxide Gateway / Sentryx402 / NyayaMitra** | x402 toolkits and single paid APIs | Toolkit / single API | Stellar Hacks: Agents |
| **Nirium** | Autonomous treasury & micropayments protocol + agent SDK | Protocol / SDK | Agentic Hackathon |

**Closest to us:** AXON (pay-per-inference marketplace) and PUMAx402 (catalog +
client). Both are hackathon prototypes with no product surface for humans, no
prepaid on-chain billing, and no key management.

## How Stellarouter is different

Stellarouter is not an SDK and not a generic marketplace — it is an **end-to-end,
OpenRouter-style LLM gateway product**, with a billing model OpenRouter itself
cannot replicate:

1. **Dual-door billing — unique in this landscape.**
   - *Agent door:* x402 pay-per-call. No account, no API key, no balance — and
     **zero XLM** (fees are sponsored by the OpenZeppelin Channels facilitator).
     Agents pay $0.005 USDC per call.
   - *Human door:* prepaid credits à la OpenRouter, except the balance **lives in a
     Soroban contract** (`credits`), not in our database.
2. **Non-custodial, refundable balance.** On OpenRouter, credits are custodial
   database rows that expire on their terms. On Stellarouter, `withdraw()` returns
   unused USDC at any time — the admin can only debit usage, never touch the
   remaining balance.
3. **Proof-of-billing on-chain.** Every `deposit` / `debit` / `withdraw` emits a
   contract event anyone can verify on the explorer. Publicly auditable LLM
   billing — no web2 gateway (OpenRouter, Together, etc.) can offer this.
4. **Wallet = account.** API keys are bound to wallet ownership through a
   SEP-10-style challenge (a signature, not an email/password). Keys are stored
   hashed (SHA-256) on the server.
5. **A complete product surface**, not a single endpoint: model catalog
   (OpenRouter API), Playground with agent/human modes, Keys page, usage Logs,
   real-time on-chain activity feed.
6. **Mainnet by configuration.** The whole payment path is designed to flip to
   pubnet via `.env` with no code changes.

### One-line positioning

> **Stellarouter = OpenRouter whose bills can be audited on the blockchain** — AI
> agents pay per call via x402 without holding XLM; humans top up USDC into an
> on-chain credit vault they can withdraw from at any time.

### How to use this comparison

- **Level 4 idea submission:** cite REAPP ($70k SCF) and the Stellar Hacks: Agents
  winners as *market validation*, then show the gap: no complete LLM-gateway
  product exists yet.
- **Demo / video:** show the two doors side by side — an agent terminal
  (402 → pay → 200) and a human browser (top up → chat → balance decreases →
  event appears in the feed and on the explorer).
