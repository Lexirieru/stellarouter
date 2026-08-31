"use client";

// Analytics & monitoring — Level 4. On-chain stats are computed client-side
// from contract events (authoritative); gateway metrics and feedback come from
// the hosted gateway when it is reachable.

import { useEffect, useState } from "react";
import { fetchChainStats, type ChainStats } from "@/lib/analytics";
import { GATEWAY } from "@/lib/gateway";

type Metrics = {
  uptimeSeconds: number;
  serverless: boolean;
  calls: { total: number; byMode: Record<string, number>; byModel: Record<string, number> };
  upstreamCostUSD: number;
  avgTokensPerSecond: number | null;
  feedback: { count: number; avgRating: number | null };
  priceUSDCPerCall: string;
};
type FeedbackRow = { ts: number; rating: number; text: string; wallet: string | null; page: string | null };

const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-black/10 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-zinc-500">{hint}</div>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [chain, setChain] = useState<ChainStats | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, m, f] = await Promise.allSettled([
          fetchChainStats(),
          fetch(`${GATEWAY}/metrics`).then((r) => r.json()),
          fetch(`${GATEWAY}/feedback`).then((r) => r.json()),
        ]);
        if (c.status === "fulfilled") setChain(c.value);
        else setError("On-chain stats unavailable: " + String((c.reason as Error)?.message ?? c.reason));
        if (m.status === "fulfilled" && m.value?.ok) setMetrics(m.value);
        if (f.status === "fulfilled" && Array.isArray(f.value?.feedback)) setFeedback(f.value.feedback);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const maxVol = chain ? Math.max(...chain.daily.map((d) => d.volume), 0.001) : 1;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Usage, revenue and monitoring. On-chain numbers are read straight from
        the credits contract&apos;s events — anyone can verify them on the explorer.
      </p>

      {loading && <p className="mt-6 text-sm text-zinc-500">Loading analytics…</p>}
      {error && (
        <p className="mt-6 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {chain && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Tile label="Unique wallets" value={String(chain.uniqueUsers)} hint="last 7 days" />
            <Tile label="Deposited" value={`${chain.totals.deposit.toFixed(2)} USDC`} />
            <Tile label="Revenue (debits)" value={`${chain.totals.debit.toFixed(3)} USDC`} />
            <Tile label="Withdrawn" value={`${chain.totals.withdraw.toFixed(2)} USDC`} />
          </div>

          {/* Daily on-chain USDC volume — single series, brand hue */}
          <div className="mt-4 rounded-xl border border-black/10 p-5">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Daily on-chain volume (USDC · all contract events)
            </div>
            <div className="mt-4 flex h-36 items-end gap-2" role="img"
              aria-label={`Daily USDC volume, last 7 days: ${chain.daily.map((d) => `${d.date} ${d.volume}`).join(", ")}`}>
              {chain.daily.map((d) => (
                <div key={d.date} className="group flex flex-1 flex-col items-center gap-1"
                  title={`${d.date}: ${d.volume} USDC`}>
                  {d.volume === maxVol && d.volume > 0 && (
                    <span className="text-[10px] text-zinc-500">{d.volume.toFixed(1)}</span>
                  )}
                  <div
                    className="w-full max-w-8 rounded-t bg-[var(--color-darkblue)] transition-opacity group-hover:opacity-80"
                    style={{ height: `${Math.max((d.volume / maxVol) * 112, d.volume > 0 ? 3 : 1)}px`, opacity: d.volume > 0 ? 1 : 0.15 }}
                  />
                  <span className="text-[10px] text-zinc-500">{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
            <div className="mt-1 border-t border-black/10 pt-1 text-[11px] text-zinc-500">
              {chain.eventCount} contract events in the window
            </div>
          </div>
        </>
      )}

      {metrics && (
        <div className="mt-4 rounded-xl border border-black/10 p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-zinc-500">Gateway monitoring</div>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> live
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Tile label="Calls (instance)" value={String(metrics.calls.total)}
              hint={metrics.serverless ? "serverless — since cold start" : "since boot"} />
            <Tile label="Upstream cost" value={`$${metrics.upstreamCostUSD.toFixed(4)}`} hint="free models on testnet" />
            <Tile label="Avg speed" value={metrics.avgTokensPerSecond ? `${metrics.avgTokensPerSecond} tok/s` : "—"} />
            <Tile label="Price / call" value={metrics.priceUSDCPerCall} hint="x402 flat" />
          </div>
          {Object.keys(metrics.calls.byModel).length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-zinc-500">
                    <th className="py-1.5 pr-4 font-medium">Model</th>
                    <th className="py-1.5 font-medium">Calls</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(metrics.calls.byModel)
                    .sort((a, b) => b[1] - a[1])
                    .map(([model, n]) => (
                      <tr key={model} className="border-b border-black/5">
                        <td className="py-1.5 pr-4 font-mono text-xs">{model}</td>
                        <td className="py-1.5">{n}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-black/10 p-5">
        <div className="text-xs uppercase tracking-wide text-zinc-500">Recent feedback</div>
        {feedback.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">
            No feedback yet — use the Feedback button (bottom-right) to leave some.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-black/5">
            {feedback.map((f, i) => (
              <li key={i} className="py-2 text-sm">
                <span className="mr-2">{"⭐".repeat(f.rating)}</span>
                {f.text}
                <span className="ml-2 text-xs text-zinc-500">
                  {f.wallet ? short(f.wallet) : "anon"} · {new Date(f.ts).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
