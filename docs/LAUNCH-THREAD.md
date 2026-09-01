# Launch thread (X/Twitter) — draft

Two variants. **Variant A** is accurate today (testnet live, mainnet pending).
**Variant B** is for the moment step 1 of the [mainnet runbook](./MAINNET-RUNBOOK.md)
is done — fill in the mainnet contract id before posting.

Tag suggestions: `@StellarOrg` `@BuildOnStellar` `@RiseInWeb3` `@OpenZeppelin`
· hashtags `#Stellar` `#Soroban` `#x402` `#AIagents`

---

## Variant A — "built in public" (accurate right now)

**1/**
OpenRouter, but the bill is on-chain. 🧵

Stellarouter is an LLM gateway on @StellarOrg where AI agents pay per call in
USDC — and humans prepay into a Soroban vault they can withdraw from at any
time.

Live: stellarouter.vercel.app

**2/**
Two doors, one gateway:

🤖 Agents → x402. Request → 402 → pay $0.005 USDC → completion.
No account. No API key. **Zero XLM** — fees are sponsored by the @OpenZeppelin
Channels facilitator.

👤 Humans → prepaid credits, except the balance lives in a smart contract.

**3/**
Why that matters: every gateway credit you have ever bought is a row in
someone's database.

Here, `deposit` / `debit` / `withdraw` each emit a public contract event. Your
bill is auditable on the explorer, and `withdraw()` returns unused USDC
whenever you want. The operator can only debit usage — never your remainder.

**4/**
New this week: **gasless top-ups** ⛽️

You sign; the gateway wraps it in a fee-bump (CAP-15) and pays the network fee.
Verified on-chain — user XLM delta 0.0000000, `fee_account` = sponsor:
stellar.expert/explorer/testnet/tx/413c5535614b3490b98ecb72f6e1c53abfbd8994db901a7f46ee0e5294255c10

**5/**
The non-obvious part of fee sponsorship is that a naive /sponsor endpoint is a
faucet for your own wallet.

Allow-list per **contract AND function** — we refuse even our own `collect` and
`set_admin`. Wrote it up with the code + tests:
github.com/Lexirieru/stellarouter/blob/main/docs/blog/fee-sponsorship-on-stellar.md

**6/**
Where it stands on testnet:
📊 54 wallets onboarded
🔗 280+ signed on-chain transactions
💰 110 USDC deposited · 21.8 USDC in gateway revenue
🧪 36 tests · CI/CD · security review published

Analytics recomputes all of it live from contract events.

**7/**
Everything is open source (MIT) — contract, gateway, console, runbooks:
github.com/Lexirieru/stellarouter

Mainnet next. If you build agents that need to pay for things, I would love to
have you break this. 🙏
#Stellar #Soroban #x402

---

## Variant B — mainnet launch (post after deploying)

**1/**
Stellarouter is live on @StellarOrg **mainnet** 🚀

An LLM gateway where AI agents pay per call in USDC via x402 — and humans
prepay into a Soroban vault whose every charge is a public, auditable event.

App: stellarouter.vercel.app
Contract: `<MAINNET_CONTRACT_ID>`

**2/**
What makes it different from every other AI gateway: your balance is not a row
in my database. It is a contract entry you can audit — and `withdraw()` back to
your wallet at any time.

I can debit usage. I cannot touch the rest. That boundary is enforced on-chain.

**3/**
🤖 For agents: no account, no API key, **zero XLM**. Request → 402 → pay $0.005
USDC → completion, settled in ~5s (fees sponsored via @OpenZeppelin Channels).

👤 For humans: connect a wallet, top up — **gasless**, because the gateway
fee-bumps your transaction and pays the fee.

**4/**
Before launch I published a full security review — 9 findings, 2 high-severity
gateway issues found and fixed during the review, plus the solvency invariant
and a pre-mainnet checklist:
github.com/Lexirieru/stellarouter/blob/main/docs/SECURITY-REVIEW.md

**5/**
Open source, MIT, with a mainnet runbook so you can do the same:
github.com/Lexirieru/stellarouter

Built through @RiseInWeb3's Stellar Journey to Mastery 🥋
#Stellar #Soroban #x402 #AIagents

---

## Showcase content to attach

- Post 1: the 1:39 walkthrough video (`docs/demo/stellarouter-demo.mp4`)
- Post 4: the terminal screenshot of the sponsorship verification, or `docs/screenshots/analytics.png`
- Post 6: `docs/screenshots/analytics.png`
