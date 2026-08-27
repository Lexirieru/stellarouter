// Thin layer over StellarWalletsKit (v2, static singleton).
// The kit is loaded lazily (dynamic import) so this module is safe to import
// during SSR — the kit touches window/localStorage on load.

import { STELLAR_NETWORK, stellarConfig } from "./stellar";

/** Normalized wallet error — the UI only needs to switch on `code`. */
export type WalletErrorCode =
  | "WALLET_NOT_FOUND" // wallet not installed / not available in this browser
  | "USER_REJECTED" // user closed the modal / declined to connect / declined to sign
  | "NETWORK_MISMATCH" // wallet is on a different network than the app (e.g. PUBLIC vs TESTNET)
  | "NOT_CONNECTED" // the action needs a wallet but none is connected
  | "UNKNOWN";

export class WalletError extends Error {
  code: WalletErrorCode;
  constructor(code: WalletErrorCode, message: string) {
    super(message);
    this.name = "WalletError";
    this.code = code;
  }
}

/** Normalize any kit/wallet error into a WalletError. */
export function toWalletError(e: unknown): WalletError {
  if (e instanceof WalletError) return e;
  const raw =
    (e as { message?: string })?.message ??
    (typeof e === "string" ? e : "Unhandled wallet error");
  const msg = raw.toLowerCase();
  if (
    msg.includes("closed the modal") ||
    msg.includes("reject") ||
    msg.includes("denied") ||
    msg.includes("declined") ||
    msg.includes("cancel") ||
    msg.includes("not allowed")
  ) {
    return new WalletError("USER_REJECTED", raw);
  }
  if (
    msg.includes("not installed") ||
    msg.includes("not available") ||
    msg.includes("unavailable") ||
    msg.includes("not detected")
  ) {
    return new WalletError("WALLET_NOT_FOUND", raw);
  }
  return new WalletError("UNKNOWN", raw);
}

/** Display-ready copy per error code (used by any page). */
export function walletErrorMessage(err: WalletError): string {
  switch (err.code) {
    case "WALLET_NOT_FOUND":
      return "Wallet not found — install a Stellar wallet (e.g. Freighter or xBull) and reload.";
    case "USER_REJECTED":
      return "Request rejected in the wallet.";
    case "NETWORK_MISMATCH":
      return err.message;
    case "NOT_CONNECTED":
      return "Connect a wallet first.";
    default:
      return err.message;
  }
}

type Kit = typeof import("@creit.tech/stellar-wallets-kit").StellarWalletsKit;

let kitPromise: Promise<Kit> | null = null;

/** Initialize once (client-only) and return the kit's static class. */
export function getKit(): Promise<Kit> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new WalletError("UNKNOWN", "Wallet kit is only available in the browser")
    );
  }
  if (!kitPromise) {
    kitPromise = (async () => {
      const [{ StellarWalletsKit, Networks }, { defaultModules }] =
        await Promise.all([
          import("@creit.tech/stellar-wallets-kit"),
          import("@creit.tech/stellar-wallets-kit/modules/utils"),
        ]);
      StellarWalletsKit.init({
        modules: defaultModules(),
        network:
          STELLAR_NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET,
      });
      return StellarWalletsKit;
    })();
  }
  return kitPromise;
}

/**
 * Make sure the wallet is on the same network as the app.
 * Throws NETWORK_MISMATCH when they differ; stays quiet if the wallet doesn't report a network.
 */
export async function assertNetwork(kit: Kit): Promise<string | null> {
  try {
    const { network, networkPassphrase } = await kit.getNetwork();
    if (
      networkPassphrase &&
      networkPassphrase !== stellarConfig.networkPassphrase
    ) {
      throw new WalletError(
        "NETWORK_MISMATCH",
        `Wallet is on ${network || "another network"} — switch it to ${
          STELLAR_NETWORK === "mainnet" ? "PUBLIC" : "TESTNET"
        } and reconnect.`
      );
    }
    return network ?? null;
  } catch (e) {
    if (e instanceof WalletError && e.code === "NETWORK_MISMATCH") throw e;
    return null; // the wallet doesn't expose getNetwork — don't block
  }
}
