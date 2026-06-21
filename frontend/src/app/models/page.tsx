"use client";

import { useEffect, useMemo, useState } from "react";

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";

type Model = {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
};

const perM = (v?: string) => {
  const n = Number(v ?? 0) * 1e6;
  if (!Number.isFinite(n) || n === 0) return "Free";
  return `$${n.toFixed(n < 1 ? 3 : 2)}/M`;
};

const ctx = (n?: number) => {
  if (!n) return "—";
  if (n >= 1e6) return `${(n / 1e6).toFixed(n % 1e6 ? 1 : 0)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
  return String(n);
};

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${GATEWAY}/models`);
        const d = await r.json();
        if (d.error) throw new Error(d.message || d.error);
        setModels(d.data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return models;
    return models.filter(
      (m) =>
        m.id.toLowerCase().includes(s) || m.name?.toLowerCase().includes(s)
    );
  }, [q, models]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Models</h1>
        <span className="text-sm text-zinc-500">{filtered.length} models</span>
      </div>
      <p className="mt-2 text-sm text-zinc-600">
        One API for hundreds of models — pay per call in USDC on Stellar.
      </p>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search models…"
        className="mt-4 w-full rounded-full border border-black/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-black/40"
      />

      {loading && <p className="mt-6 text-sm text-zinc-500">Loading models…</p>}
      {error && (
        <p className="mt-6 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {filtered.map((m) => (
          <div key={m.id} className="rounded-xl border border-black/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">{m.name}</div>
              <code className="shrink-0 font-mono text-[11px] text-zinc-500">
                {m.id}
              </code>
            </div>
            {m.description && (
              <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                {m.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
              <span>{ctx(m.context_length)} context</span>
              <span>{perM(m.pricing?.prompt)} in</span>
              <span>{perM(m.pricing?.completion)} out</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
