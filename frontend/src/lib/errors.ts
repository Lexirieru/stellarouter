// Error classification for the UI — every failure gets a stable `kind` so pages
// can show a category chip + a human-friendly message.

import { WalletError, walletErrorMessage } from "@stellarouter/ui";

export type UiErrorKind =
  | "wallet-not-found"
  | "rejected"
  | "insufficient-balance"
  | "network-mismatch"
  | "not-connected"
  | "failed";

export type UiError = { kind: UiErrorKind; message: string };

const KIND_LABEL: Record<UiErrorKind, string> = {
  "wallet-not-found": "Wallet not found",
  rejected: "Rejected in wallet",
  "insufficient-balance": "Insufficient balance",
  "network-mismatch": "Wrong network",
  "not-connected": "Not connected",
  failed: "Transaction failed",
};

export function errorLabel(kind: UiErrorKind): string {
  return KIND_LABEL[kind];
}

// `credits` contract error codes (see smart-contract/contracts/credits/src/lib.rs).
const CONTRACT_ERRORS: Record<string, string> = {
  "#1": "Invalid amount (must be positive).",
  "#2": "Insufficient credit balance in the contract.",
  "#3": "Insufficient treasury.",
  "#4": "Arithmetic overflow.",
};

export function describeError(e: unknown): UiError {
  if (e instanceof WalletError) {
    switch (e.code) {
      case "WALLET_NOT_FOUND":
        return { kind: "wallet-not-found", message: walletErrorMessage(e) };
      case "USER_REJECTED":
        return { kind: "rejected", message: walletErrorMessage(e) };
      case "NETWORK_MISMATCH":
        return { kind: "network-mismatch", message: e.message };
      case "NOT_CONNECTED":
        return { kind: "not-connected", message: walletErrorMessage(e) };
      default:
        return { kind: "failed", message: e.message };
    }
  }
  const message = e instanceof Error ? e.message : String(e);

  // Contract error surfaced by simulation: "... Error(Contract, #2) ..."
  const contractErr = message.match(/Error\(Contract, (#\d+)\)/);
  if (contractErr && CONTRACT_ERRORS[contractErr[1]]) {
    const friendly = CONTRACT_ERRORS[contractErr[1]];
    return {
      kind: contractErr[1] === "#2" ? "insufficient-balance" : "failed",
      message: friendly,
    };
  }

  if (/insufficient|underfunded|not enough/i.test(message)) {
    return { kind: "insufficient-balance", message };
  }
  return { kind: "failed", message };
}
