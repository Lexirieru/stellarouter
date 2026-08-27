// Stellar network configuration for the client.
// Written without importing @stellar/stellar-sdk to keep the client bundle
// light — passphrases are stable constants. The SDK is imported only where
// transactions are actually built/submitted.

export type StellarNetwork = "testnet" | "mainnet";

export const STELLAR_NETWORK: StellarNetwork =
  (process.env.NEXT_PUBLIC_STELLAR_NETWORK as StellarNetwork) ?? "testnet";

const NETWORK_CONFIG = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    horizonUrl: "https://horizon-testnet.stellar.org",
    rpcUrl: "https://soroban-testnet.stellar.org",
    friendbotUrl: "https://friendbot.stellar.org",
  },
  mainnet: {
    networkPassphrase: "Public Global Stellar Network ; September 2015",
    horizonUrl: "https://horizon.stellar.org",
    // Set via env: use the RPC provider of your choice for mainnet.
    rpcUrl: process.env.NEXT_PUBLIC_STELLAR_MAINNET_RPC_URL ?? "",
    friendbotUrl: null,
  },
} as const;

export const stellarConfig = NETWORK_CONFIG[STELLAR_NETWORK];
