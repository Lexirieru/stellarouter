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
import { describeError, errorLabel, type UiError } from "@/lib/errors";
import { TxStatus, type TxState } from "@/components/TxStatus";
import { ActivityFeed } from "@/components/ActivityFeed";

type Busy = null | "load" | "deposit" | "refund" | "trustline";

export default function CreditsPage() {
  const { address, signTransaction } = useWallet();
  const [credit, setCredit] = useState<bigint | null>(null);
  const [wallet, setWallet] = useState<number | null>(null);
  const [trustline, setTrustline] = useState(true);
  const [amount, setAmount] = useState("1");
  const [busy, setBusy] = useState<Busy>(null);
  const [uiError, setUiError] = useState<UiError | null>(null);
  const [txState, setTxState] = useState<TxState | null>(null);

  const refresh = useCallback(async () => {
    if (!address) return;
    setBusy("load");
    try {
      const [c, w] = await Promise.all([
        readCredit(address),
        walletUsdcInfo(address),
      ]);
      setCredit(c);
      setWallet(w.balance);
      setTrustline(w.trustline);
    } catch (e) {
      setUiError(describeError(e));
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
      setUiError({ kind: "failed", message: "Enter a positive amount." });
      return;
    }
    setUiError(null);
    setTxState(null);
    try {
      // Step 1 — enable USDC on the wallet if there's no trustline yet.
      if (!trustline) {
        setBusy("trustline");
        setTxState({ label: "Enable USDC", phase: "signing" });
        const txdr = await buildAddTrustline(address);
        const signed = await signTransaction(txdr);
        await submitClassic(signed, (u) =>
          setTxState({ label: "Enable USDC", ...u })
        );
        setTrustline(true);
      }

      // Re-read the wallet balance (it may be 0 right after enabling).
      const info = await walletUsdcInfo(address);
      setWallet(info.balance);
      if (info.balance < usdc) {
        setUiError({
          kind: "insufficient-balance",
          message: `Not enough USDC in your wallet (${info.balance.toFixed(3)} available, ${usdc} requested).`,
        });
        setTxState(null);
        return;
      }

      // Step 2 — deposit into the credits contract.
      setBusy("deposit");
      setTxState({ label: "Top up", phase: "signing" });
      const dxdr = await buildDeposit(address, toStroops(usdc));
      const signed = await signTransaction(dxdr);
      await submit(signed, (u) => setTxState({ label: "Top up", ...u }));
      await refresh();
    } catch (e) {
      setUiError(describeError(e));
      setTxState((s) =>
        s && (s.phase === "signing" || s.phase === "submitting")
          ? null // failed before reaching the network (e.g. user rejected) — the error chip is enough
          : s
      );
    } finally {
      setBusy(null);
    }
  }

  async function refund() {
    if (!address || !credit || credit <= BigInt(0)) return;
    setBusy("refund");
    setUiError(null);
    setTxState({ label: "Refund", phase: "signing" });
    try {
      const xdr = await buildWithdraw(address, credit);
      const signed = await signTransaction(xdr);
      await submit(signed, (u) => setTxState({ label: "Refund", ...u }));
      await refresh();
    } catch (e) {
      setUiError(describeError(e));
      setTxState((s) =>
        s && (s.phase === "signing" || s.phase === "submitting") ? null : s
      );
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

      <div className="mt-6 flex flex-col gap-5">
        {!address ? (
          <p className="rounded-xl border border-black/10 p-6 text-sm text-zinc-500">
            Connect your Stellar wallet (in the sidebar) to manage credits.
          </p>
        ) : (
          <>
            {/* Credit balance + refund */}
            <div className="rounded-xl border border-black/10 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Credit balance
                  </div>
                  <div className="mt-1 text-3xl font-semibold">
                    {credit === null ? "—" : fromStroops(credit).toFixed(3)}{" "}
                    <span className="text-base font-normal text-zinc-500">
                      USDC
                    </span>
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

            {/* Transaction status: signing → submitting → pending → success/failed */}
            <TxStatus state={txState} />

            {uiError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
                <span className="mt-px shrink-0 rounded-full border border-red-500/40 px-2 py-px text-[10px] font-semibold uppercase tracking-wide">
                  {errorLabel(uiError.kind)}
                </span>
                <span>{uiError.message}</span>
              </div>
            )}
          </>
        )}

        {/* Live on-chain events from the credits contract (visible to anyone) */}
        <ActivityFeed address={address} onUserActivity={refresh} />
      </div>
    </div>
  );
}
