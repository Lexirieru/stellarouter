// Explorer links that follow the configured network, so mainnet deployments
// don't silently point people at testnet pages.
import { STELLAR_NETWORK } from "@stellarouter/ui";

const SEGMENT = STELLAR_NETWORK === "mainnet" ? "public" : "testnet";
const BASE = `https://stellar.expert/explorer/${SEGMENT}`;

export const IS_MAINNET = STELLAR_NETWORK === "mainnet";
export const explorerTx = (hash: string) => `${BASE}/tx/${hash}`;
export const explorerContract = (id: string) => `${BASE}/contract/${id}`;
