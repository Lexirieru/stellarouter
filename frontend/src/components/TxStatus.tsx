"use client";

// Transaction status card — tracks the full lifecycle:
// signing (in the wallet) → submitting → pending (waiting for a ledger) → success/failed.

import type { TxPhase } from "@/lib/credits";

export type TxState = {
  /** Action label, e.g. "Top up", "Refund", "Enable USDC". */
  label: string;
  phase: "signing" | TxPhase;
  hash?: string;
  error?: string;
};

const EXPLORER = "https://stellar.expert/explorer/testnet/tx";

const PHASE_COPY: Record<TxState["phase"], string> = {
  signing: "waiting for signature in your wallet…",
  submitting: "submitting to the network…",
  pending: "pending — waiting for confirmation…",
  success: "confirmed on-chain",
  failed: "failed",
};

export function TxStatus({ state }: { state: TxState | null }) {
  if (!state) return null;
  const { label, phase, hash, error } = state;

  const tone =
    phase === "success"
      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700"
      : phase === "failed"
        ? "border-red-500/30 bg-red-500/5 text-red-700"
        : "border-amber-500/30 bg-amber-500/5 text-amber-700";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tone}`}>
      <div className="flex items-center gap-2">
        {phase === "success" ? (
          <span aria-hidden>✓</span>
        ) : phase === "failed" ? (
          <span aria-hidden>✕</span>
        ) : (
          <span
            aria-hidden
            className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        <span className="font-medium">{label}</span>
        <span className="text-current/80">— {PHASE_COPY[phase]}</span>
      </div>
      {hash && (
        <a
          href={`${EXPLORER}/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block truncate font-mono text-xs underline-offset-2 hover:underline"
          title={hash}
        >
          tx {hash.slice(0, 10)}…{hash.slice(-6)} — view on explorer
        </a>
      )}
      {phase === "failed" && error && (
        <p className="mt-1 text-xs text-current/80">{error}</p>
      )}
    </div>
  );
}
