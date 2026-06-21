"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@stellarouter/ui";
import {
  readCredit,
  walletUsdcInfo,
  buildDeposit,
  buildWithdraw,
  buildAddTrustline,
  submit,
  submitClassic,
  toStroops,
  fromStroops,
} from "@/lib/credits";

type Busy = null | "load" | "deposit" | "refund" | "trustline";

export default function CreditsPage() {
  const { address, signTransaction } = useWallet();
  const [credit, setCredit] = useState<bigint | null>(null);
  const [wallet, setWallet] = useState<number | null>(null);
  const [trustline, setTrustline] = useState(true);
  const [amount, setAmount] = useState("1");
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [tx, setTx] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) return;
    setBusy("load");
    setError(null);
    try {
      const [c, w] = await Promise.all([
        readCredit(address),
        walletUsdcInfo(address),
      ]);
      setCredit(c);
      setWallet(w.balance);
      setTrustline(w.trustline);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // One button: enables USDC (trustline) if needed, then deposits — seamless.
  // Two signatures when no trustline (Soroban txs can't bundle a classic op).
  async function topUp() {
    if (!address) return;
    const usdc = parseFloat(amount);
    if (!(usdc > 0)) {
      setError("Enter a positive amount.");
      return;
    }
    setError(null);
    setTx(null);
    try {
      // Step 1 — enable USDC on the wallet if there's no trustline yet.
      if (!trustline) {
        setBusy("trustline");
        const txdr = await buildAddTrustline(address);
        await submitClassic(await signTransaction(txdr));
        setTrustline(true);
      }

      // Re-read the wallet balance (it may be 0 right after enabling).
      const info = await walletUsdcInfo(address);
      setWallet(info.balance);
      if (info.balance < usdc) {
        setError("Not enough USDC in your wallet.");
        return;
      }

      // Step 2 — deposit into the credits contract.
      setBusy("deposit");
      const dxdr = await buildDeposit(address, toStroops(usdc));
      const hash = await submit(await signTransaction(dxdr));
      setTx(hash);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function refund() {
    if (!address || !credit || credit <= BigInt(0)) return;
    await sign("refund", await buildWithdraw(address, credit));
  }

  async function sign(kind: "deposit" | "refund", xdr: string) {
    setBusy(kind);
    setError(null);
    setTx(null);
    try {
      const signed = await signTransaction(xdr);
      const hash = await submit(signed);
      setTx(hash);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Credits</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Top up USDC to fund the prepaid door. Deposits settle on-chain via your
        wallet; refunds return unused credit.
      </p>

      {!address ? (
        <p className="mt-8 rounded-xl border border-black/10 p-6 text-sm text-zinc-500">
          Connect your Stellar wallet (in the sidebar) to manage credits.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-5">
          {/* Credit balance + refund */}
          <div className="rounded-xl border border-black/10 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Credit balance
                </div>
                <div className="mt-1 text-3xl font-semibold">
                  {credit === null ? "—" : fromStroops(credit).toFixed(3)}{" "}
                  <span className="text-base font-normal text-zinc-500">USDC</span>
                </div>
              </div>
              <button
                onClick={() => void refund()}
                disabled={busy !== null || !credit || credit <= BigInt(0)}
                className="rounded-lg border border-black/20 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/[.04] disabled:opacity-40"
              >
                {busy === "refund" ? "refunding…" : "Refund"}
              </button>
            </div>
            <button
              onClick={() => void refresh()}
              disabled={busy !== null}
              className="mt-2 text-xs text-[var(--color-darkblue)] hover:underline disabled:opacity-50"
            >
              {busy === "load" ? "refreshing…" : "refresh"}
            </button>
          </div>

          {/* Top up */}
          <div className="rounded-xl border border-black/10 p-5">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Top up from wallet</span>
              <span>
                {wallet === null ? "—" : wallet.toFixed(3)} USDC available
              </span>
            </div>
            {!trustline && (
              <p className="mt-2 text-[11px] text-zinc-500">
                Your first top up also enables USDC on your wallet (one extra
                signature).
              </p>
            )}
            <div className="mt-3 flex items-end gap-2">
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs text-zinc-500">Amount (USDC)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40"
                />
              </label>
              <button
                onClick={() => void topUp()}
                disabled={busy !== null}
                className="rounded-lg bg-[var(--color-darkblue)] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy === "trustline"
                  ? "enabling USDC…"
                  : busy === "deposit"
                    ? "topping up…"
                    : "Top up"}
              </button>
            </div>
          </div>

          {tx && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${tx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-emerald-600 hover:underline"
            >
              ✓ settled — {tx.slice(0, 12)}… (view on explorer)
            </a>
          )}
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
