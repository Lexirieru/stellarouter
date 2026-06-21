"use client";

import { useState } from "react";

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";

const MODELS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-3.5-sonnet",
  "meta-llama/llama-3.1-8b-instruct",
];

type Mode = "agent" | "human";
type Receipt = { label: string; tx?: string };
type Msg = { role: "user" | "assistant"; content: string; receipt?: Receipt };

export function Playground() {
  const [mode, setMode] = useState<Mode>("agent");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(MODELS[0]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!input.trim() || loading) return;
    if (mode === "human" && !apiKey.trim()) {
      setError("Enter an API key (create one on the Keys page).");
      return;
    }
    const history: Msg[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(history);
    setInput("");
    setLoading(true);
    setError(null);

    const body = {
      model,
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    };

    try {
      let reply: string;
      let receipt: Receipt;

      if (mode === "agent") {
        const res = await fetch(`${GATEWAY}/demo/agent-call`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.message || data.error || `HTTP ${res.status}`);
        }
        reply = data.completion?.choices?.[0]?.message?.content ?? "(no content)";
        receipt = { label: `paid ${data.paid} · x402` };
      } else {
        const res = await fetch(`${GATEWAY}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.message || data.error || `HTTP ${res.status}`);
        }
        reply = data.choices?.[0]?.message?.content ?? "(no content)";
        const [stroops, tx] =
          (res.headers.get("X-Stellarouter-Debit") || "").split(":");
        const usdc = stroops ? (Number(stroops) / 1e7).toFixed(4) : "?";
        receipt = { label: `debited ${usdc} USDC from credit · prepaid`, tx };
      }

      setMessages([...history, { role: "assistant", content: reply, receipt }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Playground</h1>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm"
        >
          {MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Door toggle */}
      <div className="flex gap-1 rounded-full border border-black/10 p-1 text-sm self-start">
        {(["agent", "human"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              mode === m ? "bg-[var(--color-darkblue)] text-white" : "hover:bg-black/[.05]"
            }`}
          >
            {m === "agent" ? "Agent (x402)" : "Human (prepaid)"}
          </button>
        ))}
      </div>

      <p className="text-sm text-zinc-500">
        {mode === "agent"
          ? "Pay per request in USDC via x402 (from a demo agent wallet). Settles on-chain — a few seconds per call."
          : "Charge each call against your prepaid on-chain credit using an API key."}
      </p>

      {mode === "human" && (
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-stellarouter-…  (from the Keys page)"
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 font-mono text-xs outline-none focus:border-black/40"
        />
      )}

      <div className="flex flex-1 flex-col gap-3 rounded-xl border border-black/10 p-4">
        {messages.length === 0 && !loading && (
          <p className="m-auto text-sm text-zinc-400">
            Send a message to make your first paid call.
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "self-end text-right" : "self-start"}>
            <div
              className={`inline-block max-w-md whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                m.role === "user"
                  ? "bg-[var(--color-darkblue)] text-white"
                  : "bg-black/[.05]"
              }`}
            >
              {m.content}
            </div>
            {m.receipt && (
              <div className="mt-1 font-mono text-[11px] text-emerald-600">
                ✓ {m.receipt.label}
                {m.receipt.tx && (
                  <>
                    {" · "}
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${m.receipt.tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      tx
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="self-start">
            <div className="inline-block rounded-2xl bg-black/[.05] px-4 py-2 text-sm">
              <span className="animate-pulse">paying & generating…</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="Ask anything…"
          disabled={loading}
          className="flex-1 rounded-full border border-black/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-black/40 disabled:opacity-60"
        />
        <button
          onClick={run}
          disabled={loading || !input.trim()}
          className="rounded-full bg-[var(--color-darkblue)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
