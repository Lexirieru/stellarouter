# Mainnet Runbook

Everything needed to take Stellarouter from testnet to Stellar **pubnet**.
By design the payment path is config-driven: no code changes are required, only
new keys, a new contract id and a network flip.

**Verified facts** (checked against live networks on 1 Sep 2026):

| Item | Value |
|---|---|
| Pubnet protocol | 27 (`getVersionInfo`) |
| Contract WASM (v1.1) | 5,431 bytes, built with `soroban-sdk` 26 |
| SDK compatibility | The same SDK-26 build already runs on testnet **protocol 28**, so it is forward-compatible with pubnet 27 — no SDK bump required to deploy |
| USDC issuer (Circle, pubnet) | `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN` |
| USDC SAC (pubnet) | `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75` |
| Pubnet fee stats at review | p50 = p90 = 7,228 stroops (0.00072 XLM), ledger capacity 67 % |
| Deployer account on pubnet | **Does not exist yet** — must be created and funded |

## 0 · Prerequisites (human actions)

1. **Fund a mainnet deployer/admin account.** Budget **≈ 5 XLM**: 1 XLM base
   reserve, 0.5 XLM for the USDC trustline subentry, contract upload + instance
   rent for a 5.4 KB contract, and headroom for elevated fees (the network was
   at 67 % capacity at review time). Read the exact fee from the simulation
   before submitting — never guess.
2. **Fund an operational USDC balance** on the same account (x402 receipts land
   here; it also seeds the sponsor budget).
3. **Get a mainnet OZ Channels API key** — <https://channels.openzeppelin.com>
   (the testnet key will not work on pubnet).
4. **Decide the admin split** — see [SECURITY-REVIEW.md](./SECURITY-REVIEW.md)
   finding **C-2**: the hot gateway key should ideally only be able to `debit`,
   with `collect`/`set_admin` behind a cold key or multisig.
5. **Top up the upstream LLM account.** On pubnet the model policy unlocks the
   full catalog, so paid models become reachable — either fund the provider
   account or keep a `TESTNET_MODELS`-style allow-list of cheap models
   (see "Cost guard" below).

## 1 · Deploy the contract

```bash
cd smart-contract
cargo test -p credits          # 11 tests must pass
stellar contract build         # → target/wasm32v1-none/release/credits.wasm (5,431 bytes)

# Record the hash so the deployed code can be verified against a local build
shasum -a 256 target/wasm32v1-none/release/credits.wasm

stellar keys add stellarouter-mainnet --secret-key   # paste the funded S... key
stellar contract deploy \
  --wasm target/wasm32v1-none/release/credits.wasm \
  --source-account stellarouter-mainnet \
  --network mainnet \
  -- \
  --admin <ADMIN_G_ADDRESS> \
  --token CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75
```

The command prints the new contract id (`C…`). Verify it on
<https://stellar.expert/explorer/public/contract/CONTRACT_ID> and confirm the
constructor state:

```bash
stellar contract invoke --id <CONTRACT_ID> --source-account stellarouter-mainnet \
  --network mainnet -- admin
stellar contract invoke --id <CONTRACT_ID> --source-account stellarouter-mainnet \
  --network mainnet -- token
```

The repo also ships a one-click deploy workflow —
[`.github/workflows/deploy-contract.yml`](../.github/workflows/deploy-contract.yml)
— parameterise `admin`/`token` and set the `STELLAR_DEPLOYER_SECRET` secret.

## 2 · Flip the gateway to pubnet

Set these on the gateway project (`vercel env add <NAME> production`), then
redeploy. **No code changes.**

| Variable | Mainnet value |
|---|---|
| `STELLAR_NETWORK` | `stellar:pubnet` |
| `FACILITATOR_URL` | `https://channels.openzeppelin.com/x402` |
| `OZ_API_KEY` | mainnet key |
| `STELLAR_RPC_URL` | `https://mainnet.sorobanrpc.com` (or your provider) |
| `STELLAR_HORIZON_URL` | `https://horizon.stellar.org` |
| `CREDITS_CONTRACT_ID` | the new `C…` from step 1 |
| `STELLAR_RECIPIENT` | mainnet account with a USDC trustline |
| `GATEWAY_ADMIN_SECRET` | mainnet admin (also the fee-bump sponsor) |
| `USDC_ISSUER` | `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN` |
| `KEYS_DB_PATH` / `LOGS_DB_PATH` / `FEEDBACK_DB_PATH` | hosted DB (see **G-4**) |

`IS_MAINNET` in `modelPolicy.js` derives from `STELLAR_NETWORK`, so pubnet
automatically enables the whole model catalog.

**Cost guard.** If the upstream budget is limited, keep an allow-list on
mainnet too by setting `TESTNET_MODELS` semantics for pubnet (edit
`modelPolicy.js` `enabledModels()` to consult an env allow-list in both
networks) — cheaper than discovering the bill after launch.

