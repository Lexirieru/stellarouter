"use client";

// Real-time on-chain activity feed for the credits contract.
// Polls RPC getEvents every few seconds; new events appear at the top.

import { useEffect, useRef, useState } from "react";
import { fromStroops } from "@/lib/credits";
import { fetchCreditEvents, type CreditEvent } from "@/lib/events";

const POLL_MS = 5_000;
const MAX_ROWS = 25;

const TYPE_META: Record<
  CreditEvent["type"],
  { icon: string; label: string; tone: string }
> = {
  deposit: { icon: "↓", label: "deposit", tone: "text-emerald-600" },
  debit: { icon: "−", label: "debit", tone: "text-amber-600" },
  withdraw: { icon: "↑", label: "withdraw", tone: "text-sky-600" },
  collect: { icon: "⌁", label: "collect", tone: "text-zinc-500" },
};

function short(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function ActivityFeed({
  address,
  onUserActivity,
}: {
  /** The connected wallet address (for highlighting + auto-refresh). */
  address: string | null;
  /** Called when a new event involves `address` (e.g. a debit by the gateway). */
  onUserActivity?: () => void;
}) {
  const [events, setEvents] = useState<CreditEvent[]>([]);
  const [live, setLive] = useState(false);
  const cursorRef = useRef<number | undefined>(undefined);
  const seenRef = useRef<Set<string>>(new Set());
  const userCbRef = useRef(onUserActivity);
  userCbRef.current = onUserActivity;
  const addressRef = useRef(address);
  addressRef.current = address;

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let firstLoad = true;

    async function poll() {
      try {
        const { events: fresh, nextLedger } = await fetchCreditEvents(
          cursorRef.current
        );
        if (stop) return;
        cursorRef.current = nextLedger;
        setLive(true);

        const unseen = fresh.filter((e) => !seenRef.current.has(e.id));
        if (unseen.length > 0) {
          unseen.forEach((e) => seenRef.current.add(e.id));
          setEvents((prev) =>
            [...unseen, ...prev]
              .sort((a, b) => (a.id < b.id ? 1 : -1))
              .slice(0, MAX_ROWS)
          );
          // Refresh the balance when activity involves the connected wallet
          // (except for the initial backfill batch — that's history, not news).
          if (
            !firstLoad &&
            addressRef.current &&
            unseen.some((e) => e.who === addressRef.current)
          ) {
            userCbRef.current?.();
          }
        }
        firstLoad = false;
      } catch {
        if (!stop) setLive(false);
      } finally {
        if (!stop) timer = setTimeout(poll, POLL_MS);
      }
    }

    void poll();
    return () => {
      stop = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div className="rounded-xl border border-black/10 p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          On-chain activity
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              live ? "animate-pulse bg-emerald-500" : "bg-zinc-300"
            }`}
          />
          {live ? "live" : "connecting…"}
        </span>
      </div>

      {events.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">
          No contract events yet — top up to see your deposit appear here in
          real time.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-black/5">
          {events.map((e) => {
            const meta = TYPE_META[e.type];
            const mine = address !== null && e.who === address;
            return (
              <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
                <span className={`w-4 text-center font-semibold ${meta.tone}`}>
                  {meta.icon}
                </span>
                <span className={`w-16 ${meta.tone}`}>{meta.label}</span>
                <span
                  className={`font-mono text-xs ${
                    mine ? "font-semibold text-[var(--color-darkblue)]" : "text-zinc-500"
                  }`}
                  title={e.who}
                >
                  {mine ? "you" : short(e.who)}
                </span>
                <span className="ml-auto font-mono text-xs">
                  {fromStroops(e.amount).toFixed(3)} USDC
                </span>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${e.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-400 underline-offset-2 hover:text-zinc-600 hover:underline"
                >
                  {timeAgo(e.at) || "tx"}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
