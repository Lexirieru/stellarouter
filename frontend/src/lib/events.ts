// Real-time `credits` contract events via RPC getEvents.
// The contract emits: (Symbol("deposit"|"debit"|"withdraw"|"collect"), Address)
// with value = amount (i128). We poll the RPC and parse into a UI-ready shape.

import * as S from "@stellar/stellar-sdk";
import { CREDITS_CONTRACT_ID, rpcServer } from "./credits";

export type CreditEventType = "deposit" | "debit" | "withdraw" | "collect";

export type CreditEvent = {
  id: string;
  type: CreditEventType;
  /** User address (deposit/debit/withdraw) or recipient (collect). */
  who: string;
  /** Jumlah dalam stroops USDC (i128). */
  amount: bigint;
  ledger: number;
  txHash: string;
  at: string | null; // ISO time (ledgerClosedAt)
};

const EVENT_TYPES = new Set(["deposit", "debit", "withdraw", "collect"]);

// Initial backfill (~1 hour of ledgers @5s) — enough to populate the feed at first load.
const INITIAL_BACKFILL_LEDGERS = 720;

export function parseEvent(ev: {
  id: string;
  ledger: number;
  ledgerClosedAt?: string;
  txHash: string;
  topic: S.xdr.ScVal[];
  value: S.xdr.ScVal;
}): CreditEvent | null {
  try {
    if (!ev.topic || ev.topic.length < 2) return null;
    const sym = S.scValToNative(ev.topic[0]);
    if (typeof sym !== "string" || !EVENT_TYPES.has(sym)) return null;
    const who = S.scValToNative(ev.topic[1]);
    const amount = S.scValToNative(ev.value);
    if (typeof who !== "string" || typeof amount !== "bigint") return null;
    return {
      id: ev.id,
      type: sym as CreditEventType,
      who,
      amount,
      ledger: ev.ledger,
      txHash: ev.txHash,
      at: ev.ledgerClosedAt ?? null,
    };
  } catch {
    return null; // foreign event / unexpected shape — skip it
  }
}

/**
 * Fetch contract events since `sinceLedger` (or the initial backfill when absent).
 * Returns parsed events + the latest ledger for the next poll.
 */
export async function fetchCreditEvents(sinceLedger?: number): Promise<{
  events: CreditEvent[];
  nextLedger: number;
}> {
  const latest = await rpcServer.getLatestLedger();
  let start =
    sinceLedger ?? Math.max(latest.sequence - INITIAL_BACKFILL_LEDGERS, 1);
  if (start > latest.sequence) start = latest.sequence;

  const resp = await rpcServer.getEvents({
    startLedger: start,
    filters: [{ type: "contract", contractIds: [CREDITS_CONTRACT_ID] }],
    limit: 100,
  });

  const events = (resp.events ?? [])
    .map((ev) => parseEvent(ev as unknown as Parameters<typeof parseEvent>[0]))
    .filter((e): e is CreditEvent => e !== null);

  // Overlap one ledger between polls so no event is missed; dedupe by id.
  return { events, nextLedger: Math.max(resp.latestLedger, start) };
}
