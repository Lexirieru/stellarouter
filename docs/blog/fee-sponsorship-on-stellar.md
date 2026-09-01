# Gasless transactions on Stellar: fee bumps done safely

*A practical guide to sponsoring your users' network fees — and to not getting
your sponsor wallet drained while you do it.*

Published from [Stellarouter](https://github.com/Lexirieru/stellarouter), an
LLM gateway where AI agents pay per call in USDC and humans prepay into a
Soroban vault. Everything below is running code — the verification transaction
at the end is real.

## The problem

Your user has USDC. They want to deposit it into your contract. But their
wallet has no XLM, so they cannot pay the network fee — and explaining "first
acquire a second token to pay a fraction of a cent" is where onboarding dies.

Stellar solves this with **fee-bump transactions** (CAP-15). The user signs
their transaction normally; you wrap that signed envelope in an outer
transaction whose *fee source* is your account. The network charges you the
fee, while the inner transaction keeps the user as its source account and sole
authorizer. The user pays nothing and gives up nothing.

## The five-line version

```js
import * as S from "@stellar/stellar-sdk";

const bump = S.TransactionBuilder.buildFeeBumpTransaction(
  sponsorKeypair,                       // who pays
  String(Number(inner.fee) + 1_000),    // outer fee must exceed the inner bid
  inner,                                // the user's SIGNED transaction
  networkPassphrase
);
bump.sign(sponsorKeypair);
await server.sendTransaction(bump);
```

Two details that cost people an afternoon:

- **The inner transaction must already be signed.** You are wrapping a finished
  envelope, not co-signing one.
- **For Soroban transactions, the inner fee already includes the resource fee.**
  Bump relative to `inner.fee`, not to `BASE_FEE`, or the outer bid will be too
  low and the network rejects it.

Also worth knowing: a fee bump covers **fees**, not **reserves**. The user's
account must already exist (1 XLM base reserve) and a new trustline still costs
0.5 XLM of reserve. If you want to cover those too, that is a different
feature — sponsored reserves (CAP-33).

## The part nobody warns you about

A naive `POST /sponsor` that fee-bumps whatever XDR it receives is a faucet
draining your wallet. Anyone can send you *any* signed transaction and have you
pay for it.

The fix is an allow-list that inspects the inner transaction **before** signing
anything. Concretely, Stellarouter only sponsors transactions that touch
Stellarouter:

```js
export function validateSponsoredTx(xdr) {
  let tx;
  try {
    tx = S.TransactionBuilder.fromXDR(xdr, NETWORK_PASSPHRASE);
  } catch {
    return { ok: false, reason: "invalid transaction XDR" };
  }
  // Never bump something already bumped, and keep the shape small.
  if (tx instanceof S.FeeBumpTransaction) return { ok: false, reason: "already fee-bumped" };
  if (tx.operations.length === 0 || tx.operations.length > 2) {
    return { ok: false, reason: "unexpected operation count" };
  }

  for (const op of tx.operations) {
    if (op.type === "changeTrust") {
      // Only OUR asset — not any trustline the caller feels like opening.
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
      // Only OUR contract...
      const target = S.Address.fromScAddress(invocation.contractAddress()).toString();
      if (target !== CONTRACT_ID) {
        return { ok: false, reason: "only the credits contract is sponsored" };
      }
      // ...and only the functions a user should be able to call for free.
      const method = invocation.functionName().toString();
      if (!["deposit", "withdraw"].includes(method)) {
        return { ok: false, reason: `function ${method} is not sponsored` };
      }
    } else {
      return { ok: false, reason: `operation ${op.type} is not sponsored` };
    }
  }
  return { ok: true };
}
```

Read that function as a policy statement: *we pay for people to put money in,
take money out, and open the trustline they need to do either.* Everything
else — payments to arbitrary destinations, foreign trustlines, other people's
contracts, and privileged functions like `collect` or `set_admin` — is refused.

Note that `set_admin` and `collect` are refused even though they are *our*
contract's functions. Allow-list per function, not per contract: the admin
functions are exactly the ones an attacker would most enjoy having you pay for.

Pair it with a per-IP rate limit. Even a perfectly shaped request costs you a
fee, so bound how many of them one caller can trigger, and keep the sponsor
wallet's balance small and monitored.

## Testing the policy

The allow-list is security-critical, so it deserves tests that try to break it —
not just one happy path:

```js
test("rejects foreign contracts and non-sponsored functions", () => {
  const foreign = new S.Contract("CBIELTK6…DAMA");
  expect(validateSponsoredTx(baseTx(foreign.call("deposit"))).ok).toBe(false);
  const ours = new S.Contract(CONTRACT_ID);
  expect(validateSponsoredTx(baseTx(ours.call("collect"))).ok).toBe(false);
});
```

## Proving it actually worked

"The transaction succeeded" does not prove sponsorship — the user might simply
have paid. The proof is a **balance delta**: read the user's and the sponsor's
XLM before and after, then check the ledger's own attribution.

Here is a real testnet run against the deployed gateway
([script](https://github.com/Lexirieru/stellarouter/blob/main/backend/scripts/verify-sponsorship.js)):

```text
XLM before → user 9999.9917744 | sponsor 9935.7444767
XLM after  → user 9999.9917744 | sponsor 9935.7427441
tx         : 413c5535614b3490b98ecb72f6e1c53abfbd8994db901a7f46ee0e5294255c10  (successful=true)
fee_account: GDYS2IMC…UR7UTC  = SPONSOR ✓
source     : GCMQIJY4…X3WASK  = USER ✓
fee charged: 0.0017326 XLM
user XLM delta   : 0.0000000  ← UNCHANGED (gasless)
sponsor XLM delta: -0.0017326 ← sponsor paid
```

Horizon reports `fee_account` and `source_account` separately, which is exactly
the distinction that makes a fee bump legible after the fact: the *user*
authorized the state change, the *sponsor* paid for it. Verify it yourself:
[`413c5535…`](https://stellar.expert/explorer/testnet/tx/413c5535614b3490b98ecb72f6e1c53abfbd8994db901a7f46ee0e5294255c10).

## Checklist

- [ ] Inner transaction is signed before you wrap it
- [ ] Outer fee > inner fee (and remember Soroban's resource fee is inside it)
- [ ] Allow-list by contract **and** function, plus asset for `changeTrust`
- [ ] Reject already-bumped transactions and unexpected operation counts
- [ ] Rate-limit the endpoint; keep the sponsor balance bounded and alerted
- [ ] Verify with balance deltas and `fee_account`, not just "status: success"
- [ ] Remember reserves are not fees — CAP-33 sponsored reserves is a separate tool

## Source

- Sponsor module: [`backend/src/sponsor.js`](https://github.com/Lexirieru/stellarouter/blob/main/backend/src/sponsor.js)
- Tests: [`backend/src/sponsor.test.js`](https://github.com/Lexirieru/stellarouter/blob/main/backend/src/sponsor.test.js)
- Verification script: [`backend/scripts/verify-sponsorship.js`](https://github.com/Lexirieru/stellarouter/blob/main/backend/scripts/verify-sponsorship.js)
- Docs: [Fee-bump transactions](https://developers.stellar.org/docs/learn/fundamentals/transactions/fee-bump-transactions)

MIT-licensed — copy the allow-list into your own project.
