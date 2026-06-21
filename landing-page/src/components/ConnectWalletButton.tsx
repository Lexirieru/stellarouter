"use client";

import { useWallet } from "./WalletProvider";

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { address, connecting, connect, disconnect } = useWallet();

  if (address) {
    return (
      <button
        onClick={() => void disconnect()}
        title={address}
        className="flex h-10 items-center gap-2 rounded-full border border-black/[.12] px-4 font-mono text-sm transition-colors hover:bg-black/[.04] dark:border-white/[.16] dark:hover:bg-white/[.06]"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        {truncateAddress(address)}
      </button>
    );
  }

  return (
    <button
      onClick={() => void connect()}
      disabled={connecting}
      className="flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
    >
      {connecting ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
