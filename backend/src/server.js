import "dotenv/config";
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { chatCompletion } from "./llm.js";
import { readBalance, debit, prepaidEnabled } from "./credits.js";
import { agentCall, demoAgentEnabled } from "./demoAgent.js";
import { resolveKey, createKey, listKeys, revokeKey } from "./keyStore.js";
import { buildChallenge, verifyChallenge } from "./auth.js";

// ─── Config (CAIP-2 network id drives testnet vs mainnet from one place) ─────
const NETWORK = process.env.STELLAR_NETWORK || "stellar:testnet";
const PORT = Number(process.env.PORT) || 3001;
const PRICE = process.env.X402_PRICE || "$0.005"; // flat price per call
const FACILITATOR_URL =
  process.env.FACILITATOR_URL ?? "https://channels.openzeppelin.com/x402/testnet";

// Flat price in USDC stroops (7 decimals): "$0.005" → 50000.
const PRICE_STROOPS = Math.round(parseFloat(PRICE.replace(/[^0-9.]/g, "")) * 1e7);

const bearer = (req) => {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : null;
};

if (!process.env.STELLAR_RECIPIENT) {
  throw new Error(
    "STELLAR_RECIPIENT is required — a G... account WITH a USDC trustline that receives per-call payments."
  );
}
if (!process.env.OZ_API_KEY) {
  throw new Error(
    "OZ_API_KEY is required. Generate a testnet key at https://channels.openzeppelin.com/testnet/gen"
  );
}

// ─── x402 facilitator (OZ Channels: verifies + settles + sponsors fees) ──────
const facilitator = new HTTPFacilitatorClient({
  url: FACILITATOR_URL,
  createAuthHeaders: async () => {
    const h = { Authorization: `Bearer ${process.env.OZ_API_KEY}` };
    return { verify: h, settle: h, supported: h };
  },
});

const resourceServer = new x402ResourceServer(facilitator).register(
  NETWORK,
  new ExactStellarScheme()
);

const app = express();
app.use(express.json({ limit: "1mb" }));

// CORS — allow the Playground UI to call the demo endpoint from the browser.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Expose-Headers", "X-Stellarouter-Debit");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Demo agent (for the Playground): pays the gateway via x402 server-side using
// a demo wallet, then returns the completion. Real agents call /v1/... directly.
app.post("/demo/agent-call", async (req, res) => {
  if (!demoAgentEnabled) {
    return res.status(503).json({
      error: "demo_disabled",
      message: "Set PAYER_SECRET_KEY (a USDC-funded demo wallet) to enable the agent demo.",
    });
  }
  try {
    const { status, data } = await agentCall(`http://localhost:${PORT}`, req.body);
    res.json({ ok: status === 200, paid: PRICE, network: NETWORK, completion: data });
  } catch (err) {
    res
      .status(502)
      .json({ error: "demo_error", message: String(err?.message ?? err) });
  }
});

// ─── API keys for the human (prepaid) door ───────────────────────────────────
// Ownership proof: client fetches a challenge tx, signs it with their wallet,
// and posts it back. We only issue a key if the signature proves control of the
// address (so nobody can mint keys against someone else's on-chain credit).
app.get("/keys/challenge", (req, res) => {
  const address = req.query?.address;
  if (typeof address !== "string" || !address.startsWith("G")) {
    return res.status(400).json({ error: "invalid_address" });
  }
  try {
    res.json({ challenge: buildChallenge(address) });
  } catch {
    return res.status(400).json({ error: "invalid_address" });
  }
});

app.post("/keys", (req, res) => {
  const { address, signedXdr } = req.body ?? {};
  if (typeof address !== "string" || !address.startsWith("G")) {
    return res.status(400).json({ error: "invalid_address" });
  }
  if (typeof signedXdr !== "string" || !verifyChallenge(address, signedXdr)) {
    return res.status(401).json({ error: "ownership_proof_failed" });
  }
  res.json({ key: createKey(address) });
});

