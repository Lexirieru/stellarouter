// Simulasi user Stellarouter di testnet — menghidupkan kontrak `credits`
// dengan aktivitas nyata dari banyak wallet:
//
//   1. Generate N wallet user (friendbot → XLM)
//   2. changeTrust USDC per wallet
//   3. Danai USDC dari funder (auto-beli di DEX testnet pakai XLM bila kurang)
//   4. deposit() ke kontrak credits (ditandatangani user)
//   5. debit() acak oleh admin (mensimulasikan pemakaian API)
//   6. (opsional) withdraw sisa kredit untuk satu user
//
// Semua tx hash dicetak — pakai untuk README/submission. Wallet tersimpan di
// scripts/.sim-wallets.json (gitignored) agar bisa dipakai ulang.
//
// Jalankan dari backend/:  node scripts/simulate-users.js [--users 3] [--debits 2] [--fund 3] [--withdraw]

import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import * as S from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const FRIENDBOT = "https://friendbot.stellar.org";
const RPC_URL = process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const PASSPHRASE = "Test SDF Network ; September 2015";
const CONTRACT_ID =
  process.env.CREDITS_CONTRACT_ID ||
  "CAEFFQAL6SGQF6OV5BOBE23NAC2T7WXOUUE5XRDOH2KRN2HXRMDXA7RE";
const USDC = new S.Asset(
  "USDC",
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
);

const horizon = new S.Horizon.Server(HORIZON_URL);
const rpc = new S.rpc.Server(RPC_URL);
const contract = new S.Contract(CONTRACT_ID);

// Admin kontrak (= gateway). Debit ditandatangani key ini.
const ADMIN_SECRET = process.env.GATEWAY_ADMIN_SECRET;
if (!ADMIN_SECRET) {
  console.error("GATEWAY_ADMIN_SECRET kosong di backend/.env — dibutuhkan untuk debit().");
  process.exit(1);
}
const admin = S.Keypair.fromSecret(ADMIN_SECRET);

// ── CLI args ────────────────────────────────────────────────────────────────
const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? Number(process.argv[i + 1]) : dflt;
};
const N_USERS = arg("users", 3);
const N_DEBITS = arg("debits", 2);
const FUND_USDC = arg("fund", 3); // USDC per user
const DO_WITHDRAW = process.argv.includes("--withdraw");

const stroops = (usdc) => BigInt(Math.round(usdc * 10_000_000));
const fmt = (v) => (Number(v) / 10_000_000).toFixed(3);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

// ── Helpers: classic (Horizon) ──────────────────────────────────────────────
async function classicTx(sourceKp, ops) {
  const acc = await horizon.loadAccount(sourceKp.publicKey());
  const b = new S.TransactionBuilder(acc, {
    fee: (Number(S.BASE_FEE) * 10).toString(), // fee headroom biar tidak antri
    networkPassphrase: PASSPHRASE,
  });
  ops.forEach((op) => b.addOperation(op));
  const tx = b.setTimeout(120).build();
  tx.sign(sourceKp);
  const res = await horizon.submitTransaction(tx);
  return res.hash;
}

