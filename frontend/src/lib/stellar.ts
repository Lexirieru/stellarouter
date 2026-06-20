// Konfigurasi jaringan Stellar untuk client.
// Dibuat tanpa import @stellar/stellar-sdk agar bundle client tetap ringan —
// passphrase adalah konstanta stabil. Import SDK dilakukan di tempat yang
// benar-benar membangun/men-submit transaksi.

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
    // Set lewat env: gunakan RPC provider pilihanmu untuk mainnet.
    rpcUrl: process.env.NEXT_PUBLIC_STELLAR_MAINNET_RPC_URL ?? "",
    friendbotUrl: null,
  },
} as const;

export const stellarConfig = NETWORK_CONFIG[STELLAR_NETWORK];
