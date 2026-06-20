# Stellarouter Gateway — x402 (pay-per-call)

The agent-facing door of Stellarouter: an LLM endpoint behind an **x402** payment
gate. An AI agent pays **per call in USDC on Stellar** — no account, no prepaid
balance, no trust in the gateway. The agent needs USDC but **zero XLM** (the OZ
Channels facilitator sponsors network fees).

## Flow

```
agent → POST /v1/chat/completions                 (no payment)
agent ← 402 Payment Required  (pay $0.005 USDC → payTo)
agent   builds USDC SAC transfer, signs the auth entry only
agent → POST /v1/chat/completions + X-PAYMENT
gateway → OZ Channels /verify → /settle           → Stellar (~5s)
agent ← 200 OK + chat completion
```

## Endpoints

| Method | Path | Paid? | Notes |
|--------|------|-------|-------|
| GET | `/health` | no | liveness |
| GET | `/` | no | service + price info |
| POST | `/v1/chat/completions` | **yes (x402)** | OpenAI-compatible; proxied to upstream model (or mock) |

## Setup (testnet)

1. `cp .env.example .env`
2. **Recipient** — `STELLAR_RECIPIENT` defaults to the deployer account (already has a
   USDC trustline). Any `G...` with a USDC trustline works.
3. **OZ Channels key (required)** — generate a testnet key at
   <https://channels.openzeppelin.com/testnet/gen> and put it in `OZ_API_KEY`.
   Without it the server exits at startup.
4. *(optional)* set `UPSTREAM_BASE_URL` + `UPSTREAM_API_KEY` to proxy to a real
   model (e.g. `https://api.openai.com/v1`). Leave blank to return a mock completion.

```bash
bun install
npm start          # → http://localhost:3001
```

## Test it with the example agent (buyer)

The buyer needs an `S...` key with a USDC **trustline + balance**. Put it in
`PAYER_SECRET_KEY`, then:

```bash
npm run client
```

It will hit `/v1/chat/completions`, auto-negotiate the 402, sign + pay 0.005 USDC,
and print the completion.

> Quick unpaid check (no payment, returns 402):
> ```bash
> curl -i -X POST http://localhost:3001/v1/chat/completions \
>   -H 'content-type: application/json' \
>   -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"hi"}]}'
> ```

## Pricing note

LLM cost is only known *after* the response, but x402 needs a price *upfront*. MVP
uses a **flat price per call** (`X402_PRICE`, default `$0.005`). Per-model tiers can
be added by registering more paid routes.

## Mainnet

Flip `.env` only: `STELLAR_NETWORK=stellar:pubnet`,
`FACILITATOR_URL=https://channels.openzeppelin.com/x402`, a mainnet `OZ_API_KEY`,
and a mainnet `STELLAR_RECIPIENT`. No code changes.
