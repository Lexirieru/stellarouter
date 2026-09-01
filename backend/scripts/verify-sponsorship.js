// E2E proof of fee sponsorship: a user signs a withdraw, the gateway fee-bumps
// it, and we verify on-chain that the SPONSOR paid the fee, not the user.
import "dotenv/config";
import { readFileSync } from "node:fs";
import * as S from "@stellar/stellar-sdk";

const GATEWAY = process.env.GATEWAY_URL || "http://localhost:3001";
const RPC = new S.rpc.Server("https://soroban-testnet.stellar.org");
const HORIZON = "https://horizon-testnet.stellar.org";
const CONTRACT = new S.Contract(process.env.CREDITS_CONTRACT_ID);
const PASSPHRASE = "Test SDF Network ; September 2015";
const SPONSOR = S.Keypair.fromSecret(process.env.GATEWAY_ADMIN_SECRET).publicKey();

const xlm = async (g) => {
  const r = await fetch(`${HORIZON}/accounts/${g}`);
  const j = await r.json();
  return Number(j.balances.find((b) => b.asset_type === "native").balance);
};

const wallets = JSON.parse(readFileSync("scripts/.sim-wallets.json", "utf8"));

// Find a wallet that still has credit to withdraw.
let user = null;
for (const w of wallets.slice(-15)) {
  const acc = await RPC.getAccount(w.public);
  const tx = new S.TransactionBuilder(acc, { fee: S.BASE_FEE, networkPassphrase: PASSPHRASE })
    .addOperation(CONTRACT.call("balance", S.Address.fromString(w.public).toScVal()))
    .setTimeout(30).build();
  const sim = await RPC.simulateTransaction(tx);
  if (S.rpc.Api.isSimulationError(sim)) continue;
  const bal = BigInt(S.scValToNative(sim.result.retval));
  if (bal > 2_000_000n) { user = { ...w, credit: bal }; break; }
}
if (!user) { console.error("no sim wallet with credit found"); process.exit(1); }

const amount = 1_000_000n; // 0.1 USDC
console.log(`user    : ${user.public}  (credit ${Number(user.credit) / 1e7} USDC)`);
console.log(`sponsor : ${SPONSOR}`);

const beforeUser = await xlm(user.public);
const beforeSponsor = await xlm(SPONSOR);
console.log(`XLM before → user ${beforeUser.toFixed(7)} | sponsor ${beforeSponsor.toFixed(7)}`);

// User builds + signs the withdraw (they never submit it).
const src = await RPC.getAccount(user.public);
const inner = new S.TransactionBuilder(src, { fee: S.BASE_FEE, networkPassphrase: PASSPHRASE })
  .addOperation(CONTRACT.call("withdraw", S.Address.fromString(user.public).toScVal(),
    S.nativeToScVal(amount, { type: "i128" })))
  .setTimeout(120).build();
const prepared = await RPC.prepareTransaction(inner);
prepared.sign(S.Keypair.fromSecret(user.secret));

// Gateway sponsors + submits.
const res = await fetch(`${GATEWAY}/sponsor`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ xdr: prepared.toXDR() }),
});
const out = await res.json();
console.log("gateway →", JSON.stringify(out));
if (!out.ok) process.exit(1);

await new Promise((r) => setTimeout(r, 6000));
const txr = await (await fetch(`${HORIZON}/transactions/${out.hash}`)).json();
const afterUser = await xlm(user.public);
const afterSponsor = await xlm(SPONSOR);

console.log(`XLM after  → user ${afterUser.toFixed(7)} | sponsor ${afterSponsor.toFixed(7)}`);
console.log(`tx         : ${out.hash}  (successful=${txr.successful})`);
console.log(`fee_account: ${txr.fee_account}  ${txr.fee_account === SPONSOR ? "= SPONSOR ✓" : "✗"}`);
console.log(`source     : ${txr.source_account}  ${txr.source_account === user.public ? "= USER ✓" : "✗"}`);
console.log(`fee charged: ${Number(txr.fee_charged) / 1e7} XLM`);
console.log(`user XLM delta   : ${(afterUser - beforeUser).toFixed(7)}  ${afterUser === beforeUser ? "← UNCHANGED ✓ (gasless)" : ""}`);
console.log(`sponsor XLM delta: ${(afterSponsor - beforeSponsor).toFixed(7)}  ← sponsor paid`);
