# Security Review — Stellarouter

**Scope:** `credits` Soroban contract v1.1 + the Express gateway (x402 door,
prepaid door, fee sponsorship) + the Next.js console.
**Reviewed commit:** `d251635` · **Date:** 1 September 2026 · **Network at review:** testnet
**Method:** manual review against the Stellar smart-contract security checklist
(authorization, auth-replay, reinitialization, arbitrary calls, arithmetic,
storage keys, check-then-act, TTL/archival, cross-contract returns, resource
exhaustion), plus a gateway review of key custody, unauthenticated spend paths,
secret storage and abuse surfaces. Findings were reproduced against the running
testnet deployment where applicable.

> This document is the artifact for the Level 6 requirement *"Security review
> approved by mentors/team"*. A sign-off block is at the end.

## Threat model

The attacker is assumed to control all function arguments, transaction ordering
and timing, every account except those whose signatures are required, and can
deploy contracts that mimic our interfaces. Trusted: the Stellar network itself,
the USDC SAC issuer (Circle), and the OpenZeppelin Channels facilitator for
x402 settlement.

Assets worth attacking, in order:
1. USDC held by the `credits` contract (user balances + treasury).
2. The gateway admin key (can `debit` any balance and `collect` treasury).
3. The demo/sponsor wallets (spend real value per request).
4. API keys and usage data.

## Findings

| ID | Severity | Finding | Status |
|---|---|---|---|
| G-1 | High | Unauthenticated demo endpoint spends real USDC per call | **Fixed** (`d251635`) |
| G-2 | High | Fee-sponsorship endpoint could be farmed for arbitrary fees | **Fixed by design** (`d251635`) |
| C-1 | Medium | Admin can debit any user's full balance (custody boundary) | **Accepted + mitigated** |
| C-2 | Medium | Admin key compromise ⇒ balances debitable and treasury sweepable | **Accepted (testnet), action required for mainnet** |
| G-3 | Medium | x402 settles before the upstream completion succeeds | **Mitigated**, refund path planned |
| G-4 | Medium | Key/usage/feedback stores are ephemeral on serverless | **Accepted (testnet)**, hosted DB for mainnet |
| C-3 | Low | Idle user balance entries can be archived (TTL) | **Accepted**, restore documented |
| G-5 | Low | API keys hashed with unsalted SHA-256 | **Accepted** (high-entropy secrets) |
| G-6 | Low | `Access-Control-Allow-Origin: *` | **Accepted by design** |

No critical findings. No unauthorized path to user funds was identified.

### Contract

**Checklist results.** Every privileged path carries `require_auth` on an
address read from storage, never from a caller-supplied parameter: `deposit`
(`from`), `withdraw` (`user`), `debit`/`collect`/`set_paused` (stored admin),
`set_admin` (outgoing admin). The auth-replay class (re-authorizing at every
layer that consumes an address's authority) is handled — `deposit` calls
`token.transfer(from, …)` *and* authorizes `from` itself, so a pre-signed inner
auth entry cannot be consumed by a third party calling our function.
Initialization uses `__constructor`, which cannot be re-run, so reinitialization
capture is impossible. The token address is fixed at construction and read from
storage, so there is no arbitrary-contract-call surface. Arithmetic uses
`checked_add` for both balance and treasury accumulation, subtractions are
guarded by explicit balance checks, non-positive amounts are rejected, and the
release profile sets `overflow-checks = true`. Storage uses a typed
`#[contracttype]` key enum. All state transitions are atomic within a single
invocation, and there are no user-controlled loops (no resource-exhaustion
surface). Reentrancy is blocked by the host.

**Solvency invariant.** `contract USDC balance == Σ user balances + treasury`.
`collect` is bounded by `treasury`, so the admin can never sweep user credit,
and `withdraw` is bounded by the caller's own balance. This is the property
that makes the vault non-custodial in the way the product claims.

**C-1 — Admin can debit any user's full balance (Medium, accepted).**
`debit(user, amount)` is admin-authorized and bounded only by the user's
balance, so a malicious or compromised gateway could convert user credit into
treasury. This is inherent to the "charge for usage after serving it" model.
*Mitigations in place:* every debit emits a public contract event, so
overcharging is publicly auditable and detectable; users may `withdraw` their
remaining balance at any time; the pause switch (v1.1) deliberately **never**
blocks `withdraw`, so an incident freeze cannot trap user funds.
*Recommended next:* per-call debit caps enforced on-chain, or user-signed usage
receipts, so the contract itself bounds what the gateway can charge.

**C-2 — Admin key custody (Medium, action required before mainnet).**
The admin secret currently lives as a serverless environment variable. Its
compromise implies C-1 at full scale plus `collect` of the treasury. *Required
for mainnet:* split roles so the hot gateway key can only `debit`, while
`collect`/`set_admin` sit behind a separate cold key or a multisig/custom
account; keep the treasury swept to cold storage on a schedule; monitor
`debit`/`collect` events and alert on anomalies.

**C-3 — Balance TTL (Low, accepted).** A user's `Balance(Address)` entry has its
TTL extended only when they transact. An idle balance can therefore be archived
after the persistent TTL window. Funds are **not** lost — the entry is
restorable via `RestoreFootprintOp` — but restoration adds friction.
*Recommended:* a keeper that bumps TTLs for non-zero balances, and a
user-facing restore path in the console.

### Gateway

**G-1 — Unauthenticated demo endpoint (High, fixed).** `POST /demo/agent-call`
pays for an x402 call from the demo wallet on behalf of the caller, with no
authentication. Any script could have looped it to drain that wallet's USDC.
*Fixed* with a per-IP fixed-window rate limit (12/hour). *Residual:* IP
rotation; the demo wallet is deliberately funded with a small, bounded amount
and is testnet-only.

**G-2 — Fee sponsorship abuse (High, fixed by design).** `POST /sponsor`
fee-bumps a user-signed transaction with the gateway's key. Without validation
this would let anyone have arbitrary transactions paid for. *Fixed* with a
strict allow-list (`backend/src/sponsor.js`): the inner transaction must be a
non-fee-bumped transaction of at most two operations, each of which is either a
`changeTrust` for exactly our USDC asset, or an `invokeHostFunction` calling
**our** contract id with function `deposit` or `withdraw`. Everything else —
payments, foreign trustlines, foreign contracts, `collect`, `set_admin` — is
rejected. Covered by 5 unit tests, plus a per-IP limit of 20/hour.
*Residual:* an attacker can still cause ~0.0017 XLM of fee spend per
well-formed request within the rate limit; keep the sponsor wallet balance
bounded and alerted.

**G-3 — x402 settles before the completion (Medium, mitigated).** In the agent
door, the facilitator settles the USDC payment before the handler calls the
upstream model. If the upstream then fails, the caller has paid without
receiving a completion. *Mitigation in place:* the proxy falls through the
other enabled models on retryable upstream errors, so a single provider
rate-limit does not consume the payment. *Recommended:* on terminal upstream
failure, credit the payer's prepaid balance with the paid amount (a
compensating `deposit`), turning a lost payment into usable credit.
Note the prepaid door already has the safer ordering: it debits **after** a
successful completion.

