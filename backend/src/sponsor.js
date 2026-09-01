// Fee sponsorship (gasless transactions via fee-bump, CAP-15).
//
// The user signs their transaction as usual (they are still the source and
// authorize the state change), the gateway wraps it in a FeeBumpTransaction
// and pays the network fee. Only transactions that touch Stellarouter are
// sponsored: deposits/withdrawals on the credits contract, or a USDC
// changeTrust — anything else is rejected so the sponsor account can't be
// farmed for arbitrary fees.

import * as S from "@stellar/stellar-sdk";

const PASSPHRASE = "Test SDF Network ; September 2015"; // overridden below on pubnet
const NETWORK = process.env.STELLAR_NETWORK || "stellar:testnet";
export const NETWORK_PASSPHRASE =
  NETWORK === "stellar:pubnet"
    ? "Public Global Stellar Network ; September 2015"
    : PASSPHRASE;

const CONTRACT_ID =
  process.env.CREDITS_CONTRACT_ID ||
  "CAEFFQAL6SGQF6OV5BOBE23NAC2T7WXOUUE5XRDOH2KRN2HXRMDXA7RE";
const USDC_ISSUER =
  process.env.USDC_ISSUER || "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const RPC_URL = process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const HORIZON_URL = process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";
const SPONSORED_FUNCTIONS = ["deposit", "withdraw"];

/**
 * Validate that a signed inner transaction only does things we are willing to
 * pay for. Returns { ok: true, soroban: boolean } or { ok: false, reason }.
 */
export function validateSponsoredTx(xdr) {
  let tx;
  try {
    tx = S.TransactionBuilder.fromXDR(xdr, NETWORK_PASSPHRASE);
  } catch {
    return { ok: false, reason: "invalid transaction XDR" };
  }
  if (tx instanceof S.FeeBumpTransaction) {
    return { ok: false, reason: "already fee-bumped" };
  }
  if (tx.operations.length === 0 || tx.operations.length > 2) {
    return { ok: false, reason: "unexpected operation count" };
  }
  let soroban = false;
  for (const op of tx.operations) {
    if (op.type === "changeTrust") {
      const a = op.line;
      if (!(a && a.code === "USDC" && a.issuer === USDC_ISSUER)) {
        return { ok: false, reason: "only the USDC trustline is sponsored" };
      }
    } else if (op.type === "invokeHostFunction") {
      const fn = op.func;
      if (fn.switch().name !== "hostFunctionTypeInvokeContract") {
        return { ok: false, reason: "only contract invocations are sponsored" };
      }
      const invocation = fn.invokeContract();
      const target = S.Address.fromScAddress(invocation.contractAddress()).toString();
      if (target !== CONTRACT_ID) {
        return { ok: false, reason: "only the credits contract is sponsored" };
      }
      const method = invocation.functionName().toString();
      if (!SPONSORED_FUNCTIONS.includes(method)) {
        return { ok: false, reason: `function ${method} is not sponsored` };
      }
      soroban = true;
    } else {
      return { ok: false, reason: `operation ${op.type} is not sponsored` };
    }
  }
  return { ok: true, soroban, tx };
}

/** Wrap a validated inner tx in a fee bump paid by the sponsor and submit it. */
export async function sponsorAndSubmit(xdr, sponsorSecret) {
  const check = validateSponsoredTx(xdr);
  if (!check.ok) {
    const err = new Error(check.reason);
    err.status = 400;
    throw err;
  }
  const sponsor = S.Keypair.fromSecret(sponsorSecret);
  const inner = check.tx;
  // Outer per-op fee must exceed the inner bid; for Soroban txs the inner fee
  // already includes the resource fee, so bumping by inner.fee + margin is safe.
  const baseFee = String(Number(inner.fee) + 1_000);
  const bump = S.TransactionBuilder.buildFeeBumpTransaction(
    sponsor,
    baseFee,
    inner,
    NETWORK_PASSPHRASE
  );
  bump.sign(sponsor);

  if (check.soroban) {
    const rpc = new S.rpc.Server(RPC_URL);
    const sent = await rpc.sendTransaction(bump);
    if (sent.status === "ERROR") {
      throw new Error(`sponsor submit error: ${JSON.stringify(sent.errorResult)}`);
    }
    let res = await rpc.getTransaction(sent.hash);
    const t0 = Date.now();
    while (res.status === "NOT_FOUND") {
      if (Date.now() - t0 > 45_000) throw new Error("sponsor poll timeout");
      await new Promise((r) => setTimeout(r, 1500));
      res = await rpc.getTransaction(sent.hash);
    }
    if (res.status !== "SUCCESS") throw new Error(`sponsored transaction ${res.status}`);
    return { hash: sent.hash };
  }
  const horizon = new S.Horizon.Server(HORIZON_URL);
  const res = await horizon.submitTransaction(bump);
  return { hash: res.hash };
}
