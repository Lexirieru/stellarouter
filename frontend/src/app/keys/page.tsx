"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@stellarouter/ui";

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";

type KeyRow = { id: string; prefix: string; createdAt: number };

export default function KeysPage() {
  const { address, signTransaction } = useWallet();
  const [keys, setKeys] = useState<KeyRow[]>([]);
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
      // 1. Fetch a challenge tx for this address.
      const cr = await fetch(`${GATEWAY}/keys/challenge?address=${address}`);
      const cd = await cr.json();
      if (cd.error) throw new Error(cd.error);
      // 2. Prove ownership by signing it with the wallet.
      const signedXdr = await signTransaction(cd.challenge);
      // 3. Exchange the signed challenge for a key.
      const r = await fetch(`${GATEWAY}/keys`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, signedXdr }),
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

  async function revoke(id: string) {
    await fetch(`${GATEWAY}/keys/${id}`, { method: "DELETE" });
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
          <div className="flex flex-col gap-1">
            <button
              onClick={() => void create()}
              disabled={busy}
              className="self-start rounded-lg bg-[var(--color-darkblue)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "sign in wallet…" : "Create key"}
            </button>
            <span className="text-[11px] text-zinc-500">
              You&apos;ll sign a free challenge in your wallet to prove you own
              this address (no fee, not submitted).
            </span>
          </div>

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
              <div key={k.id} className="flex items-center justify-between px-4 py-3">
                <code className="font-mono text-xs">{k.prefix}</code>
                <button
                  onClick={() => void revoke(k.id)}
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
