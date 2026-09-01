import { describe, expect, test } from "bun:test";
import * as S from "@stellar/stellar-sdk";
import { validateSponsoredTx, NETWORK_PASSPHRASE } from "./sponsor.js";

const CONTRACT_ID = "CAEFFQAL6SGQF6OV5BOBE23NAC2T7WXOUUE5XRDOH2KRN2HXRMDXA7RE";
const USDC = new S.Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");

function baseTx(op) {
  const kp = S.Keypair.random();
  const acc = new S.Account(kp.publicKey(), "1");
  const tx = new S.TransactionBuilder(acc, { fee: "100", networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(op)
    .setTimeout(120)
    .build();
  tx.sign(kp);
  return tx.toXDR();
}

describe("fee sponsorship allow-list", () => {
  test("accepts a credits-contract deposit invocation", () => {
    const contract = new S.Contract(CONTRACT_ID);
    const kp = S.Keypair.random();
    const xdr = baseTx(
      contract.call(
        "deposit",
        S.Address.fromString(kp.publicKey()).toScVal(),
        S.nativeToScVal(10_000_000n, { type: "i128" })
      )
    );
    const r = validateSponsoredTx(xdr);
    expect(r.ok).toBe(true);
    expect(r.soroban).toBe(true);
  });

  test("accepts the USDC changeTrust", () => {
    const r = validateSponsoredTx(baseTx(S.Operation.changeTrust({ asset: USDC })));
    expect(r).toMatchObject({ ok: true, soroban: false });
  });

  test("rejects payments and foreign trustlines", () => {
    const kp = S.Keypair.random();
    expect(
      validateSponsoredTx(
        baseTx(S.Operation.payment({ destination: kp.publicKey(), asset: S.Asset.native(), amount: "1" }))
      ).ok
    ).toBe(false);
    expect(
      validateSponsoredTx(
        baseTx(S.Operation.changeTrust({ asset: new S.Asset("EVIL", kp.publicKey()) }))
      ).ok
    ).toBe(false);
  });

  test("rejects foreign contracts and non-sponsored functions", () => {
    const foreign = new S.Contract("CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA");
    expect(validateSponsoredTx(baseTx(foreign.call("deposit"))).ok).toBe(false);
    const ours = new S.Contract(CONTRACT_ID);
    expect(validateSponsoredTx(baseTx(ours.call("collect"))).ok).toBe(false);
  });

  test("rejects garbage XDR", () => {
    expect(validateSponsoredTx("not-xdr").ok).toBe(false);
  });
});
