// Event kontrak `credits` secara real-time via RPC getEvents.
// Kontrak memancarkan: (Symbol("deposit"|"debit"|"withdraw"|"collect"), Address)
// dengan value = amount (i128). Kita poll RPC dan parse jadi bentuk siap-UI.

import * as S from "@stellar/stellar-sdk";
import { CREDITS_CONTRACT_ID, rpcServer } from "./credits";

export type CreditEventType = "deposit" | "debit" | "withdraw" | "collect";

export type CreditEvent = {
  id: string;
  type: CreditEventType;
  /** Alamat user (deposit/debit/withdraw) atau penerima (collect). */
  who: string;
  /** Jumlah dalam stroops USDC (i128). */
  amount: bigint;
  ledger: number;
  txHash: string;
  at: string | null; // ISO time (ledgerClosedAt)
};

const EVENT_TYPES = new Set(["deposit", "debit", "withdraw", "collect"]);

// Backfill awal (~1 jam ledger @5s) — cukup untuk mengisi feed pertama kali.
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
    return null; // event asing / bentuk tak terduga — lewati saja
  }
}

/**
 * Ambil event kontrak sejak `sinceLedger` (atau backfill awal bila kosong).
 * Mengembalikan event terparse + ledger terakhir untuk poll berikutnya.
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

  // Overlap 1 ledger antar-poll supaya tidak ada event terlewat; dedupe by id.
  return { events, nextLedger: Math.max(resp.latestLedger, start) };
}