app.get("/keys", (req, res) => {
  const address = req.query?.address;
  if (typeof address !== "string") {
    return res.status(400).json({ error: "missing_address" });
  }
  res.json({ keys: listKeys(address) });
});

app.delete("/keys/:key", (req, res) => {
  res.json({ revoked: revokeKey(req.params.key) });
});

// Model catalog for the UI — kept on the OpenRouter catalog (rich list),
// independent of where chat is actually routed (UPSTREAM_BASE_URL → 9router).
app.get("/models", async (_req, res) => {
  const base = process.env.MODELS_BASE_URL || "https://openrouter.ai/api/v1";
  try {
    const r = await fetch(`${base}/models?output_modalities=all`);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res
      .status(502)
      .json({ error: "models_error", message: String(err?.message ?? err) });
  }
});

// ─── Free, unpaid endpoints ──────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true, network: NETWORK }));
app.get("/", (_req, res) =>
  res.json({
    name: "stellarouter",
    summary: "One API for every LLM — pay with USDC on Stellar.",
    endpoint: "POST /v1/chat/completions",
    doors: {
      human: prepaidEnabled
        ? "Authorization: Bearer <api-key> → prepaid credit (on-chain debit)"
        : "disabled",
      agent: "no key → x402 pay-per-call",
    },
    price: PRICE,
    network: NETWORK,
    payTo: process.env.STELLAR_RECIPIENT,
  })
);

// ─── Human door (prepaid credits) — runs BEFORE x402 ─────────────────────────
// If a known API key is present, charge the user's on-chain credit (Option A:
// debit per call) and proxy. Otherwise fall through to the x402 agent door.
app.post("/v1/chat/completions", async (req, res, next) => {
  const key = bearer(req);
  const user = key ? resolveKey(key) : null;
  if (!user) return next(); // no/unknown key → agent door (x402)

  if (!prepaidEnabled) {
    return res.status(503).json({
      error: "prepaid_unavailable",
      message: "Prepaid door not configured (CREDITS_CONTRACT_ID / GATEWAY_ADMIN_SECRET).",
    });
  }
  try {
    const balance = await readBalance(user);
    if (balance < BigInt(PRICE_STROOPS)) {
      return res.status(402).json({
        error: "insufficient_credit",
        message: `Top up USDC. balance=${balance} stroops, need=${PRICE_STROOPS}`,
      });
    }

    const completion = await chatCompletion(req.body);

    // Settle on-chain (Option A). Charge only after a successful completion.
    const txHash = await debit(user, PRICE_STROOPS);
    res.setHeader("X-Stellarouter-Debit", `${PRICE_STROOPS}:${txHash}`);
    res.json(completion);
  } catch (err) {
    res
      .status(502)
      .json({ error: "prepaid_error", message: String(err?.message ?? err) });
  }
});

// ─── x402 payment gate in front of the paid LLM route ────────────────────────
// An unpaid request gets HTTP 402 + payment requirements; once the client
// attaches a signed X-PAYMENT header, the facilitator settles USDC on-chain
// (~5s) and the request falls through to the handler below.
app.use(
  paymentMiddleware(
    {
      "POST /v1/chat/completions": {
        accepts: {
          scheme: "exact",
          price: PRICE,
          network: NETWORK,
          payTo: process.env.STELLAR_RECIPIENT,
        },
        description: "One LLM chat completion, routed to any supported model.",
      },
    },
    resourceServer
  )
);

// ─── Paid handler: proxy to the upstream model (or mock if none configured) ──
app.post("/v1/chat/completions", async (req, res) => {
  try {
    const completion = await chatCompletion(req.body);
    res.json(completion);
  } catch (err) {
    res
      .status(502)
      .json({ error: "upstream_error", message: String(err?.message ?? err) });
  }
});

app.listen(PORT, () =>
  console.log(
    `stellarouter gateway → http://localhost:${PORT}  (${NETWORK}, ${PRICE}/call)`
  )
);
