#![no_std]
//! Stellarouter — Prepaid USDC Credit Vault.
//!
//! On-chain credit ledger for the Stellarouter LLM gateway. Agents/users deposit
//! USDC (a SAC token) and receive API credit 1:1. The gateway (admin) debits credit
//! per API call; debited funds accumulate as treasury revenue. Users can withdraw
//! unused credit; the admin can sweep treasury revenue out.
//!
//! USDC on Stellar uses 7 decimals, so `amount` is in stroops of the asset
//! (1 USDC = 10_000_000).

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env,
};

// ─── TTL constants (~5s ledgers) ────────────────────────────────────────────
const DAY_IN_LEDGERS: u32 = 17_280;
const INSTANCE_BUMP: u32 = 30 * DAY_IN_LEDGERS;
const INSTANCE_THRESHOLD: u32 = INSTANCE_BUMP - DAY_IN_LEDGERS;
const BALANCE_BUMP: u32 = 30 * DAY_IN_LEDGERS;
const BALANCE_THRESHOLD: u32 = BALANCE_BUMP - DAY_IN_LEDGERS;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    Treasury,
    Balance(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    InvalidAmount = 1,
    InsufficientCredit = 2,
    InsufficientTreasury = 3,
    Overflow = 4,
}

#[contract]
pub struct CreditsContract;

#[contractimpl]
impl CreditsContract {
    /// Initialize once at deploy time (Protocol 22+ constructor — cannot be re-run).
    pub fn __constructor(env: Env, admin: Address, token: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Treasury, &0i128);
    }

    /// Agent/user deposits USDC and receives API credit 1:1. Returns the new credit balance.
    pub fn deposit(env: Env, from: Address, amount: i128) -> Result<i128, Error> {
        from.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Pull USDC from the user into the contract.
        let token = read_token(&env);
        token::Client::new(&env, &token).transfer(
            &from,
            &env.current_contract_address(),
            &amount,
        );

        let new_balance = read_balance(&env, &from)
            .checked_add(amount)
            .ok_or(Error::Overflow)?;
        write_balance(&env, &from, new_balance);

        bump_instance(&env);
        env.events()
            .publish((symbol_short!("deposit"), from), amount);
        Ok(new_balance)
    }

    /// Gateway (admin) charges a user's credit for API usage. Charged funds become
    /// treasury revenue (they stay in the contract). Returns the user's new balance.
    pub fn debit(env: Env, user: Address, amount: i128) -> Result<i128, Error> {
        require_admin(&env);
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let balance = read_balance(&env, &user);
        if balance < amount {
            return Err(Error::InsufficientCredit);
        }
        let new_balance = balance - amount;
        write_balance(&env, &user, new_balance);

        let treasury = read_treasury(&env)
            .checked_add(amount)
            .ok_or(Error::Overflow)?;
        env.storage().instance().set(&DataKey::Treasury, &treasury);

        bump_instance(&env);
        env.events().publish((symbol_short!("debit"), user), amount);
        Ok(new_balance)
    }

    /// User reclaims unused credit back to their wallet as USDC. Returns new balance.
    pub fn withdraw(env: Env, user: Address, amount: i128) -> Result<i128, Error> {
        user.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let balance = read_balance(&env, &user);
        if balance < amount {
            return Err(Error::InsufficientCredit);
        }
        let new_balance = balance - amount;
        write_balance(&env, &user, new_balance);

        let token = read_token(&env);
        token::Client::new(&env, &token).transfer(
            &env.current_contract_address(),
            &user,
            &amount,
        );

        env.events()
            .publish((symbol_short!("withdraw"), user), amount);
        Ok(new_balance)
    }

    /// Admin sweeps accumulated treasury revenue to a wallet. Returns remaining treasury.
    pub fn collect(env: Env, to: Address, amount: i128) -> Result<i128, Error> {
        require_admin(&env);
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let treasury = read_treasury(&env);
        if treasury < amount {
            return Err(Error::InsufficientTreasury);
        }
        let new_treasury = treasury - amount;
        env.storage().instance().set(&DataKey::Treasury, &new_treasury);

        let token = read_token(&env);
        token::Client::new(&env, &token).transfer(
            &env.current_contract_address(),
            &to,
            &amount,
        );

        bump_instance(&env);
        env.events().publish((symbol_short!("collect"), to), amount);
        Ok(new_treasury)
    }

    /// Rotate the admin (gateway operator) key.
    pub fn set_admin(env: Env, new_admin: Address) {
        require_admin(&env);
        env.storage().instance().set(&DataKey::Admin, &new_admin);
    }

    // ─── Views ──────────────────────────────────────────────────────────────
    pub fn balance(env: Env, user: Address) -> i128 {
        read_balance(&env, &user)
    }

    pub fn treasury(env: Env) -> i128 {
        read_treasury(&env)
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn token(env: Env) -> Address {
        read_token(&env)
    }
}

// ─── Internal helpers (not exported as contract functions) ──────────────────
fn require_admin(env: &Env) {
    let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
    admin.require_auth();
}

fn read_token(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Token).unwrap()
}

fn read_treasury(env: &Env) -> i128 {
    env.storage().instance().get(&DataKey::Treasury).unwrap_or(0)
}

fn read_balance(env: &Env, user: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::Balance(user.clone()))
        .unwrap_or(0)
}

fn write_balance(env: &Env, user: &Address, amount: i128) {
    let key = DataKey::Balance(user.clone());
    env.storage().persistent().set(&key, &amount);
    env.storage()
        .persistent()
        .extend_ttl(&key, BALANCE_THRESHOLD, BALANCE_BUMP);
}

fn bump_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_THRESHOLD, INSTANCE_BUMP);
}

mod test;
