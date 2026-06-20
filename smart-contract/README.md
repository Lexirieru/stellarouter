# Stellarouter — Smart Contracts (Soroban)

On-chain components for the Stellarouter LLM gateway.

## Structure

```text
.
├── contracts
│   └── credits          # Prepaid USDC credit vault
│       ├── src
│       │   ├── lib.rs
│       │   └── test.rs
│       └── Cargo.toml
├── Cargo.toml           # workspace
├── .env / .env.example  # deployer key + network config (.env is gitignored)
└── README.md
```

## `credits` — Prepaid USDC Credit Vault

The on-chain credit ledger for the gateway (billing **Model A: prepaid credit**, à la
OpenRouter). USDC is handled as a SAC token (7 decimals; amounts are in stroops,
1 USDC = 10_000_000).

| Function | Auth | Description |
|----------|------|-------------|
| `__constructor(admin, token)` | — | Set the gateway operator and the USDC SAC address (runs once at deploy). |
| `deposit(from, amount)` | `from` | User/agent deposits USDC, receives API credit 1:1. |
| `debit(user, amount)` | `admin` | Gateway charges a user's credit for API usage; funds become treasury revenue. |
| `withdraw(user, amount)` | `user` | User reclaims unused credit back to their wallet as USDC. |
| `collect(to, amount)` | `admin` | Admin sweeps accumulated treasury revenue. |
| `set_admin(new_admin)` | `admin` | Rotate the gateway operator key. |
| `balance(user)` / `treasury()` / `admin()` / `token()` | — | Views. |

Security: explicit `require_auth` on every privileged path, checked arithmetic,
typed storage keys, one-shot constructor, proactive TTL extension.

## Develop

```bash
# Test (native, fast)
cargo test -p credits

# Build the optimized WASM
stellar contract build
# → target/wasm32v1-none/release/credits.wasm
```

### Deploy to testnet

```bash
# USDC SAC on testnet (Circle): CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
stellar contract deploy \
  --wasm target/wasm32v1-none/release/credits.wasm \
  --source stellarouter-deployer \
  --network testnet \
  -- \
  --admin stellarouter-deployer \
  --token CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
```
