// Soroban client for the `credits` contract (human prepaid door).
// Reads on-chain credit balance and debits per call with the gateway admin key.

import * as S from "@stellar/stellar-sdk";

const RPC_URL = process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const CONTRACT_ID = process.env.CREDITS_CONTRACT_ID;
const ADMIN_SECRET = process.env.GATEWAY_ADMIN_SECRET;
const PASSPHRASE = (process.env.STELLAR_NETWORK || "stellar:testnet").includes("pubnet")
  ? S.Networks.PUBLIC
  : S.Networks.TESTNET;

// Prepaid door is only active when the contract + admin key are configured.
export const prepaidEnabled = Boolean(CONTRACT_ID && ADMIN_SECRET);

let _server, _contract, _admin;
function ctx() {
  if (!prepaidEnabled) {
    throw new Error(
      "Prepaid door disabled: set CREDITS_CONTRACT_ID + GATEWAY_ADMIN_SECRET"
    );
  }
  if (!_server) {
    _server = new S.rpc.Server(RPC_URL);
    _contract = new S.Contract(CONTRACT_ID);
    _admin = S.Keypair.fromSecret(ADMIN_SECRET);
  }
  return { server: _server, contract: _contract, admin: _admin };
}

/** Read a user's on-chain credit balance (stroops, 7-decimal USDC). */
export async function readBalance(user) {
  const { server, contract, admin } = ctx();
  const src = await server.getAccount(admin.publicKey());
  const tx = new S.TransactionBuilder(src, {
    fee: S.BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(contract.call("balance", S.Address.fromString(user).toScVal()))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (S.rpc.Api.isSimulationError(sim)) {
    throw new Error(`balance simulation failed: ${sim.error}`);
  }
  return BigInt(S.scValToNative(sim.result.retval));
}

/** Charge a user's credit on-chain (admin-authorized). Returns the tx hash. */
export async function debit(user, amountStroops) {
  const { server, contract, admin } = ctx();
  const src = await server.getAccount(admin.publicKey());
  const tx = new S.TransactionBuilder(src, {
    fee: S.BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "debit",
        S.Address.fromString(user).toScVal(),
        S.nativeToScVal(BigInt(amountStroops), { type: "i128" })
      )
    )
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  prepared.sign(admin); // admin == tx source → satisfies require_auth(admin)

  const sent = await server.sendTransaction(prepared);
  if (sent.status === "ERROR") {
    throw new Error(`debit submit error: ${JSON.stringify(sent.errorResult)}`);
  }

  let res = await server.getTransaction(sent.hash);
  const t0 = Date.now();
  while (res.status === "NOT_FOUND") {
    if (Date.now() - t0 > 30_000) throw new Error("debit poll timeout");
    await new Promise((r) => setTimeout(r, 1000));
    res = await server.getTransaction(sent.hash);
  }
  if (res.status !== "SUCCESS") throw new Error(`debit not successful: ${res.status}`);
  return sent.hash;
}
