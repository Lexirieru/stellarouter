// Wallet ownership proof (SEP-10-style challenge transaction).
//
// To prove they control a Stellar address before getting an API key, the client
// signs a server-issued challenge transaction with Freighter. We never submit
// it — we only verify the signature on the tx hash matches the address, and that
// the embedded single-use nonce is one we issued. This reuses the exact signing
// path (signTransaction) that already works with Freighter, avoiding the
// byte-format ambiguity of signMessage.

import * as S from "@stellar/stellar-sdk";
import { randomBytes } from "node:crypto";

const PASSPHRASE = (process.env.STELLAR_NETWORK || "stellar:testnet").includes("pubnet")
  ? S.Networks.PUBLIC
  : S.Networks.TESTNET;
const AUTH_DATA_NAME = "stellarouter-auth";
const TTL_MS = 5 * 60 * 1000; // 5 minutes

const challenges = new Map(); // nonce -> { address, expires }

/** Build an unsigned challenge tx for `address`. Returns its XDR. */
export function buildChallenge(address) {
  // Validate the address up front.
  S.Keypair.fromPublicKey(address);

  const nonce = randomBytes(20).toString("hex"); // 40 chars (< 64-byte data limit)
  const account = new S.Account(address, "0"); // never submitted; sequence irrelevant
  const tx = new S.TransactionBuilder(account, {
    fee: S.BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(
      S.Operation.manageData({
        name: AUTH_DATA_NAME,
        value: Buffer.from(nonce, "utf8"),
      })
    )
    .setTimeout(300)
    .build();

  challenges.set(nonce, { address, expires: Date.now() + TTL_MS });
  return tx.toXDR();
}

/** Verify a signed challenge XDR proves control of `address`. */
export function verifyChallenge(address, signedXdr) {
  let tx;
  try {
    tx = S.TransactionBuilder.fromXDR(signedXdr, PASSPHRASE);
  } catch {
    return false;
  }
  if (tx.source !== address) return false;

  const op = tx.operations.find(
    (o) => o.type === "manageData" && o.name === AUTH_DATA_NAME && o.value
  );
  if (!op) return false;

  const nonce = op.value.toString("utf8");
  const rec = challenges.get(nonce);
  if (!rec || rec.address !== address || rec.expires < Date.now()) return false;

  // Signature on the tx hash must be by `address`.
  const kp = S.Keypair.fromPublicKey(address);
  const hash = tx.hash();
  const ok = tx.signatures.some((s) => {
    try {
      return kp.verify(hash, s.signature());
    } catch {
      return false;
    }
  });
  if (!ok) return false;

  challenges.delete(nonce); // single-use
  return true;
}
