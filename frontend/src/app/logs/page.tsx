"use client";

import { useCallback, useEffect, useState } from "react";

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";

type Log = {
  ts: number;
  model: string | null;
  provider: string | null;
  promptTokens: number;
  completionTokens: number;
  cost: number | null;
  mode: string | null;
  label: string | null;
  speed: number | null;
  finishReason: string | null;
};

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtCost = (c: number | null) =>
  c == null ? "—" : `$${c < 0.01 ? c.toPrecision(2) : c.toFixed(4)}`;

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${GATEWAY}/logs`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setLogs(d.logs || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Logs</h1>
        <button
          onClick={() => void refresh()}
          disabled={loading}
          className="text-sm text-[var(--color-darkblue)] hover:underline disabled:opacity-50"
        >
          {loading ? "loading…" : "refresh"}
        </button>
      </div>
      <p className="mt-2 text-sm text-zinc-600">
        Your request logs and history — every call across both doors.
      </p>

      {error && (
        <p className="mt-6 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-black/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Model</th>
              <th className="px-3 py-2 font-medium">Provider</th>
              <th className="px-3 py-2 font-medium">In</th>
              <th className="px-3 py-2 font-medium">Out</th>
              <th className="px-3 py-2 font-medium">Cost</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Speed</th>
              <th className="px-3 py-2 font-medium">Finish</th>
              <th className="px-3 py-2 font-medium">Key</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-zinc-400">
                  No requests yet. Make a call in the Playground.
                </td>
              </tr>
            )}
            {logs.map((l, i) => (
              <tr key={i} className="text-zinc-700">
                <td className="whitespace-nowrap px-3 py-2 text-zinc-500">
                  {fmtDate(l.ts)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                  {l.model}
                </td>
                <td className="whitespace-nowrap px-3 py-2">{l.provider}</td>
                <td className="px-3 py-2">{l.promptTokens}</td>
                <td className="px-3 py-2">{l.completionTokens}</td>
                <td className="whitespace-nowrap px-3 py-2">{fmtCost(l.cost)}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      l.mode === "prepaid"
                        ? "bg-[var(--color-darkblue)]/10 text-[var(--color-darkblue)]"
                        : "bg-black/[.06]"
                    }`}
                  >
                    {l.mode}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-zinc-500">
                  {l.speed == null ? "—" : `${l.speed.toFixed(1)} tok/s`}
                </td>
                <td className="px-3 py-2 text-zinc-500">{l.finishReason}</td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-zinc-500">
                  {l.label}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
