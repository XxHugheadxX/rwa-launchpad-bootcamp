#![no_std]
use soroban_sdk::{
    auth::{ContractContext, InvokerContractAuthEntry, SubContractInvocation},
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, token,
    Address, Env, IntoVal, Symbol, Vec, vec,
};

#[contracttype]
pub enum DataKey {
    Admin,
    AssetInfo,
    Balance(Address),
    Whitelisted(Address),
}

#[contracttype]
pub struct AssetInfo {
    pub name: Symbol,
    pub total_supply: i128,
    pub price_per_unit: i128,
    pub payment_token: Address,
    pub paused: bool,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    InsufficientBalance = 3,
    InvalidAmount = 4,
    NotWhitelisted = 5,
    Paused = 6,
    AmountTooLow = 7,
}

/// Minimo de unidades del token de pago que exige cada inversion.
pub const MIN_INVESTMENT: i128 = 500;

#[contract]
pub struct RwaLaunchpad;

impl RwaLaunchpad {
    fn require_initialized(env: &Env) {
        if !env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(env, Error::NotInitialized);
        }
    }

    fn require_not_paused(env: &Env) {
        let asset: AssetInfo = env
            .storage()
            .instance()
            .get(&DataKey::AssetInfo)
            .unwrap();
        if asset.paused {
            panic_with_error!(env, Error::Paused);
        }
    }

    fn read_balance(env: &Env, id: &Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(id.clone()))
            .unwrap_or(0)
    }

    fn write_balance(env: &Env, id: &Address, amount: i128) {
        env.storage()
            .persistent()
            .set(&DataKey::Balance(id.clone()), &amount);
    }

    fn is_whitelisted(env: &Env, investor: &Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Whitelisted(investor.clone()))
            .unwrap_or(false)
    }

    // Variación: cada inversión debe ser de al menos MIN_INVESTMENT unidades
    // del token de pago. Por debajo de ese monto la inversión se rechaza.
    fn check_variation_gate(
        env: &Env,
        investor: &Address,
        payment_amount: i128,
    ) -> Result<(), Error> {
        let _ = (env, investor);
        if payment_amount < MIN_INVESTMENT {
            return Err(Error::AmountTooLow);
        }
        Ok(())
    }

    fn internal_mint(env: &Env, to: &Address, amount: i128) {
        let current = Self::read_balance(env, to);
        Self::write_balance(env, to, current + amount);
    }
}

#[contractimpl]
impl RwaLaunchpad {
    pub fn initialize(env: Env, admin: Address, asset: AssetInfo) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::AssetInfo, &asset);
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        Self::require_initialized(&env);
        Self::read_balance(&env, &id)
    }

    pub fn mint(env: Env, admin: Address, to: Address, amount: i128) {
        Self::require_initialized(&env);
        admin.require_auth();
        Self::require_not_paused(&env);
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        Self::internal_mint(&env, &to, amount);
        env.events()
            .publish((symbol_short!("mint"),), (to, amount));
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        Self::require_initialized(&env);
        from.require_auth();
        Self::require_not_paused(&env);
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let from_balance = Self::read_balance(&env, &from);
        if from_balance < amount {
            panic_with_error!(&env, Error::InsufficientBalance);
        }

        Self::write_balance(&env, &from, from_balance - amount);
        let to_balance = Self::read_balance(&env, &to);
        Self::write_balance(&env, &to, to_balance + amount);
        env.events()
            .publish((symbol_short!("transfer"),), (from, to, amount));
    }

    pub fn set_whitelist(env: Env, admin: Address, investor: Address, approved: bool) {
        Self::require_initialized(&env);
        admin.require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::Whitelisted(investor), &approved);
    }

    pub fn pause(env: Env, admin: Address) {
        Self::require_initialized(&env);
        admin.require_auth();
        let mut asset: AssetInfo = env
            .storage()
            .instance()
            .get(&DataKey::AssetInfo)
            .unwrap();
        asset.paused = true;
        env.storage().instance().set(&DataKey::AssetInfo, &asset);
    }

    pub fn unpause(env: Env, admin: Address) {
        Self::require_initialized(&env);
        admin.require_auth();
        let mut asset: AssetInfo = env
            .storage()
            .instance()
            .get(&DataKey::AssetInfo)
            .unwrap();
        asset.paused = false;
        env.storage().instance().set(&DataKey::AssetInfo, &asset);
    }

    pub fn invest(env: Env, investor: Address, payment_amount: i128) -> i128 {
        Self::require_initialized(&env);
        investor.require_auth();
        if payment_amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }
        if let Err(err) = Self::check_variation_gate(&env, &investor, payment_amount) {
            panic_with_error!(&env, err);
        }
        Self::require_not_paused(&env);

        if !Self::is_whitelisted(&env, &investor) {
            panic_with_error!(&env, Error::NotWhitelisted);
        }

        let asset: AssetInfo = env
            .storage()
            .instance()
            .get(&DataKey::AssetInfo)
            .unwrap();
        if asset.price_per_unit <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let rwa_amount = payment_amount / asset.price_per_unit;
        if rwa_amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let token_client = token::Client::new(&env, &asset.payment_token);
        token_client.transfer(
            &investor,
            &env.current_contract_address(),
            &payment_amount,
        );

        Self::internal_mint(&env, &investor, rwa_amount);
        env.events().publish(
            (symbol_short!("invest"),),
            (investor.clone(), payment_amount, rwa_amount),
        );

        rwa_amount
    }

    pub fn withdraw(env: Env, admin: Address, to: Address, amount: i128) {
        Self::require_initialized(&env);
        admin.require_auth();
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let asset: AssetInfo = env
            .storage()
            .instance()
            .get(&DataKey::AssetInfo)
            .unwrap();
        let contract = env.current_contract_address();
        let token_address = asset.payment_token.clone();

        let auth = InvokerContractAuthEntry::Contract(SubContractInvocation {
            context: ContractContext {
                contract: token_address.clone(),
                fn_name: symbol_short!("transfer"),
                args: (contract.clone(), to.clone(), amount).into_val(&env),
            },
            sub_invocations: Vec::<InvokerContractAuthEntry>::new(&env),
        });
        env.authorize_as_current_contract(vec![&env, auth]);

        token::Client::new(&env, &token_address).transfer(&contract, &to, &amount);
    }
}

#[cfg(test)]
mod test;
