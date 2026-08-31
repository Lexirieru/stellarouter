// On-chain analytics for the credits contract, computed client-side from RPC
// getEvents — robust even when the gateway runs serverless (its SQLite metrics
// reset per instance; the chain never does).

import { fromStroops, rpcServer, CREDITS_CONTRACT_ID } from "./credits";
import { parseEvent, type CreditEvent } from "./events";

export type ChainStats = {
  uniqueUsers: number;
  totals: { deposit: number; debit: number; withdraw: number; collect: number };
  eventCount: number;
  /** Daily USDC volume (all event types), oldest → newest. */
  daily: { date: string; volume: number }[];
};

const WINDOW_LEDGERS = 120_000; // ≈ 7 days at ~5s
const FALLBACK_LEDGERS = 17_280; // ≈ 1 day
const MAX_PAGES = 40;

async function collectEvents(startLedger: number): Promise<CreditEvent[]> {
  const out: CreditEvent[] = [];
  let cursor: string | undefined;
  // The RPC paginates by the LEDGER RANGE it scanned, not by matches — a page
  // over a quiet slice returns 0 events plus a cursor. Keep following the
  // cursor until the RPC stops handing one out (or we hit the page cap).
  for (let page = 0; page < MAX_PAGES; page++) {
    const filters = [{ type: "contract" as const, contractIds: [CREDITS_CONTRACT_ID] }];
    const resp = await rpcServer.getEvents(
      cursor ? { cursor, filters, limit: 100 } : { startLedger, filters, limit: 100 }
    );
    const events = (resp.events ?? [])
      .map((ev) => parseEvent(ev as unknown as Parameters<typeof parseEvent>[0]))
      .filter((e): e is CreditEvent => e !== null);
    out.push(...events);
    if (!resp.cursor) break;
    cursor = resp.cursor;
  }
  return out;
}

export async function fetchChainStats(): Promise<ChainStats> {
  const latest = await rpcServer.getLatestLedger();
  let events: CreditEvent[];
  try {
    events = await collectEvents(Math.max(latest.sequence - WINDOW_LEDGERS, 1));
  } catch {
    // RPC retention window exceeded — retry with a shorter backfill.
    events = await collectEvents(Math.max(latest.sequence - FALLBACK_LEDGERS, 1));
  }

  const users = new Set<string>();
  const totals = { deposit: 0, debit: 0, withdraw: 0, collect: 0 };
  const buckets = new Map<string, number>();
  for (const e of events) {
    if (e.type !== "collect") users.add(e.who);
    totals[e.type] += fromStroops(e.amount);
    if (e.at) {
      const day = e.at.slice(0, 10);
      buckets.set(day, (buckets.get(day) ?? 0) + fromStroops(e.amount));
    }
  }

  // Continuous last-7-day range so quiet days render as zero-height bars.
  const daily: { date: string; volume: number }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    daily.push({ date: d, volume: Number((buckets.get(d) ?? 0).toFixed(3)) });
  }

  return { uniqueUsers: users.size, totals, eventCount: events.length, daily };
}
