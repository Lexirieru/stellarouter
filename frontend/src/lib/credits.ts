// Client-side Soroban helpers for the `credits` contract. Reads the on-chain
// credit balance and builds deposit/withdraw transactions for the connected
// wallet to sign (via Freighter). The user is the tx source, so the envelope
// signature satisfies the contract's require_auth(user).

import * as S from "@stellar/stellar-sdk";
import { stellarConfig } from "@stellarouter/ui";

const RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL || stellarConfig.rpcUrl;
const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CREDITS_CONTRACT_ID ||
  "CAEFFQAL6SGQF6OV5BOBE23NAC2T7WXOUUE5XRDOH2KRN2HXRMDXA7RE";
const PASSPHRASE = stellarConfig.networkPassphrase;

const server = new S.rpc.Server(RPC_URL);
const contract = new S.Contract(CONTRACT_ID);

export const USDC_DECIMALS = 7;
const SCALE = 10 ** USDC_DECIMALS;

export const toStroops = (usdc: number): bigint => BigInt(Math.round(usdc * SCALE));
export const fromStroops = (stroops: bigint): number => Number(stroops) / SCALE;

const HORIZON_URL =
  process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || stellarConfig.horizonUrl;
const USDC_ISSUER =
  process.env.NEXT_PUBLIC_USDC_ISSUER ||
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

/** Read the USDC balance held in the user's wallet (classic balance). */
export async function readWalletUsdc(address: string): Promise<number> {
  const res = await fetch(`${HORIZON_URL}/accounts/${address}`);
  if (!res.ok) {
    if (res.status === 404) return 0; // account not funded yet
    throw new Error(`horizon ${res.status}`);
  }
  const data = await res.json();
  const bal = (data.balances ?? []).find(
    (b: { asset_code?: string; asset_issuer?: string; balance: string }) =>
      b.asset_code === "USDC" && b.asset_issuer === USDC_ISSUER
  );
  return bal ? Number(bal.balance) : 0;
}

/** Read a user's on-chain credit balance (stroops). */
export async function readCredit(user: string): Promise<bigint> {
  const src = await server.getAccount(user);
  const tx = new S.TransactionBuilder(src, {
    fee: S.BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(contract.call("balance", S.Address.fromString(user).toScVal()))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (S.rpc.Api.isSimulationError(sim)) throw new Error(sim.error);
  return BigInt(S.scValToNative(sim.result!.retval));
}

// Build + prepare (simulate/assemble) an invoke; returns XDR for Freighter to sign.
async function prepareInvoke(
  user: string,
  method: string,
  ...args: S.xdr.ScVal[]
): Promise<string> {
  const src = await server.getAccount(user);
  const tx = new S.TransactionBuilder(src, {
    fee: S.BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(120)
    .build();
  const prepared = await server.prepareTransaction(tx);
  return prepared.toXDR();
}

export function buildDeposit(user: string, stroops: bigint): Promise<string> {
  return prepareInvoke(
    user,
    "deposit",
    S.Address.fromString(user).toScVal(),
    S.nativeToScVal(stroops, { type: "i128" })
  );
}

export function buildWithdraw(user: string, stroops: bigint): Promise<string> {
  return prepareInvoke(
    user,
    "withdraw",
    S.Address.fromString(user).toScVal(),
    S.nativeToScVal(stroops, { type: "i128" })
  );
}

/** Submit a signed XDR and wait for the result; returns the tx hash. */
export async function submit(signedXdr: string): Promise<string> {
  const tx = S.TransactionBuilder.fromXDR(signedXdr, PASSPHRASE);
  const sent = await server.sendTransaction(tx);
  if (sent.status === "ERROR") {
    throw new Error(`submit error: ${JSON.stringify(sent.errorResult)}`);
  }
  let res = await server.getTransaction(sent.hash);
  const t0 = Date.now();
  while (res.status === "NOT_FOUND") {
    if (Date.now() - t0 > 30_000) throw new Error("transaction poll timeout");
    await new Promise((r) => setTimeout(r, 1500));
    res = await server.getTransaction(sent.hash);
  }
  if (res.status !== "SUCCESS") throw new Error(`transaction ${res.status}`);
  return sent.hash;
}
