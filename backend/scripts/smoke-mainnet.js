// End-to-end smoke test against the LIVE mainnet deployment.
// Exercises both doors plus fee sponsorship, and verifies every step on-chain.
import "dotenv/config";
import * as S from "@stellar/stellar-sdk";
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";

const GW = process.env.SMOKE_GATEWAY || "https://stellarouter-gateway.vercel.app";
const PASS = S.Networks.PUBLIC;
const RPC = new S.rpc.Server("https://mainnet.sorobanrpc.com");
const HZ = "https://horizon.stellar.org";
const CID = "CBTDB7A3MZNBH7GRCFUZTQM3QESUHPLAVFJQ43Z2LQAEVAH5Z3AG3NDG";
const SPONSOR = "GAS7CB2ULPWUAY5ARWO7OKDY6TWFQRO2UZUVHIJZJNOJSM6EVBTOTHGQ";
const contract = new S.Contract(CID);
const kp = S.Keypair.fromSecret(process.env.MAINNET_ADMIN_SECRET);
const USER = kp.publicKey();
const X = (h) => `https://stellar.expert/explorer/public/tx/${h}`;
const step = (n, t) => console.log(`\n── ${n} · ${t}`);

const bal = async (g) => {
  const j = await (await fetch(`${HZ}/accounts/${g}`)).json();
  const n = Number(j.balances.find((b) => b.asset_type === "native").balance);
  const u = j.balances.find((b) => b.asset_code === "USDC");
  return { xlm: n, usdc: u ? Number(u.balance) : 0 };
};
const credit = async () => {
  const tx = new S.TransactionBuilder(await RPC.getAccount(USER), { fee: S.BASE_FEE, networkPassphrase: PASS })
    .addOperation(contract.call("balance", S.Address.fromString(USER).toScVal())).setTimeout(30).build();
  const sim = await RPC.simulateTransaction(tx);
  if (S.rpc.Api.isSimulationError(sim)) throw new Error(sim.error);
  return Number(S.scValToNative(sim.result.retval)) / 1e7;
};
const sponsored = async (label, method, stroops) => {
  const src = await RPC.getAccount(USER);
  const tx = new S.TransactionBuilder(src, { fee: S.BASE_FEE, networkPassphrase: PASS })
    .addOperation(contract.call(method, S.Address.fromString(USER).toScVal(), S.nativeToScVal(stroops, { type: "i128" })))
    .setTimeout(120).build();
  const prepared = await RPC.prepareTransaction(tx);
  prepared.sign(kp);
  const r = await fetch(`${GW}/sponsor`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ xdr: prepared.toXDR() }) });
  const out = await r.json();
  if (!out.ok) throw new Error(`${label} failed: ${JSON.stringify(out)}`);
  return out.hash;
};

const before = await bal(USER);
const sponsorBefore = await bal(SPONSOR);
console.log(`user    ${USER}`);
console.log(`start → ${before.usdc.toFixed(4)} USDC · ${before.xlm.toFixed(4)} XLM`);

// 1 ─ gasless deposit
step(1, "Gasless deposit 0.05 USDC (user signs, gateway pays the fee)");
const depHash = await sponsored("deposit", "deposit", 500_000n);
await new Promise((r) => setTimeout(r, 6000));
const depTx = await (await fetch(`${HZ}/transactions/${depHash}`)).json();
const afterDep = await bal(USER);
console.log(`   tx ${X(depHash)}`);
console.log(`   fee_account ${depTx.fee_account === SPONSOR ? "= SPONSOR ✓" : "✗ " + depTx.fee_account} · source ${depTx.source_account === USER ? "= USER ✓" : "✗"}`);
console.log(`   user XLM delta ${(afterDep.xlm - before.xlm).toFixed(7)} ${afterDep.xlm === before.xlm ? "← gasless ✓" : ""}`);
console.log(`   USDC ${before.usdc.toFixed(4)} → ${afterDep.usdc.toFixed(4)} · on-chain credit ${(await credit()).toFixed(4)}`);

// 2 ─ wallet-proof API key
step(2, "API key via wallet-signature challenge");
const ch = await (await fetch(`${GW}/keys/challenge?address=${USER}`)).json();
if (!ch.challenge) throw new Error("no challenge: " + JSON.stringify(ch));
const chTx = S.TransactionBuilder.fromXDR(ch.challenge, PASS);
chTx.sign(kp);
const keyRes = await fetch(`${GW}/keys`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address: USER, signedXdr: chTx.toXDR(), name: "mainnet-smoke" }) });
const keyOut = await keyRes.json();
if (!keyOut.key && !keyOut.apiKey) throw new Error("key issue failed: " + JSON.stringify(keyOut));
const API_KEY = keyOut.key || keyOut.apiKey;
console.log(`   issued ${API_KEY.slice(0, 16)}… ✓`);

// 3 ─ prepaid door (debits on-chain after a successful completion)
step(3, "Prepaid call — gateway debits credit on-chain");
const creditBefore = await credit();
const chat = await fetch(`${GW}/v1/chat/completions`, {
  method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${API_KEY}` },
  body: JSON.stringify({ messages: [{ role: "user", content: "In one short sentence: what is Stellarouter?" }] }),
});
const chatJson = await chat.json();
const debitHeader = chat.headers.get("x-stellarouter-debit");
console.log(`   http ${chat.status} · model ${chatJson.model}`);
console.log(`   answer: ${(chatJson.choices?.[0]?.message?.content || JSON.stringify(chatJson)).slice(0, 90)}`);
if (debitHeader) { const [amt, h] = debitHeader.split(":"); console.log(`   debit ${Number(amt)/1e7} USDC → ${X(h)}`); }
await new Promise((r) => setTimeout(r, 4000));
console.log(`   credit ${creditBefore.toFixed(4)} → ${(await credit()).toFixed(4)}`);

// 4 ─ x402 door (agent pays per call, zero XLM)
step(4, "x402 call — agent pays USDC per request");
const signer = createEd25519Signer(process.env.MAINNET_ADMIN_SECRET, "stellar:pubnet");
const payFetch = wrapFetchWithPaymentFromConfig(fetch, { schemes: [{ network: "stellar:pubnet", client: new ExactStellarScheme(signer, { url: "https://mainnet.sorobanrpc.com" }) }] });
const x402 = await payFetch(`${GW}/v1/chat/completions`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ messages: [{ role: "user", content: "Say hi in five words." }] }),
});
const xj = await x402.json();
console.log(`   http ${x402.status} · model ${xj.model}`);
console.log(`   answer: ${(xj.choices?.[0]?.message?.content || JSON.stringify(xj)).slice(0, 90)}`);
const sponsorAfter = await bal(SPONSOR);
console.log(`   sponsor USDC ${sponsorBefore.usdc.toFixed(4)} → ${sponsorAfter.usdc.toFixed(4)} (x402 recipient)`);

// 5 ─ gasless withdraw
step(5, "Gasless refund — user takes the remainder back");
const remaining = await credit();
const wHash = await sponsored("withdraw", "withdraw", BigInt(Math.round(remaining * 1e7)));
await new Promise((r) => setTimeout(r, 6000));
const end = await bal(USER);
console.log(`   withdrew ${remaining.toFixed(4)} USDC → ${X(wHash)}`);
console.log(`   credit now ${(await credit()).toFixed(4)} · wallet USDC ${end.usdc.toFixed(4)} · XLM ${end.xlm.toFixed(4)}`);
console.log(`\n✅ mainnet smoke test complete — user XLM spent on fees: ${(before.xlm - end.xlm).toFixed(7)}`);
