// Example x402 buyer (an "AI agent" paying per call).
//
// wrapFetchWithPaymentFromConfig returns a fetch that transparently handles the
// 402 negotiation and signs the Soroban auth entry — the payer needs USDC but
// ZERO XLM (the facilitator sponsors network fees).
//
// Requires PAYER_SECRET_KEY: an S... key whose account has a USDC trustline and
// a USDC balance. Run the gateway first (npm start), then: npm run client

import "dotenv/config";
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";

const NETWORK = process.env.STELLAR_NETWORK || "stellar:testnet";
const GATEWAY = process.env.GATEWAY_URL || "http://localhost:3001";

if (!process.env.PAYER_SECRET_KEY) {
  throw new Error(
    "PAYER_SECRET_KEY is required — an S... key with a USDC trustline + balance."
  );
}

// createEd25519Signer takes the raw S... secret and the CAIP-2 network id.
const signer = createEd25519Signer(process.env.PAYER_SECRET_KEY, NETWORK);

const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [{ network: NETWORK, client: new ExactStellarScheme(signer) }],
});

const res = await fetchWithPayment(`${GATEWAY}/v1/chat/completions`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Hello from an AI agent paying in USDC!" }],
  }),
});

console.log("status:", res.status);
console.log(JSON.stringify(await res.json(), null, 2));
