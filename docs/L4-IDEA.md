# Level 4 Idea Submission — Stellarouter

> **Stellarouter: an OpenRouter-style LLM gateway with verifiable, on-chain billing on Stellar.**
> AI agents pay per call in USDC via x402 with zero XLM; humans prepay into a Soroban
> credit vault that is transparent, auditable, and refundable.

## 1. Problem Statement

Two symmetric problems block LLM consumption today:

- **AI agents can't pay.** LLM APIs sit behind subscriptions, credit cards, and
  human-owned API keys. An autonomous agent cannot open a Stripe account. The result:
  every agent must borrow its operator's key, with unbounded spend and no
  machine-native settlement.
- **Humans can't audit.** Gateway credits (OpenRouter, Together, etc.) are opaque
  custodial database rows. You cannot verify what you were charged for, and unused
  balances live entirely at the provider's mercy.

## 2. Why Stellar?

- **USDC as a first-class asset (SAC/SEP-41)** with ~5s finality and sub-cent fees —
  the only settlement profile that works at $0.005-per-call granularity.
- **x402 + OZ Channels facilitator**: the agent needs *only USDC — zero XLM* — because
  network fees are sponsored. No other chain has this agent-payment rail in production.
- **Soroban** gives the credit ledger: `deposit / debit / withdraw / collect` with
  `require_auth`, typed errors, and public contract events = proof-of-billing.
- Aligned with SDF's official **agentic payments** use case (x402 + MPP).

## 3. Target Users

1. **Autonomous AI agents** (LangChain/MCP/Claude agents) needing metered LLM access
   with no account setup — discover, pay 402, consume.
2. **Developers** who want OpenRouter ergonomics (one API, 500+ model catalog, keys,
   logs) but with a balance they can self-custody, verify, and withdraw.
3. **Agent platform builders** who need billing infrastructure their compliance team
   can audit on a public explorer.

## 4. Technical Architecture

```
AI agent ── x402 (402 → USDC pay → 200) ──► Express gateway ── OpenAI-compatible ──► upstream models
human ──── API key (SEP-10-style wallet proof) ──┤            (proxy + key store + usage logs)
human ──── Next.js console (Playground/Models/Credits/Keys/Logs)
                     │  deposit/withdraw (wallet sign)      │ debit(user, amount) [admin]
                     ▼                                      ▼
              credits contract (Soroban) ◄── events ──► RPC getEvents → live feed in console
                     │ token::Client transfer
                     ▼
              USDC SAC (Circle)
```

- Deployed on testnet today: contract `CAEFFQAL6SGQF6OV5BOBE23NAC2T7WXOUUE5XRDOH2KRN2HXRMDXA7RE`,
  full flow proven end-to-end (real paid calls, real deposits/debits/withdraws).
- CI/CD on GitHub Actions; console is statically exported; contract deploys via a
  one-click workflow.

## 5. Complexity Evaluation

- **Dual billing engines** with different trust models: streaming per-call (x402
  upfront price) vs prepaid ledger (admin-debited after usage) — kept consistent in
  one gateway.
- **Price-before-cost problem**: LLM cost is known only *after* the response, x402
  needs a price *before*. MVP: flat price + bounded max_tokens; L4: per-model tiered
  routes + margin management.
- **Key ↔ wallet binding** without accounts: SEP-10-style challenge signing, hashed
  keys, per-key on-chain debit attribution.
- **Real-time state sync**: contract events → console feed → balance invalidation.
- **Refundable custody boundary**: admin can only debit usage; users always exit with
  `withdraw()` — a property web2 gateways cannot offer.

## 6. Roadmap

- **MVP (done, testnet)**: two doors live, catalog, keys, logs, live event feed,
  CI/CD, simulation harness for load.
- **User acquisition**: agent-facing SKILL.md + client templates (fetch/MCP) so any
  agent framework can pay Stellarouter out of the box; publish to Stellar
  ecosystem directories; target Stellar Hacks / agentic-hackathon builders as first
  integrators; per-model pricing + streaming to reach feature parity for humans.
- **Mainnet vision**: flip-config deploy (pubnet + OZ mainnet facilitator + Circle
  USDC — no code changes by design), contract audit, treasury ops (collect →
  operating wallet), and usage-based model routing. Long-term: MPP payment channels
  for high-frequency agent traffic and revenue-sharing for model providers paid in
  USDC on Stellar.

## Prior art & differentiation (ecosystem survey via Stellar Raven, Aug 2026)

REAPP ($70k SCF, authorization SDK), TollPay & x402 MCP templates (middleware,
hackathon winners), AXON/PUMAx402/PLUTO (marketplaces/payment hubs). All are
infrastructure layers. **Stellarouter is the product**: a complete OpenRouter-class
gateway whose differentiator — dual-door billing with on-chain, refundable,
publicly auditable balances — is only possible on Stellar. Full comparison:
[COMPARISON.md](./COMPARISON.md).
