Stellarouter — an OpenRouter-style LLM gateway with verifiable, on-chain billing on Stellar

One line: AI agents pay per LLM call in USDC via x402 (zero XLM needed); humans prepay into a Soroban credit vault whose balance is public, auditable, and refundable. Already live on testnet.

Repo: https://github.com/Lexirieru/stellarouter
Live demo: https://stellarouter.vercel.app
Contract (testnet): CAEFFQAL6SGQF6OV5BOBE23NAC2T7WXOUUE5XRDOH2KRN2HXRMDXA7RE
Demo video (1 min): https://github.com/Lexirieru/stellarouter/blob/main/docs/demo/stellarouter-demo.mp4


1. PROBLEM STATEMENT

Two symmetric problems block LLM consumption today.

- AI agents cannot pay. LLM APIs sit behind subscriptions, credit cards and human-owned API keys. An autonomous agent cannot open a Stripe account, so every agent borrows its operator's key — unbounded spend, no per-request settlement, no machine-native way to buy one completion.
- Humans cannot audit. Gateway credits (OpenRouter, Together, etc.) are opaque custodial database rows. You cannot verify what you were charged for, and unused balance lives entirely at the provider's mercy.

Stellarouter solves both with one gateway and two payment doors: x402 pay-per-call for agents, and a prepaid on-chain credit vault for humans.


2. WHY STELLAR?

- USDC is a first-class asset (Stellar Asset Contract / SEP-41) with ~5-second finality and sub-cent fees — the only settlement profile that works at $0.005-per-call granularity.
- x402 on Stellar with the OpenZeppelin Channels facilitator lets an agent pay with USDC only — zero XLM — because network fees are sponsored. This is the official Stellar agentic-payments stack (developers.stellar.org/docs/build/agentic-payments), with MPP payment channels as the path for high-frequency traffic.
- Soroban gives the credit ledger: deposit / debit / withdraw / collect with require_auth, typed errors and public contract events = proof-of-billing anyone can verify on the explorer. The admin can only debit usage; users can always withdraw the rest — a custody boundary web2 gateways cannot offer.
- Anchors (SEP-24 hosted deposit, developers.stellar.org/docs/learn/fundamentals/anchors) give a fiat on-ramp into credits, so people in markets without cards can still buy LLM access.


3. TARGET USERS

- Autonomous AI agents and agent frameworks (LangChain, MCP servers, Claude/OpenAI agents) that need metered LLM access with no account: discover, get a 402, pay, consume.
- Developers who want OpenRouter ergonomics — one API, a 500+ model catalog, keys, usage logs — but with a balance they self-custody, verify and withdraw.
- Agent-platform teams whose finance/compliance people need billing they can audit on a public ledger.


4. TECHNICAL ARCHITECTURE

Frontend (Next.js console, Vercel): Playground (agent x402 mode / human prepaid mode), Models catalog, Credits, API Keys, Logs. Multi-wallet via Stellar Wallets Kit (Freighter, xBull, Albedo, Lobstr, Hana). The Credits page builds deposit/withdraw transactions for the wallet to sign and polls Stellar RPC getEvents for the contract, so deposits/debits/withdraws stream into a live activity feed and the balance refreshes in real time.

Gateway (Express, OpenAI-compatible): 
- Agent door: POST /v1/chat/completions → 402 with payment requirements → client attaches a signed X-PAYMENT → facilitator verify/settle on Stellar → completion.
- Human door: API key bound to a wallet by a SEP-10-style signed challenge (keys stored hashed) → balance check on the contract → completion → debit(user, amount) signed by the gateway admin → response carries the debit tx hash.
- Network-aware model policy: on testnet only free models are enabled (with automatic fallback), the rest are labelled "available in mainnet"; on pubnet the full catalog unlocks with no code change.

Contract (Soroban, Rust): credits vault — constructor(admin, token), deposit, debit (admin), withdraw, collect (admin), views; cross-contract transfers through the USDC SAC (token::Client); typed errors; TTL management; events on every state change; 9 unit tests.

Data flow: agent → gateway → OZ Channels facilitator → Stellar (USDC to the gateway) → upstream model → agent. Human → wallet → deposit() → contract → gateway debit() per call → contract event → console feed.

Status today: contract deployed on testnet, 30+ real transactions (deposits, gateway debits, withdrawals, x402 settlements), live console, CI/CD (GitHub Actions + Vercel Git integration), 9 contract + 16 frontend + 4 gateway tests.


5. COMPLEXITY EVALUATION

- Two billing engines with different trust models in one gateway: pay-before (x402, price fixed upfront) versus debit-after (prepaid, charged only after a successful completion), kept consistent in one usage ledger.
- Price-before-cost: an LLM's cost is known only after the response, but x402 needs a price before it. MVP uses a flat price plus a bounded max_tokens; Level 4 adds per-model priced routes and margin control.
- Accountless identity: API keys bound to wallet ownership via challenge signing, hashed at rest, with every debit attributable on-chain.
- Real-time state sync from contract events to UI, and a refundable custody boundary enforced by require_auth rather than policy.
- Free-tier reliability engineering already needed on testnet (provider rate limits → transparent fallback across enabled models).
- Mainnet-grade concerns ahead: per-model pricing, MPP payment channels for high-frequency agents, treasury operations, contract audit.


6. ROADMAP

MVP (done, testnet): both payment doors live end-to-end, model catalog, wallet-bound API keys, usage logs, live on-chain activity feed, user-simulation harness, CI/CD, docs and demo video.

Level 4 (after approval): per-model pricing tiers on the x402 door, streaming (SSE) responses, rate limiting and per-key observability, an agent onboarding kit (SKILL.md + fetch/MCP client templates) so any agent framework can pay Stellarouter out of the box.

User acquisition: list in the Stellar ecosystem directory and agent tool registries; ship drop-in templates for popular agent frameworks; onboard builders from Stellar Hacks: Agents and MCP communities as first integrators; partner with an anchor for SEP-24 fiat top-ups. Success metrics: agents integrated, paid calls per day, USDC settled on-chain.

Mainnet vision: config-flip deployment (pubnet, OZ mainnet facilitator, Circle USDC — no code changes by design), contract audit, treasury sweep to an operating wallet, MPP channels for high-frequency traffic. Long term: revenue sharing with model providers paid in USDC on Stellar, and anchor-based fiat on-ramps that turn Stellarouter into LLM access for markets without cards.


PRIOR ART AND DIFFERENTIATION

An ecosystem survey (Stellar directory, August 2026) shows 12+ x402/agent-payment projects on Stellar — REAPP ($70k SCF), TollPay, the x402 MCP template, the official MPP SDK — all SDKs, middleware or marketplaces. Stellarouter is the product layer on top of that stack: a complete OpenRouter-class gateway whose differentiator — dual-door billing with on-chain, refundable, publicly auditable balances — is only possible on Stellar. Full comparison: https://github.com/Lexirieru/stellarouter/blob/main/docs/COMPARISON.md
