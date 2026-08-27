// Per-network model policy.
//
// Testnet uses play-money USDC, but the upstream LLM provider (OpenRouter)
// bills real dollars — so on testnet only FREE/cheapest models are enabled.
// The catalog is still shown in full so the product looks complete; other
// models are labelled "available in mainnet" and rejected BEFORE payment.
// On pubnet (mainnet) the whole catalog is enabled with no code change.

const NETWORK = process.env.STELLAR_NETWORK || "stellar:testnet";
export const IS_MAINNET = NETWORK === "stellar:pubnet";

// Free models on OpenRouter (":free" suffix = $0 in/out). Override via env:
//   TESTNET_MODELS=google/gemma-4-31b-it:free,minimax/minimax-m3:free
// Order = fallback priority (probed 27 Aug 2026: minimax is the most stable and
// answers cleanly; gemma is good but often 429s; nemotron is the last resort).
const DEFAULT_TESTNET_MODELS = [
  "minimax/minimax-m3:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];

export const TESTNET_MODELS = (process.env.TESTNET_MODELS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (TESTNET_MODELS.length === 0) TESTNET_MODELS.push(...DEFAULT_TESTNET_MODELS);

const allowed = new Set(TESTNET_MODELS);

/** Default model for requests that omit `model`. */
export const DEFAULT_MODEL = IS_MAINNET ? "openai/gpt-4o-mini" : TESTNET_MODELS[0];

export function isModelEnabled(id) {
  if (IS_MAINNET) return true;
  return typeof id === "string" && allowed.has(id);
}

/** Models usable right now (empty = all of them, on mainnet). */
export function enabledModels() {
  return IS_MAINNET ? [] : [...TESTNET_MODELS];
}

/**
 * Add `enabled` + `availability` to every OpenRouter catalog entry and float the
 * enabled models to the top.
 */
export function annotateCatalog(data) {
  const list = Array.isArray(data?.data) ? data.data : [];
  const annotated = list.map((m) => {
    const enabled = isModelEnabled(m.id);
    return { ...m, enabled, availability: enabled ? "now" : "mainnet" };
  });
  annotated.sort((a, b) => Number(b.enabled) - Number(a.enabled));
  return {
    ...data,
    data: annotated,
    network: NETWORK,
    enabled_models: enabledModels(),
    policy: IS_MAINNET
      ? "all models enabled"
      : "testnet: only free/cheapest models enabled — full catalog on mainnet",
  };
}

/**
 * Validate `body.model` for a chat request, filling in the default when absent.
 * Returns an error object (for res.status(400).json(...)) or null.
 */
export function gateModel(body) {
  if (!body || typeof body !== "object") return null;
  if (!body.model) {
    body.model = DEFAULT_MODEL;
    return null;
  }
  if (isModelEnabled(body.model)) return null;
  return {
    error: "model_unavailable_on_testnet",
    message: `"${body.model}" is available on mainnet only. Enabled on ${NETWORK}: ${TESTNET_MODELS.join(", ")}.`,
    enabled_models: enabledModels(),
    availability: "mainnet",
  };
}