// ── Helpers: Soroban invoke (RPC) ───────────────────────────────────────────
async function invoke(sourceKp, method, ...args) {
  const acc = await rpc.getAccount(sourceKp.publicKey());
  const tx = new S.TransactionBuilder(acc, {
    fee: S.BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(120)
    .build();
  const prepared = await rpc.prepareTransaction(tx);
  prepared.sign(sourceKp);
  const sent = await rpc.sendTransaction(prepared);
  if (sent.status === "ERROR") {
    throw new Error(`${method} submit error: ${JSON.stringify(sent.errorResult)}`);
  }
  let res = await rpc.getTransaction(sent.hash);
  const t0 = Date.now();
  while (res.status === "NOT_FOUND") {
    if (Date.now() - t0 > 60_000) throw new Error(`${method} poll timeout`);
    await sleep(1500);
    res = await rpc.getTransaction(sent.hash);
  }
  if (res.status !== "SUCCESS") throw new Error(`${method} → ${res.status}`);
  return sent.hash;
}

const addr = (g) => S.Address.fromString(g).toScVal();
const i128 = (v) => S.nativeToScVal(v, { type: "i128" });

// ── Funder: pastikan punya cukup USDC (beli di DEX testnet bila kurang) ────
async function ensureFunderUsdc(needed) {
  const acc = await horizon.loadAccount(admin.publicKey());
  const bal = acc.balances.find(
    (b) => b.asset_code === "USDC" && b.asset_issuer === USDC.getIssuer()
  );
  const have = bal ? Number(bal.balance) : 0;
  if (have >= needed) {
    console.log(`funder: ${have.toFixed(3)} USDC — cukup`);
    return null;
  }
  const buy = Math.ceil(needed - have + 1);
  console.log(`funder: ${have.toFixed(3)} USDC — beli ${buy} USDC di DEX (bayar XLM)…`);
  const hash = await classicTx(admin, [
    S.Operation.pathPaymentStrictReceive({
      sendAsset: S.Asset.native(),
      sendMax: (buy * 5).toFixed(7), // toleransi harga sampai 5 XLM/USDC
      destination: admin.publicKey(),
      destAsset: USDC,
      destAmount: buy.toFixed(7),
    }),
  ]);
  console.log(`  ✓ beli USDC — tx ${hash}`);
  return hash;
}

// ── Main ────────────────────────────────────────────────────────────────────
const out = { contract: CONTRACT_ID, users: [], txs: [] };
const record = (kind, user, hash, extra = {}) => {
  out.txs.push({ kind, user, hash, ...extra });
  console.log(`  ✓ ${kind}${extra.amount ? ` ${extra.amount} USDC` : ""} — tx ${hash}`);
};

console.log(`Simulasi: ${N_USERS} user × deposit ${FUND_USDC} USDC × ${N_DEBITS} debit`);
console.log(`Kontrak : ${CONTRACT_ID}`);
console.log(`Admin   : ${admin.publicKey()}\n`);

await ensureFunderUsdc(N_USERS * FUND_USDC);

const users = [];
for (let i = 0; i < N_USERS; i++) {
  const kp = S.Keypair.random();
  users.push(kp);
  console.log(`\nuser[${i}] ${kp.publicKey()}`);

  // 1) friendbot — akun baru dengan XLM
  const fb = await fetch(`${FRIENDBOT}?addr=${kp.publicKey()}`);
  if (!fb.ok) throw new Error(`friendbot gagal: ${fb.status}`);
  console.log("  ✓ friendbot (XLM funded)");

  // 2) trustline USDC
  record(
    "trustline",
    kp.publicKey(),
    await classicTx(kp, [S.Operation.changeTrust({ asset: USDC })])
  );

  // 3) danai USDC dari funder
  record(
    "fund-usdc",
    kp.publicKey(),
    await classicTx(admin, [
      S.Operation.payment({
        destination: kp.publicKey(),
        asset: USDC,
        amount: FUND_USDC.toFixed(7),
      }),
    ]),
    { amount: FUND_USDC.toFixed(3) }
  );

  // 4) deposit ke kontrak (user tanda tangan sendiri)
  const dep = stroops(FUND_USDC);
  record(
    "deposit",
    kp.publicKey(),
    await invoke(kp, "deposit", addr(kp.publicKey()), i128(dep)),
    { amount: fmt(dep) }
  );

  out.users.push({ public: kp.publicKey(), secret: kp.secret() });
}

// 5) debit acak oleh admin — mensimulasikan pemakaian API per user
console.log("\nadmin men-debit pemakaian API…");
for (const kp of users) {
  let left = FUND_USDC;
  for (let d = 0; d < N_DEBITS; d++) {
    const amt = Math.min(rand(0.05, 0.35), left * 0.5);
    if (amt < 0.01) break;
    left -= amt;
    const v = stroops(amt);
    record("debit", kp.publicKey(), await invoke(admin, "debit", addr(kp.publicKey()), i128(v)), {
      amount: fmt(v),
    });
  }
}

// 6) opsional: satu user menarik sisa kreditnya (bukti refundable)
if (DO_WITHDRAW && users.length > 0) {
  const kp = users[0];
  console.log("\nuser[0] withdraw sisa kredit…");
  const balTx = new S.TransactionBuilder(await rpc.getAccount(kp.publicKey()), {
    fee: S.BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(contract.call("balance", addr(kp.publicKey())))
    .setTimeout(30)
    .build();
  const sim = await rpc.simulateTransaction(balTx);
  const left = BigInt(S.scValToNative(sim.result.retval));
  if (left > 0n) {
    record("withdraw", kp.publicKey(), await invoke(kp, "withdraw", addr(kp.publicKey()), i128(left)), {
      amount: fmt(left),
    });
  }
}

// simpan wallet (reusable) + ringkasan
const walletsFile = new URL("./.sim-wallets.json", import.meta.url).pathname;
const prev = existsSync(walletsFile) ? JSON.parse(readFileSync(walletsFile, "utf8")) : [];
writeFileSync(walletsFile, JSON.stringify([...prev, ...out.users], null, 2));

console.log("\n── Ringkasan ──");
console.log(`users baru : ${out.users.length} (tersimpan di scripts/.sim-wallets.json)`);
console.log(`total txs  : ${out.txs.length}`);
const sample = out.txs.find((t) => t.kind === "deposit");
if (sample) {
  console.log(`contoh deposit (untuk README):`);
  console.log(`  https://stellar.expert/explorer/testnet/tx/${sample.hash}`);
}
