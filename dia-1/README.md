# RWA Launchpad — Día 1

Starter scaffold for the Bolivia Stellar Soroban bootcamp. Today you set up your environment, run tests, build the contract, fund a testnet address, and complete your `stellar.toml` (SEP-1).

## Prerequisites

Install the following before the lab:

### 1. Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustc --version   # requires Rust 1.84.0 or higher
```

### 2. WASM target

```bash
rustup target add wasm32v1-none
```

### 3. Stellar CLI

Follow the official install guide: https://developers.stellar.org/docs/tools/cli/install-cli

Verify:

```bash
stellar --version
```

### 4. IDE

Any editor with the rust-analyzer extension works, for example VS Code.

## Payment token (instructor-provided)

For Día 3 you will invest using a **test payment token already deployed by instructors** — you do not mint your own payment asset. Your instructor will share the contract address; store it in `AssetInfo.payment_token` when you initialize.

## Run tests

From this directory (`dia-1/`):

```bash
cargo test
```

You should see `test_initialize` pass.

## Build the contract

```bash
stellar contract build
```

The compiled WASM is written to `target/wasm32v1-none/release/rwa_launchpad_dia_1.wasm`.

## Fund your testnet address (Friendbot)

Generate or import a keypair with the Stellar CLI, then fund it on testnet:

```bash
stellar keys generate alice --network testnet
stellar keys address alice
stellar keys fund alice --network testnet
```

Save this address — you will use it as admin on Día 2 and Día 3.

## Today's tasks

1. Run `cargo test` and `stellar contract build`.
2. Fund your testnet address with Friendbot.
3. Fill in `stellar.toml` with your issuer, asset name, backing description, and documentation fields.
4. Review the contract scaffold in `src/lib.rs` — only `initialize` is implemented; the rest is for Día 2.
5. With your team, choose your **variación** (access rule for investors) to implement on Día 2.

## Checkpoint

Before Día 2 you should have:

- [ ] Rust, wasm32 target, and Stellar CLI installed
- [ ] `cargo test` passing in `dia-1/`
- [ ] Contract WASM built successfully
- [ ] Testnet address funded
- [ ] `stellar.toml` draft completed
- [ ] Team variación chosen
