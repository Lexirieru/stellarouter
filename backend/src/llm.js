// Upstream LLM proxy. Forwards an OpenAI-compatible chat request to a real
// provider when configured; otherwise returns a mock so the x402 payment flow
// is demoable end-to-end without an LLM key.

const UPSTREAM_BASE_URL = process.env.UPSTREAM_BASE_URL; // e.g. https://api.openai.com/v1
const UPSTREAM_API_KEY = process.env.UPSTREAM_API_KEY;
// Some upstreams namespace models by provider (e.g. 9router expects
// "openrouter/openai/gpt-4o-mini"). Prepend this prefix when set.
const MODEL_PREFIX = process.env.UPSTREAM_MODEL_PREFIX || "";

function applyPrefix(body) {
  if (!MODEL_PREFIX || typeof body?.model !== "string") return body;
  if (body.model.startsWith(MODEL_PREFIX)) return body;
  return { ...body, model: MODEL_PREFIX + body.model };
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

  const resp = await fetch(`${UPSTREAM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${UPSTREAM_API_KEY}`,
    },
    body: JSON.stringify(applyPrefix(body)),
  });

  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`upstream ${resp.status}: ${text.slice(0, 300)}`);
  }
  // Some upstreams (9router) append a trailing "data: [DONE]" after the JSON
  // and/or leading whitespace — strip those before parsing.
  const cleaned = text
    .trim()
    .replace(/\s*data:\s*\[DONE\][\s\S]*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`upstream parse error: ${cleaned.slice(0, 200)}`);
  }
}