## 3 · Flip the console

```bash
vercel env add NEXT_PUBLIC_STELLAR_NETWORK production      # mainnet
vercel env add NEXT_PUBLIC_CREDITS_CONTRACT_ID production  # the new C…
vercel env add NEXT_PUBLIC_STELLAR_RPC_URL production      # pubnet RPC
vercel env add NEXT_PUBLIC_STELLAR_HORIZON_URL production  # https://horizon.stellar.org
vercel env add NEXT_PUBLIC_USDC_ISSUER production          # GA5ZSEJY…KZVN
git commit --allow-empty -m "chore: redeploy on mainnet config" && git push
```

`packages/ui/src/stellar.ts` switches passphrase/Horizon from
`NEXT_PUBLIC_STELLAR_NETWORK`, and the wallet guard will then reject wallets
still on TESTNET. Explorer links in `TxStatus`/`ActivityFeed` must be switched
from `/explorer/testnet/` to `/explorer/public/`.

## 4 · Smoke test on mainnet (in order, small amounts)

1. `GET /health` → `{"network":"stellar:pubnet","mainnet":true,"sponsor":true}`
2. `GET /models` → catalog with `enabled: true` entries
3. Console → connect wallet (PUBLIC) → add USDC trustline → top up **0.1 USDC**
4. Verify the deposit event on stellar.expert; the Analytics page should count 1 wallet
5. `node backend/scripts/verify-sponsorship.js` (point it at pubnet) →
   `fee_account = sponsor`, user XLM delta `0.0000000`
6. One paid x402 call end to end, then a `withdraw` to prove refundability

## 4b · Onboarding real mainnet users

Mainnet users spend real money, so the ask has to be small and reversible. Fee
sponsorship makes it genuinely risk-free, and that is the pitch:

> Deposit **$0.10 USDC**, send one chat, then hit **Refund** and take the rest
> back. We pay the network fees, so the only thing it costs you is the fraction
> of a cent you actually spend on the model.

Practical notes:

- Keep the suggested amount tiny ($0.10–$0.50). The point is a real signed
  transaction, not revenue.
- Leave **Gasless** on so users need no XLM beyond their account reserve —
  otherwise "get XLM first" kills the funnel.
- Point people at the [user guide](./USER-GUIDE.md); the Get Started checklist
  in the console ticks itself off as they go.
- Collect name/email/wallet/rating with the existing
  [Google Form](https://docs.google.com/forms/d/e/1FAIpQLSeRO3QSebcOD6j_tmppQ17q16FOmTVm6t_zds9hKwRP0XNjzw/viewform),
  then export it next to [users-feedback.xlsx](./users-feedback.xlsx).
- Verify each participant on-chain before counting them: their wallet must
  appear in a `deposit` event on the mainnet contract. The Analytics page
  counts unique wallets straight from those events.
- Do **not** self-fund wallets to inflate the count. Testnet cohorts are a
  DevRel-approved simulation; on mainnet the same pattern would be wash
  activity with real money and is not acceptable as adoption proof.

Where to find people: the Stellar Indonesia community, the RiseIn cohort
(reciprocal testing is the norm — offer to test theirs), Stellar Discord
`#dev-general`, and the launch thread itself ([draft](./LAUNCH-THREAD.md)).

## 5 · Incident response

**Pause** (blocks new deposits and gateway debits; withdrawals stay open by
design so users can always exit):

```bash
stellar contract invoke --id <CONTRACT_ID> --source-account stellarouter-mainnet \
  --network mainnet -- set_paused --paused true
```

**Rotate the admin key** (emits an `admin` event):

```bash
stellar contract invoke --id <CONTRACT_ID> --source-account stellarouter-mainnet \
  --network mainnet -- set_admin --new_admin <NEW_G_ADDRESS>
```

**Sweep treasury to cold storage:**

```bash
stellar contract invoke --id <CONTRACT_ID> --source-account stellarouter-mainnet \
  --network mainnet -- collect --to <COLD_G_ADDRESS> --amount <STROOPS>
```

Disable spend paths quickly by unsetting `GATEWAY_ADMIN_SECRET` (turns off fee
sponsorship and the prepaid door) or `PAYER_SECRET_KEY` (turns off the demo
agent) and redeploying.

## 6 · Post-launch monitoring

- Contract events `deposit` / `debit` / `withdraw` / `collect` / `admin` / `paused`
- Sponsor and demo wallet XLM/USDC balances (alert on unusual drain — **G-1**, **G-2**)
- `GET /metrics` — calls, upstream cost, average speed
- The Analytics page recomputes user counts and volume straight from chain events

## Rollback

The contract is not upgradeable by design (no `update_current_contract_wasm`
path), so "rollback" means: pause the contract, deploy a fixed instance, point
`CREDITS_CONTRACT_ID` at it, and let users `withdraw` from the old instance —
which remains possible because pause never blocks withdrawals.
