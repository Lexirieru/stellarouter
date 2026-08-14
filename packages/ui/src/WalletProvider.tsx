"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { stellarConfig } from "./stellar";
import {
  assertNetwork,
  getKit,
  toWalletError,
  WalletError,
} from "./walletKit";

type WalletContextValue = {
  address: string | null;
  /** Nama jaringan yang aktif di wallet (mis. "TESTNET", "PUBLIC"). */
  network: string | null;
  /** Id wallet yang dipilih user di modal (mis. "freighter", "xbull"). */
  walletId: string | null;
  connecting: boolean;
  /** Error koneksi terakhir (sudah dinormalisasi) — null saat sukses. */
  connectError: WalletError | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  /** Tanda tangani XDR dengan wallet terpilih; mengembalikan signed XDR. */
  signTransaction: (xdr: string) => Promise<string>;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<WalletError | null>(null);

  // Pulihkan sesi: kit menyimpan wallet + address terakhir di localStorage,
  // jadi getAddress() setelah init mengembalikan sesi sebelumnya tanpa prompt.
  useEffect(() => {
    (async () => {
      try {
        const kit = await getKit();
        const { address: addr } = await kit.getAddress();
        if (!addr) return;
        setAddress(addr);
        setWalletId(kit.selectedModule?.productId ?? null);
        setNetwork(await assertNetwork(kit).catch(() => null));
      } catch {
        // Tidak ada sesi tersimpan / wallet tak tersedia — tetap disconnected.
      }
    })();
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      const kit = await getKit();
      // authModal() membuka picker multi-wallet (Freighter, xBull, Albedo,
      // Lobstr, Hana, …), set module aktif, lalu mengembalikan address.
      const { address: addr } = await kit.authModal();
      const net = await assertNetwork(kit); // NETWORK_MISMATCH bila beda jaringan
      setAddress(addr);
      setWalletId(kit.selectedModule?.productId ?? null);
      setNetwork(net);
    } catch (e) {
      const err = toWalletError(e);
      setConnectError(err);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const kit = await getKit();
      await kit.disconnect();
    } catch {
      // Kit belum sempat init — cukup reset state lokal.
    }
    setAddress(null);
    setNetwork(null);
    setWalletId(null);
    setConnectError(null);
  }, []);

  const sign = useCallback(
    async (xdr: string) => {
      if (!address) throw new WalletError("NOT_CONNECTED", "Wallet not connected");
      try {
        const kit = await getKit();
        const { signedTxXdr } = await kit.signTransaction(xdr, {
          networkPassphrase: stellarConfig.networkPassphrase,
          address,
        });
        return signedTxXdr;
      } catch (e) {
        throw toWalletError(e);
      }
    },
    [address]
  );

  return (
    <WalletContext.Provider
      value={{
        address,
        network,
        walletId,
        connecting,
        connectError,
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
