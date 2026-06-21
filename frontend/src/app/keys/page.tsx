"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@stellarouter/ui";

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";

type KeyRow = { id: string; prefix: string; name: string | null; createdAt: number };

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function KeysPage() {
  const { address, signTransaction } = useWallet();
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return keys;
    return keys.filter(
      (k) => (k.name || "").toLowerCase().includes(s) || k.prefix.toLowerCase().includes(s)
    );
  }, [keys, query]);

  function openModal() {
    setName("");
    setNewKey(null);
    setCopied(false);
    setError(null);
    setOpen(true);
  }

  async function create() {
    if (!address) return;
    setBusy(true);
    setError(null);
    try {
      const cr = await fetch(`${GATEWAY}/keys/challenge?address=${address}`);
      const cd = await cr.json();
      if (cd.error) throw new Error(cd.error);
      const signedXdr = await signTransaction(cd.challenge);
      const r = await fetch(`${GATEWAY}/keys`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, signedXdr, name: name.trim() }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.message || d.error);
      setNewKey(d.key);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function copyKey() {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Couldn't copy — select the key and copy manually.");
    }
  }

  async function revoke(id: string) {
    await fetch(`${GATEWAY}/keys/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Create and manage keys for the prepaid (human) door.
          </p>
        </div>
        {address && (
          <button
            onClick={openModal}
            className="shrink-0 rounded-lg bg-[var(--color-darkblue)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            + New Key
          </button>
        )}
      </div>

      {!address ? (
        <p className="mt-8 rounded-xl border border-black/10 p-6 text-sm text-zinc-500">
          Connect your Stellar wallet (in the sidebar) to manage keys.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="w-full rounded-full border border-black/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-black/40"
          />

          <div className="overflow-hidden rounded-xl border border-black/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-2 font-medium">Key</th>
                  <th className="px-4 py-2 font-medium">Created</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-zinc-400">
                      No keys yet — create one.
                    </td>
                  </tr>
                )}
                {filtered.map((k) => (
                  <tr key={k.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{k.name || "Untitled key"}</div>
                      <code className="font-mono text-xs text-zinc-500">{k.prefix}</code>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {fmtDate(k.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => void revoke(k.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <span className="text-xs text-zinc-400">{filtered.length} keys</span>
        </div>
      )}

      {error && !open && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* New key modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-black/10 bg-[var(--bg-color)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {!newKey ? (
              <>
                <h2 className="text-lg font-semibold">Create API key</h2>
                <label className="mt-4 block">
                  <span className="text-xs text-zinc-500">Name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='e.g. "My agent"'
                    autoFocus
                    className="mt-1 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40"
                  />
                </label>
                <p className="mt-2 text-[11px] text-zinc-500">
                  You&apos;ll sign a free challenge in your wallet to prove
                  ownership (no fee, not submitted).
                </p>
                {error && (
                  <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
                    {error}
                  </p>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-black/15 px-4 py-2 text-sm transition-colors hover:bg-black/[.04]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void create()}
                    disabled={busy}
                    className="rounded-lg bg-[var(--color-darkblue)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? "sign in wallet…" : "Create"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold">Your new key</h2>
                <p className="mt-1 text-xs text-zinc-600">
                  Copy it now — it won&apos;t be shown again.
                </p>
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-black/10 bg-black/[.03] p-3">
                  <code className="flex-1 break-all font-mono text-xs">{newKey}</code>
                  <button
                    onClick={() => void copyKey()}
                    className="shrink-0 rounded-md bg-[var(--color-darkblue)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                  >
                    {copied ? "Copied ✓" : "Copy"}
                  </button>
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-lg bg-[var(--color-darkblue)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
