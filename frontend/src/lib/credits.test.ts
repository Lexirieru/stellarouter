import { describe, expect, test } from "bun:test";
import { toStroops, fromStroops, USDC_DECIMALS } from "./credits";

describe("USDC stroop conversion (7 decimals)", () => {
  test("USDC uses 7 decimals", () => {
    expect(USDC_DECIMALS).toBe(7);
  });

  test("toStroops converts whole and fractional USDC", () => {
    expect(toStroops(1)).toBe(10_000_000n);
    expect(toStroops(0.005)).toBe(50_000n); // harga x402 per call
    expect(toStroops(3)).toBe(30_000_000n);
  });

  test("fromStroops is the inverse", () => {
    expect(fromStroops(10_000_000n)).toBe(1);
    expect(fromStroops(24_740_000n)).toBeCloseTo(2.474, 7);
  });

  test("roundtrip stays exact for typical amounts", () => {
    for (const v of [0.001, 0.05, 1, 2.474, 100]) {
      expect(fromStroops(toStroops(v))).toBeCloseTo(v, 7);
    }
  });
});
