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
  /** Network name active in the wallet (e.g. "TESTNET", "PUBLIC"). */
  network: string | null;
  /** Id of the wallet the user picked in the modal (e.g. "freighter", "xbull"). */
  walletId: string | null;
  connecting: boolean;
  /** Last connection error (normalized) — null on success. */
  connectError: WalletError | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  /** Sign an XDR with the selected wallet; returns the signed XDR. */
  signTransaction: (xdr: string) => Promise<string>;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<WalletError | null>(null);

  // Restore the session: the kit persists the last wallet + address in
  // localStorage, so getAddress() after init returns the previous session without a prompt.
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
        // No stored session / wallet unavailable — stay disconnected.
      }
    })();
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      const kit = await getKit();
      // authModal() opens the multi-wallet picker (Freighter, xBull, Albedo,
      // Lobstr, Hana, …), sets the active module, and returns the address.
      const { address: addr } = await kit.authModal();
      const net = await assertNetwork(kit); // NETWORK_MISMATCH if the networks differ
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
      // The kit never initialized — just reset local state.
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