**G-4 — Ephemeral stores (Medium, accepted on testnet).** API keys, usage logs
and feedback live in SQLite under `/tmp` on serverless, so they reset on cold
starts. This is an availability/record-keeping issue, not a confidentiality
one. *Required for mainnet:* a hosted database (Turso/Postgres); the store
modules already isolate this behind `KEYS_DB_PATH` / `LOGS_DB_PATH` /
`FEEDBACK_DB_PATH`.

**G-5 — Unsalted SHA-256 for API keys (Low, accepted).** API keys are
high-entropy random strings, not user-chosen passwords, so salting adds no
practical resistance against precomputation. Keys are never logged in full
(only a masked prefix). Ownership is proven by a SEP-10-style signed challenge
before issuance, so key issuance cannot be spoofed.

**G-6 — Permissive CORS (Low, accepted by design).** The gateway is a public
API intended to be called by arbitrary agents and browsers. It uses no cookies
or ambient session state; authorization is a bearer key or an x402 payment
header, so `*` does not create a CSRF surface.

### Console

Wallet interaction is delegated to Stellar Wallets Kit; the app never sees a
secret key. All transactions are signed in the wallet and submitted either by
the browser or, on the gasless path, by the gateway as a fee bump — where the
user remains the source account and the sole authorizer of the state change.
Network mismatch (wallet on PUBLIC vs. app on TESTNET) is detected and blocked
before signing. No user-supplied HTML is rendered.

## Pre-mainnet checklist

- [ ] Split admin roles: hot `debit` key vs. cold `collect`/`set_admin` key or multisig (**C-2**)
- [ ] Hosted database for keys/logs/feedback (**G-4**)
- [ ] Bounded, monitored balances on the sponsor and demo wallets (**G-1**, **G-2**)
- [ ] Alerting on `debit`, `collect`, `admin` and `paused` contract events
- [ ] Compensating-credit path for failed upstream after x402 settlement (**G-3**)
- [ ] TTL keeper for non-zero balances (**C-3**)
- [ ] Re-run `cargo test -p credits` (11 tests) and the gateway suite against the mainnet build
- [ ] Verify the deployed mainnet WASM hash matches a reproducible local build

## Test coverage backing this review

| Suite | Count | Covers |
|---|---|---|
| `cargo test -p credits` | 11 | full lifecycle, auth on debit/pause, over-withdraw, over-debit, over-collect, invalid amounts, admin rotation, pause semantics (withdraw stays open) |
| `bun test src` (gateway) | 9 | fee-sponsorship allow-list (5), network model policy (4) |
| `bun test src` (console) | 16 | stroop conversion, error taxonomy incl. contract error codes, event parsing |

## Mentor / team sign-off

| Field | Value |
|---|---|
| Reviewed by | _(mentor name)_ |
| Role | _(Stellar DevRel / mentor)_ |
| Date | |
| Verdict | ☐ Approved ☐ Approved with conditions ☐ Changes required |
| Notes | |

Contact for questions: the repository issue tracker —
<https://github.com/Lexirieru/stellarouter/issues>
