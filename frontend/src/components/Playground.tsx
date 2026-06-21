"use client";

import { useState } from "react";

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";

const MODELS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-3.5-sonnet",
  "meta-llama/llama-3.1-8b-instruct",
];

type Receipt = { paid: string; network: string };
type Msg = { role: "user" | "assistant"; content: string; receipt?: Receipt };

export function Playground() {
  const [model, setModel] = useState(MODELS[0]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!input.trim() || loading) return;
    const history: Msg[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(history);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${GATEWAY}/demo/agent-call`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.message || data.error || "request failed");
      }
      const reply =
        data.completion?.choices?.[0]?.message?.content ?? "(no content)";
      setMessages([
        ...history,
        {
          role: "assistant",
          content: reply,
          receipt: { paid: data.paid, network: data.network },
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Agent Playground</h1>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm dark:border-white/20"
        >
          {MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Each call is paid per request in USDC on Stellar via x402 (from a demo
        agent wallet). Settles on-chain — expect a few seconds.
      </p>

      <div className="flex flex-1 flex-col gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10">
        {messages.length === 0 && !loading && (
          <p className="m-auto text-sm text-zinc-400">
            Send a message to make your first paid call.
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "self-end text-right" : "self-start"}
          >
            <div
              className={`inline-block max-w-md whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                m.role === "user"
                  ? "bg-foreground text-background"
                  : "bg-black/[.05] dark:bg-white/[.08]"
              }`}
            >
              {m.content}
            </div>
            {m.receipt && (
              <div className="mt-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                ✓ paid {m.receipt.paid} · {m.receipt.network}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="self-start">
            <div className="inline-block rounded-2xl bg-black/[.05] px-4 py-2 text-sm dark:bg-white/[.08]">
              <span className="animate-pulse">paying & generating…</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="Ask anything…"
          disabled={loading}
          className="flex-1 rounded-full border border-black/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-black/40 disabled:opacity-60 dark:border-white/20 dark:focus:border-white/50"
        />
        <button
          onClick={run}
          disabled={loading || !input.trim()}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
