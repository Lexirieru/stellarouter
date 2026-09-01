# Stellarouter — User Guide

Stellarouter is an LLM gateway with **on-chain billing**. There are two ways in,
and you only need the one that matches who you are.

| You are… | Door | What you need | What you pay |
|---|---|---|---|
| An **AI agent** or a script | x402 (pay-per-call) | USDC — and **no XLM** | $0.005 per call |
| A **developer / human** | Prepaid credits | A Stellar wallet + USDC | Whatever you use; the rest is refundable |

Console: <https://stellarouter.vercel.app> · Gateway: <https://stellarouter-gateway.vercel.app>

---

## Part 1 — Humans: top up and chat

### 1. Connect a wallet

Open the console and click **Connect Wallet**. Freighter, xBull, Albedo,
Lobstr, Hana and others are supported through Stellar Wallets Kit. Make sure
the wallet is on the same network as the app — if it is on the wrong one, the
app tells you instead of failing mid-signature.

### 2. Get testnet funds

The **Get started on testnet** checklist on the Playground walks you through
this and ticks each step off automatically:

1. **XLM** — [friendbot](https://friendbot.stellar.org) (the checklist links it
   with your address pre-filled).
2. **USDC** — the [Circle testnet faucet](https://faucet.circle.com), choosing
   Stellar testnet.

### 3. Top up credits

Go to **Credits**, enter an amount, press **Top up**. If you have never held
USDC, the first top-up also opens the trustline — that is one extra signature,
and the app tells you before it happens.

Watch the status card: `signing → submitting → pending → confirmed`, with a
link to the transaction on stellar.expert. Your deposit then appears in the
**On-chain activity** feed within seconds.

> **Gasless:** leave the *Gasless* checkbox on and the gateway fee-bumps your
> signed transaction and pays the network fee — so topping up costs you no XLM.
> You still sign it; only the fee is sponsored. Uncheck it to pay your own fee.

### 4. Create an API key

**API Keys → + New Key.** You will be asked to sign a challenge that proves you
control the wallet — no email, no password. Copy the key immediately; the
server only stores a hash of it.

### 5. Use it

Either chat in the **Playground** (Human mode, paste your key), or call the API
like any OpenAI-compatible endpoint:

```bash
curl https://stellarouter-gateway.vercel.app/v1/chat/completions \
  -H "authorization: Bearer sk-stellarouter-…" \
  -H "content-type: application/json" \
  -d '{"model":"minimax/minimax-m3:free","messages":[{"role":"user","content":"hello"}]}'
```

Each call debits your on-chain balance **after** the completion succeeds, and
the response carries an `X-Stellarouter-Debit` header with the settlement
transaction hash. Your usage is listed under **Logs**; aggregate stats live on
**Analytics**.

### 6. Get your money back

**Credits → Refund** returns your entire unused balance to your wallet. The
gateway can only ever debit usage — it cannot touch the remainder, and even
when the contract is paused for an incident, withdrawals stay open by design.

---

## Part 2 — Agents: pay per call with x402

No account, no API key, no signup — and **no XLM**, because network fees are
sponsored by the OpenZeppelin Channels facilitator. The agent needs only USDC.

```
agent → POST /v1/chat/completions                    (no payment header)
agent ← 402 Payment Required  (pay $0.005 USDC → payTo)
agent   builds the USDC transfer, signs the auth entry
agent → POST /v1/chat/completions + X-PAYMENT
gateway → facilitator /verify → /settle              → Stellar (~5s)
agent ← 200 OK + the completion
```

With the x402 fetch wrapper this is roughly:

```js
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";

const pay = wrapFetchWithPaymentFromConfig(fetch, { /* your Stellar signer */ });
const res = await pay("https://stellarouter-gateway.vercel.app/v1/chat/completions", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    model: "minimax/minimax-m3:free",
    messages: [{ role: "user", content: "hello" }],
  }),
});
```

A runnable buyer lives in [`backend/examples/client.js`](../backend/examples/client.js)
(`npm run client`).

## Models

`GET /models` returns the catalog. On testnet only free models are **enabled**
so that testing never spends real upstream credit; everything else is listed
and labelled *available in mainnet*. Requesting a mainnet-only model on testnet
returns `400 model_unavailable_on_testnet` **before** any payment is taken —
you are never charged for a request that cannot be served.

## Troubleshooting

| What you see | What it means |
|---|---|
| **Wallet not found** | No Stellar wallet extension detected — install one and reload |
| **Rejected in wallet** | You dismissed the signature prompt |
| **Insufficient balance** | Not enough USDC in the wallet, or not enough credit in the contract |
| **Wrong network** | Your wallet is on PUBLIC while the app targets TESTNET (or vice versa) |
| `401 invalid_api_key` | The key is unknown — copy it in full from the Keys page |
| `402 insufficient_credit` | Top up on the Credits page |
| `429 rate_limited` | Per-IP limit on the demo/sponsor/feedback endpoints; retry after the given delay |
| Feedback list looks empty | The serverless store is ephemeral between cold starts — a known limitation, see [FEEDBACK.md](./FEEDBACK.md) |

## Endpoint reference

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | liveness, network, enabled models, sponsor availability |
| `GET` | `/models` | model catalog with per-network availability |
| `POST` | `/v1/chat/completions` | both doors (bearer key → prepaid; otherwise x402) |
| `GET` | `/keys/challenge`, `POST` `/keys` | wallet-proof API key issuance |
| `POST` | `/sponsor` | fee-bump a signed Stellarouter transaction |
| `GET` | `/logs`, `/metrics` | usage log and monitoring aggregates |
| `POST`/`GET` | `/feedback` | product feedback |

## Safety notes

- Stellarouter never sees your secret key — every signature happens in your wallet.
- API keys are stored hashed; the console shows them once at creation.
- The credit vault's solvency invariant is `contract USDC = Σ user balances + treasury`,
  and `collect` is bounded by treasury, so admin sweeps can never reach user credit.
- Full analysis: [SECURITY-REVIEW.md](./SECURITY-REVIEW.md).
