"use client";

import { useWallet } from "./WalletProvider";
import { walletErrorMessage } from "./walletKit";

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { address, connecting, connect, disconnect, connectError, walletId } =
    useWallet();

  if (address) {
    return (
      <button
        onClick={() => void disconnect()}
        title={walletId ? `${address} (via ${walletId})` : address}
        className="flex h-10 items-center gap-2 rounded-full border border-black/[.12] px-4 font-mono text-sm transition-colors hover:bg-black/[.04] dark:border-white/[.16] dark:hover:bg-white/[.06]"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        {truncateAddress(address)}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={() => connect().catch(() => {})}
        disabled={connecting}
        className="flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {connecting ? "Connecting…" : "Connect Wallet"}
      </button>
      {connectError && connectError.code !== "USER_REJECTED" && (
        <p className="max-w-52 text-xs leading-snug text-red-600 dark:text-red-400">
          {walletErrorMessage(connectError)}
        </p>
      )}
    </div>
  );
}
