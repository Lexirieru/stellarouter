// Lapisan tipis di atas StellarWalletsKit (v2, static singleton).
// Kit di-load lazy (dynamic import) supaya modul ini aman di-import saat SSR —
// kit menyentuh window/localStorage pada load.

import { STELLAR_NETWORK, stellarConfig } from "./stellar";

/** Error wallet yang sudah dinormalisasi — UI cukup switch di `code`. */
export type WalletErrorCode =
  | "WALLET_NOT_FOUND" // wallet tidak terpasang / tidak tersedia di browser
  | "USER_REJECTED" // user menutup modal / menolak connect / menolak tanda tangan
  | "NETWORK_MISMATCH" // wallet ada di jaringan berbeda dari app (mis. PUBLIC vs TESTNET)
  | "NOT_CONNECTED" // aksi butuh wallet tapi belum connect
  | "UNKNOWN";

export class WalletError extends Error {
  code: WalletErrorCode;
  constructor(code: WalletErrorCode, message: string) {
    super(message);
    this.name = "WalletError";
    this.code = code;
  }
}

/** Normalisasi error apa pun dari kit/wallet menjadi WalletError. */
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

/** Copy siap-tampil per error code (dipakai halaman mana pun). */
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

/** Init sekali (client-only) lalu kembalikan kelas statis kit. */
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
 * Pastikan wallet berada di jaringan yang sama dengan app.
 * Lempar NETWORK_MISMATCH bila berbeda; diam bila wallet tak melaporkan network.
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
    return null; // wallet tidak expose getNetwork — jangan blokir
  }
}
