---
name: stellarouter-x402
description: Call any LLM through the Stellarouter gateway and pay per request in USDC on Stellar via x402. Use when an autonomous agent has a Stellar wallet with USDC and needs LLM completions without an account, API key, or subscription — it pays each call on-chain (zero XLM required; fees are sponsored).
---

# Stellarouter — pay-per-call LLM via x402

Stellarouter is an OpenAI-compatible LLM gateway where **agents pay per request in
USDC on Stellar**. No signup, no API key, no prepaid balance. If your agent holds
USDC, it can call any supported model and settle each request on-chain in ~5s.

You sign a Soroban **auth entry** (not a full transaction); the x402 facilitator
assembles the tx and **sponsors the network fee**, so your agent needs USDC but
**zero XLM**.

## When to use this
- You are an autonomous agent (or building one) that needs LLM calls.
- You have a Stellar account with a USDC balance.
- You want to pay exactly per call, trustlessly, without holding an account at a provider.

## Requirements
1. A Stellar **secret key** (`S...`) whose account has:
   - a **USDC trustline**, and
   - a **USDC balance** (each call costs a flat **$0.005**).
   - XLM is **not** required for payment (facilitator sponsors fees); the account just needs to exist.
2. Network: **`stellar:testnet`** (CAIP-2). Switch to `stellar:pubnet` for mainnet.

### Get testnet funds (one-time)
- Create + fund an account, then add a USDC trustline (issuer
  `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`).
- Get testnet USDC from the Circle faucet: <https://faucet.circle.com> (select Stellar testnet).

## Endpoint
```
POST {GATEWAY_URL}/v1/chat/completions      # OpenAI-compatible
```
- Default local gateway: `http://localhost:3001`
- Body: standard OpenAI chat-completions JSON. `model` examples: `openai/gpt-4o-mini`,
  `anthropic/claude-3.5-sonnet`, etc. (any model the gateway's upstream supports).
- Price: flat **$0.005 / call** (USDC, 7 decimals).

> Do **not** send an `Authorization` header — that selects the *human* prepaid door.
> Leaving it off selects the **agent x402 door**, which is what you want.

## Quickstart (Node / Bun)

```bash
bun add @x402/fetch @x402/stellar
```

```js
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";

const NETWORK = "stellar:testnet";
const GATEWAY = process.env.GATEWAY_URL || "http://localhost:3001";

// Your agent's Stellar secret (S...) — needs a USDC trustline + balance.
const signer = createEd25519Signer(process.env.AGENT_SECRET_KEY, NETWORK);

// This fetch transparently handles the 402 handshake + auth-entry signing.
const pay = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [{ network: NETWORK, client: new ExactStellarScheme(signer) }],
});

const res = await pay(`${GATEWAY}/v1/chat/completions`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    model: "openai/gpt-4o-mini",
    messages: [{ role: "user", content: "Hello, paid in USDC!" }],
  }),
});

console.log(await res.json());
// 0.005 USDC settled on-chain; the completion is returned.
```

## What happens under the hood
```
agent → POST /v1/chat/completions                 (no payment)
agent ← 402 Payment Required (pay $0.005 → payTo)
agent   builds a USDC SAC transfer, signs the auth entry only
agent → POST /v1/chat/completions + X-PAYMENT
gateway → x402 facilitator /verify → /settle      → Stellar (~5s)
agent ← 200 OK + chat completion
```

## Notes
- **Idempotency / retries:** each call is a fresh payment; don't reuse a signed
  `X-PAYMENT` across requests (auth entries expire, ~1 min).
- **Insufficient USDC:** settlement fails — top up the agent's wallet.
- **Mainnet:** set `NETWORK = "stellar:pubnet"` and point at the mainnet gateway; same code.
- **Human alternative:** if you'd rather prepay (top up once, then use an API key),
  use the prepaid door instead — send `Authorization: Bearer <api-key>`.
