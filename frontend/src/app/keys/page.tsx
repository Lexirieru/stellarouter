"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@stellarouter/ui";

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";

const mask = (k: string) => `${k.slice(0, 18)}…${k.slice(-4)}`;

export default function KeysPage() {
  const { address } = useWallet();
  const [keys, setKeys] = useState<string[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) return;
    try {
      const r = await fetch(`${GATEWAY}/keys?address=${address}`);
      const d = await r.json();
      setKeys(d.keys || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function create() {
    if (!address) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${GATEWAY}/keys`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setNewKey(d.key);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(key: string) {
    await fetch(`${GATEWAY}/keys/${key}`, { method: "DELETE" });
    if (newKey === key) setNewKey(null);
    await refresh();
  }

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Keys for the prepaid (human) door. Send a key as{" "}
        <code className="text-xs">Authorization: Bearer …</code> and calls are
        charged against your on-chain credit.
      </p>

      {!address ? (
        <p className="mt-8 rounded-xl border border-black/10 p-6 text-sm text-zinc-500">
          Connect your Stellar wallet (top right) to manage keys.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-5">
          <button
            onClick={() => void create()}
            disabled={busy}
            className="self-start rounded-lg bg-[var(--color-darkblue)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "creating…" : "Create key"}
          </button>

          {newKey && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
              <div className="text-xs font-medium text-emerald-700">
                New key — copy it now, it won&apos;t be shown again:
              </div>
              <code className="mt-1 block break-all font-mono text-xs">
                {newKey}
              </code>
            </div>
          )}

          <div className="flex flex-col divide-y divide-black/10 rounded-xl border border-black/10">
            {keys.length === 0 && (
              <p className="px-4 py-4 text-sm text-zinc-400">No keys yet.</p>
            )}
            {keys.map((k) => (
              <div key={k} className="flex items-center justify-between px-4 py-3">
                <code className="font-mono text-xs">{mask(k)}</code>
                <button
                  onClick={() => void revoke(k)}
                  className="text-xs text-red-600 hover:underline"
                >
                  revoke
                </button>
              </div>
            ))}
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
