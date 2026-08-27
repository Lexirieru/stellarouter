// Upstream LLM proxy. Forwards an OpenAI-compatible chat request to a real
// provider when configured; otherwise returns a mock so the x402 payment flow
// is demoable end-to-end without an LLM key.

import { enabledModels, IS_MAINNET } from "./modelPolicy.js";

const UPSTREAM_BASE_URL = process.env.UPSTREAM_BASE_URL; // e.g. https://api.openai.com/v1
const UPSTREAM_API_KEY = process.env.UPSTREAM_API_KEY;
// Some upstreams namespace models by provider (e.g. 9router expects
// "openrouter/openai/gpt-4o-mini"). Prepend this prefix when set.
const MODEL_PREFIX = process.env.UPSTREAM_MODEL_PREFIX || "";
// x402 charges a flat price per call, so the completion size must be bounded
// or a single call could cost more than it earns. Callers can still pass
// their own (smaller or larger) max_tokens explicitly.
const DEFAULT_MAX_TOKENS = Number(process.env.UPSTREAM_MAX_TOKENS || 512);

function applyPrefix(body) {
  let out = body;
  if (MODEL_PREFIX && typeof out?.model === "string" && !out.model.startsWith(MODEL_PREFIX)) {
    out = { ...out, model: MODEL_PREFIX + out.model };
  }
  if (out?.max_tokens == null) {
    out = { ...out, max_tokens: DEFAULT_MAX_TOKENS };
  }
  return out;
}

export async function chatCompletion(body) {
  // No upstream configured → mock completion (payment already settled by now).
  if (!UPSTREAM_BASE_URL || !UPSTREAM_API_KEY) {
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const lastUser = messages[messages.length - 1]?.content ?? "";
    return {
      id: "chatcmpl-stellarouter-mock",
      object: "chat.completion",
      model: body?.model ?? "stellarouter-mock",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: `(mock) paid via x402 ✓ — you said: ${lastUser}`,
          },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      _note: "Set UPSTREAM_BASE_URL + UPSTREAM_API_KEY to route to a real model.",
    };
  }

  // Testnet routes to free models, which get rate-limited (429) or flap (5xx)
  // at the provider. The caller has already paid, so instead of failing we
  // fall through the other enabled free models before giving up.
  const candidates = IS_MAINNET
    ? [body.model]
    : [...new Set([body.model, ...enabledModels()].filter(Boolean))];

  let lastError;
  for (const model of candidates) {
    const resp = await fetch(`${UPSTREAM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${UPSTREAM_API_KEY}`,
      },
      body: JSON.stringify(applyPrefix({ ...body, model })),
    });

    const text = await resp.text();
    if (!resp.ok) {
      lastError = new Error(`upstream ${resp.status} (${model}): ${text.slice(0, 300)}`);
      if (!RETRYABLE.has(resp.status)) throw lastError;
      continue; // coba model aktif berikutnya
    }
    // Some upstreams (9router) append a trailing "data: [DONE]" after the JSON
    // and/or leading whitespace — strip those before parsing.
    const cleaned = text
      .trim()
      .replace(/\s*data:\s*\[DONE\][\s\S]*$/i, "")
      .trim();
    try {
      const json = JSON.parse(cleaned);
      if (model !== body.model) json._fallback_from = body.model;
      return json;
    } catch {
      throw new Error(`upstream parse error: ${cleaned.slice(0, 200)}`);
    }
  }
  throw lastError ?? new Error("upstream: no model candidates");
}

// Status upstream yang layak dicoba ulang dengan model lain.
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);
