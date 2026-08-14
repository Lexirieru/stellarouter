import { describe, expect, test } from "bun:test";
import * as S from "@stellar/stellar-sdk";
import { parseEvent } from "./events";

const USER = "GCD6JXWCZ5ICS2XSSOZ7NIY2CIM5WHVDEUKHNAF3HXKBHR5ZQ5BIAJDY";

function makeEvent(sym: string, who: string, amount: bigint) {
  return {
    id: "0004138735-0000000001",
    ledger: 4_138_735,
    ledgerClosedAt: "2026-08-14T13:48:45Z",
    txHash: "451bb3fb3c6fdf4d9da72dc06b713052bd77dbf0b1d9668c591bc8435131c0a7",
    topic: [
      S.nativeToScVal(sym, { type: "symbol" }),
      S.Address.fromString(who).toScVal(),
    ],
    value: S.nativeToScVal(amount, { type: "i128" }),
  };
}

describe("parseEvent (credits contract events)", () => {
  test("parses deposit/debit/withdraw/collect topics + i128 amount", () => {
    for (const sym of ["deposit", "debit", "withdraw", "collect"] as const) {
      const ev = parseEvent(makeEvent(sym, USER, 30_000_000n));
      expect(ev).not.toBeNull();
      expect(ev!.type).toBe(sym);
      expect(ev!.who).toBe(USER);
      expect(ev!.amount).toBe(30_000_000n);
      expect(ev!.ledger).toBe(4_138_735);
      expect(ev!.txHash).toMatch(/^451bb3fb/);
      expect(ev!.at).toBe("2026-08-14T13:48:45Z");
    }
  });

  test("ignores foreign events (unknown symbol)", () => {
    expect(parseEvent(makeEvent("transfer", USER, 1n))).toBeNull();
  });

  test("ignores malformed topics without crashing", () => {
    expect(
      parseEvent({
        id: "x",
        ledger: 1,
        txHash: "ab",
        topic: [S.nativeToScVal("deposit", { type: "symbol" })], // < 2 topik
        value: S.nativeToScVal(1n, { type: "i128" }),
      })
    ).toBeNull();
  });
});
