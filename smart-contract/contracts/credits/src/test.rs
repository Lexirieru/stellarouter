#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env,
};

struct Setup<'a> {
    env: Env,
    admin: Address,
    client: CreditsContractClient<'a>,
    contract_id: Address,
    token: TokenClient<'a>,
    token_mint: StellarAssetClient<'a>,
}

fn setup<'a>() -> Setup<'a> {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    // Register a Stellar Asset Contract to stand in for USDC.
    let sac = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_addr = sac.address();
    let token = TokenClient::new(&env, &token_addr);
    let token_mint = StellarAssetClient::new(&env, &token_addr);

    let contract_id = env.register(CreditsContract, (admin.clone(), token_addr.clone()));
    let client = CreditsContractClient::new(&env, &contract_id);

    Setup {
        env,
        admin,
        client,
        contract_id,
        token,
        token_mint,
    }
}

#[test]
fn test_full_lifecycle() {
    let s = setup();
    let user = Address::generate(&s.env);
    s.token_mint.mint(&user, &1_000);

    // deposit 600 USDC -> credit 600, tokens moved into the contract
    assert_eq!(s.client.deposit(&user, &600), 600);
    assert_eq!(s.client.balance(&user), 600);
    assert_eq!(s.token.balance(&user), 400);
    assert_eq!(s.token.balance(&s.contract_id), 600);

    // gateway debits 250 for API usage -> credit 350, treasury 250
    assert_eq!(s.client.debit(&user, &250), 350);
    assert_eq!(s.client.balance(&user), 350);
    assert_eq!(s.client.treasury(), 250);

    // user withdraws remaining 350 -> credit 0, USDC returned
    assert_eq!(s.client.withdraw(&user, &350), 0);
    assert_eq!(s.client.balance(&user), 0);
    assert_eq!(s.token.balance(&user), 750);
    assert_eq!(s.token.balance(&s.contract_id), 250); // only treasury left

    // admin sweeps treasury revenue
    let treasury_wallet = Address::generate(&s.env);
    assert_eq!(s.client.collect(&treasury_wallet, &250), 0);
    assert_eq!(s.client.treasury(), 0);
    assert_eq!(s.token.balance(&treasury_wallet), 250);
    assert_eq!(s.token.balance(&s.contract_id), 0);
}

#[test]
fn test_constructor_sets_state() {
    let s = setup();
    assert_eq!(s.client.admin(), s.admin);
    assert_eq!(s.client.treasury(), 0);
}

#[test]
fn test_deposit_accumulates() {
    let s = setup();
    let user = Address::generate(&s.env);
    s.token_mint.mint(&user, &1_000);

    s.client.deposit(&user, &300);
    s.client.deposit(&user, &200);
    assert_eq!(s.client.balance(&user), 500);
}

#[test]
fn test_debit_more_than_balance_fails() {
    let s = setup();
    let user = Address::generate(&s.env);
    s.token_mint.mint(&user, &1_000);
    s.client.deposit(&user, &100);

    let res = s.client.try_debit(&user, &101);
    assert_eq!(res, Err(Ok(Error::InsufficientCredit)));
}

#[test]
fn test_withdraw_more_than_balance_fails() {
    let s = setup();
    let user = Address::generate(&s.env);
    s.token_mint.mint(&user, &1_000);
    s.client.deposit(&user, &100);

    let res = s.client.try_withdraw(&user, &500);
    assert_eq!(res, Err(Ok(Error::InsufficientCredit)));
}

#[test]
fn test_collect_more_than_treasury_fails() {
    let s = setup();
    let to = Address::generate(&s.env);
    let res = s.client.try_collect(&to, &1);
    assert_eq!(res, Err(Ok(Error::InsufficientTreasury)));
}

#[test]
fn test_invalid_amounts_fail() {
    let s = setup();
    let user = Address::generate(&s.env);
    s.token_mint.mint(&user, &1_000);

    assert_eq!(s.client.try_deposit(&user, &0), Err(Ok(Error::InvalidAmount)));
    assert_eq!(
        s.client.try_deposit(&user, &-5),
        Err(Ok(Error::InvalidAmount))
    );
    assert_eq!(s.client.try_debit(&user, &0), Err(Ok(Error::InvalidAmount)));
}

#[test]
fn test_set_admin_rotates() {
    let s = setup();
    let new_admin = Address::generate(&s.env);
    s.client.set_admin(&new_admin);
    assert_eq!(s.client.admin(), new_admin);
}

#[test]
fn test_debit_requires_admin_auth() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_addr = sac.address();
    let contract_id = env.register(CreditsContract, (admin.clone(), token_addr.clone()));
    let client = CreditsContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    StellarAssetClient::new(&env, &token_addr).mint(&user, &1_000);

    // user-authorized deposit succeeds while auths are mocked
    client.deposit(&user, &500);

    // Clear all authorizations: a debit with no admin auth must be rejected.
    env.set_auths(&[]);
    let res = client.try_debit(&user, &100);
    assert!(res.is_err());
}
