"use client";

// Onboarding checklist (Level 5 — shipped from user feedback: "how do I get
// testnet USDC?"). State-aware: each step checks itself off against the wallet
// and the chain, and the card disappears once everything is done.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@stellarouter/ui";
import { readCredit, walletUsdcInfo } from "@/lib/credits";
import { IS_MAINNET } from "@/lib/explorer";

const DISMISS_KEY = "stellarouter:onboarding-dismissed";

type StepState = { wallet: boolean; usdc: boolean; credit: boolean };

export function GetStarted() {
  const { address, connect } = useWallet();
  const [dismissed, setDismissed] = useState(true); // avoid flash before load
  const [state, setState] = useState<StepState>({ wallet: false, usdc: false, credit: false });

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    if (!address) {
      setState({ wallet: false, usdc: false, credit: false });
      return;
    }
    let stop = false;
    (async () => {
      const [usdc, credit] = await Promise.allSettled([
        walletUsdcInfo(address),
        readCredit(address),
      ]);
      if (stop) return;
      setState({
        wallet: true,
        usdc: usdc.status === "fulfilled" && usdc.value.balance > 0,
        credit: credit.status === "fulfilled" && credit.value > BigInt(0),
      });
    })();
    return () => { stop = true; };
  }, [address]);

  const allDone = state.wallet && state.usdc && state.credit;
  if (dismissed || allDone) return null;

  const steps: { done: boolean; label: React.ReactNode }[] = [
    {
      done: state.wallet,
      label: state.wallet ? (
        <>Wallet connected</>
      ) : (
        <>
          <button onClick={() => connect().catch(() => {})} className="underline underline-offset-2">
            Connect a Stellar wallet
          </button>{" "}
          (Freighter, xBull, Albedo, …) set to <b>Testnet</b>
        </>
      ),
    },
    {
      done: state.usdc,
      label: IS_MAINNET ? (
        <>
          Fund your wallet with <b>USDC</b> on Stellar (any exchange or wallet
          on-ramp) — you only need a small amount to try it
        </>
      ) : (
        <>
          Get testnet funds — XLM from{" "}
          <a
            href={address ? `https://friendbot.stellar.org?addr=${address}` : "https://lab.stellar.org/account/fund"}
            target="_blank" rel="noopener noreferrer" className="underline underline-offset-2"
          >
            friendbot
          </a>{" "}
          and USDC from the{" "}
          <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            Circle faucet
          </a>{" "}
          (choose Stellar testnet)
        </>
      ),
    },
    {
      done: state.credit,
      label: (
        <>
          <Link href="/credits" className="underline underline-offset-2">Top up credits</Link>{" "}
          — deposit USDC into the on-chain vault (refundable any time)
        </>
      ),
    },
  ];

  return (
    <div className="mb-4 rounded-xl border border-black/10 bg-black/[.02] p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
          {IS_MAINNET ? "Get started" : "Get started on testnet"}
        </div>
        <button
          onClick={() => { setDismissed(true); try { localStorage.setItem(DISMISS_KEY, "1"); } catch {} }}
          className="text-xs text-zinc-400 hover:text-zinc-600"
          aria-label="Dismiss onboarding"
        >
          dismiss
        </button>
      </div>
      <ol className="mt-2 flex flex-col gap-1.5 text-sm">
        {steps.map((s, i) => (
          <li key={i} className={`flex items-start gap-2 ${s.done ? "text-zinc-400 line-through" : ""}`}>
            <span className={`mt-px ${s.done ? "text-emerald-500" : "text-zinc-400"}`}>
              {s.done ? "✓" : `${i + 1}.`}
            </span>
            <span>{s.label}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[11px] text-zinc-500">
        AI agent instead? Skip all of this — just POST to /v1/chat/completions and
        pay the 402 with USDC. Zero XLM needed.
      </p>
    </div>
  );
}
