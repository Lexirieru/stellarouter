// Demo agent for the Playground UI.
//
// The x402 agent door needs a raw S... key + Node to sign auth entries — a
// browser wallet can't do that directly. So the UI calls this server-side
// "demo agent", which pays the gateway via x402 from a demo wallet and returns
// the completion. Real agents call the gateway directly (see SKILL.md).

import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";

const NETWORK = process.env.STELLAR_NETWORK || "stellar:testnet";
const PAYER = process.env.PAYER_SECRET_KEY;

export const demoAgentEnabled = Boolean(PAYER);

let _fetch;
function payFetch() {
  if (!_fetch) {
    const signer = createEd25519Signer(PAYER, NETWORK);
    _fetch = wrapFetchWithPaymentFromConfig(fetch, {
      schemes: [{ network: NETWORK, client: new ExactStellarScheme(signer) }],
    });
  }
  return _fetch;
}

/** Pay the gateway's x402 door and return the completion. */
export async function agentCall(gatewayUrl, body) {
  const res = await payFetch()(`${gatewayUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}
