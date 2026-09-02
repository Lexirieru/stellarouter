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

const parseList = (v) =>
  (v || "").split(",").map((s) => s.trim()).filter(Boolean);

export const TESTNET_MODELS = parseList(process.env.TESTNET_MODELS);
if (TESTNET_MODELS.length === 0) TESTNET_MODELS.push(...DEFAULT_TESTNET_MODELS);

// On mainnet the catalog is open by default, but the x402 door charges a FLAT
// price per call — an expensive model can cost more than it earns. Setting
// MAINNET_MODELS caps that exposure to a known-cheap allow-list; leaving it
// unset keeps every model enabled.
export const MAINNET_MODELS = parseList(process.env.MAINNET_MODELS);

const ACTIVE = IS_MAINNET ? MAINNET_MODELS : TESTNET_MODELS;
const UNRESTRICTED = IS_MAINNET && MAINNET_MODELS.length === 0;

const allowed = new Set(ACTIVE);

/** Default model for requests that omit `model`. */
export const DEFAULT_MODEL = UNRESTRICTED ? "openai/gpt-4o-mini" : ACTIVE[0];

export function isModelEnabled(id) {
  if (UNRESTRICTED) return true;
  return typeof id === "string" && allowed.has(id);
}

/** Models usable right now (empty = every model, i.e. unrestricted mainnet). */
export function enabledModels() {
  return UNRESTRICTED ? [] : [...ACTIVE];
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
    policy: UNRESTRICTED
      ? "all models enabled"
      : IS_MAINNET
        ? "mainnet: allow-listed models only (flat-price x402 cost guard)"
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
    error: IS_MAINNET ? "model_not_enabled" : "model_unavailable_on_testnet",
    message: `"${body.model}" is not enabled on ${NETWORK}. Enabled: ${ACTIVE.join(", ")}.`,
    enabled_models: enabledModels(),
    availability: "mainnet",
  };
}
