"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  isConnected,
  isAllowed,
  getAddress,
  requestAccess,
  getNetwork,
  signTransaction,
} from "@stellar/freighter-api";
import { stellarConfig } from "@/lib/stellar";

type WalletContextValue = {
  address: string | null;
  /** Nama jaringan yang aktif di wallet (mis. "TESTNET", "PUBLIC"). */
  network: string | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  /** Tanda tangani XDR dengan Freighter; mengembalikan signed XDR. */
  signTransaction: (xdr: string) => Promise<string>;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Pulihkan sesi bila Freighter terpasang & app sudah pernah diizinkan
  // (tanpa memunculkan prompt).
  useEffect(() => {
    (async () => {
      const { isConnected: installed } = await isConnected();
      if (!installed) return;

      const { isAllowed: allowed } = await isAllowed();
      if (!allowed) return;

      const { address: addr, error } = await getAddress();
      if (error || !addr) return;
      setAddress(addr);

      const { network: net } = await getNetwork();
      setNetwork(net);
    })();
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const { isConnected: installed } = await isConnected();
      if (!installed) {
        window.open("https://www.freighter.app/", "_blank", "noopener");
        throw new Error("Freighter extension is not installed");
      }

      const { address: addr, error } = await requestAccess();
      if (error) throw new Error(error.message);
      setAddress(addr);

      const { network: net } = await getNetwork();
      setNetwork(net);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    // Freighter tidak punya API "disconnect"; kita cukup lupakan state lokal.
    setAddress(null);
    setNetwork(null);
  }, []);

  const sign = useCallback(
    async (xdr: string) => {
      if (!address) throw new Error("Wallet not connected");
      const { signedTxXdr, error } = await signTransaction(xdr, {
        networkPassphrase: stellarConfig.networkPassphrase,
        address,
      });
      if (error) throw new Error(error.message);
      return signedTxXdr;
    },
    [address]
  );

  return (
    <WalletContext.Provider
      value={{
        address,
        network,
        connecting,
        connect,
        disconnect,
        signTransaction: sign,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within a <WalletProvider>");
  }
  return ctx;
}
