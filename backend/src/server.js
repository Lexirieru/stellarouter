import "dotenv/config";
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { chatCompletion } from "./llm.js";
import { readBalance, debit, prepaidEnabled } from "./credits.js";
import { agentCall, demoAgentEnabled } from "./demoAgent.js";

// ─── Config (CAIP-2 network id drives testnet vs mainnet from one place) ─────
const NETWORK = process.env.STELLAR_NETWORK || "stellar:testnet";
const PORT = Number(process.env.PORT) || 3001;
const PRICE = process.env.X402_PRICE || "$0.005"; // flat price per call
const FACILITATOR_URL =
  process.env.FACILITATOR_URL ?? "https://channels.openzeppelin.com/x402/testnet";

// Flat price in USDC stroops (7 decimals): "$0.005" → 50000.
const PRICE_STROOPS = Math.round(parseFloat(PRICE.replace(/[^0-9.]/g, "")) * 1e7);

// Human door: API key → Stellar address (in-memory; demo seed from env).
// Production would back this with a DB; Option A debits on-chain per call.
const API_KEYS = new Map();
if (process.env.DEMO_API_KEY && process.env.DEMO_USER_ADDRESS) {
  API_KEYS.set(process.env.DEMO_API_KEY, process.env.DEMO_USER_ADDRESS);
}
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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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
  if (!key || !API_KEYS.has(key)) return next(); // no key → agent door (x402)

  if (!prepaidEnabled) {
    return res.status(503).json({
      error: "prepaid_unavailable",
      message: "Prepaid door not configured (CREDITS_CONTRACT_ID / GATEWAY_ADMIN_SECRET).",
    });
  }

  const user = API_KEYS.get(key);
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
