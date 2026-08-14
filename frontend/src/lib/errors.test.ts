import { describe, expect, test } from "bun:test";
import { WalletError, toWalletError } from "@stellarouter/ui";
import { describeError, errorLabel } from "./errors";

describe("describeError", () => {
  test("maps WalletError codes to stable UI kinds", () => {
    expect(describeError(new WalletError("WALLET_NOT_FOUND", "x")).kind).toBe(
      "wallet-not-found"
    );
    expect(describeError(new WalletError("USER_REJECTED", "x")).kind).toBe(
      "rejected"
    );
    expect(describeError(new WalletError("NETWORK_MISMATCH", "x")).kind).toBe(
      "network-mismatch"
    );
    expect(describeError(new WalletError("NOT_CONNECTED", "x")).kind).toBe(
      "not-connected"
    );
  });

  test("classifies contract error #2 as insufficient balance with friendly copy", () => {
    const e = describeError(
      new Error("HostError: Error(Contract, #2) — simulation failed")
    );
    expect(e.kind).toBe("insufficient-balance");
    expect(e.message).toContain("Insufficient credit");
  });

  test("classifies other contract errors as failed with friendly copy", () => {
    const e = describeError(new Error("blah Error(Contract, #1) blah"));
    expect(e.kind).toBe("failed");
    expect(e.message).toContain("Invalid amount");
  });

  test("detects insufficient-balance wording from Horizon/RPC errors", () => {
    expect(describeError(new Error("op_underfunded")).kind).toBe(
      "insufficient-balance"
    );
    expect(describeError(new Error("Not enough USDC in your wallet.")).kind).toBe(
      "insufficient-balance"
    );
  });

  test("falls back to failed for unknown errors", () => {
    const e = describeError("boom");
    expect(e.kind).toBe("failed");
    expect(e.message).toBe("boom");
  });

  test("every kind has a human label", () => {
    for (const kind of [
      "wallet-not-found",
      "rejected",
      "insufficient-balance",
      "network-mismatch",
      "not-connected",
      "failed",
    ] as const) {
      expect(errorLabel(kind).length).toBeGreaterThan(0);
    }
  });
});

describe("toWalletError (kit error normalization)", () => {
  test("user closing the wallet modal → USER_REJECTED", () => {
    expect(toWalletError({ code: -1, message: "The user closed the modal." }).code).toBe(
      "USER_REJECTED"
    );
  });

  test("missing extension → WALLET_NOT_FOUND", () => {
    expect(toWalletError(new Error("Freighter is not installed")).code).toBe(
      "WALLET_NOT_FOUND"
    );
  });

  test("unknown errors keep their message", () => {
    const err = toWalletError(new Error("weird failure"));
    expect(err.code).toBe("UNKNOWN");
    expect(err.message).toBe("weird failure");
  });
});
