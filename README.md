# RWA Launchpad Bolivia Stellar Soroban Bootcamp

## Entrega semana 4 — Stellar Elite Bolivia

Regla agregada en `check_variation_gate`: cada inversión debe ser de al menos **500 unidades**
del token de pago; por debajo falla con el error nuevo `AmountTooLow` (`#7`).

| | |
|---|---|
| **Contract ID** (testnet) | `CCU4MTTMV23RCABGK3QHG4XRIJIJUC67EK7XCXXUXHI6PJYTKB7NSJTF` |
| **Inversión exitosa de 500** | https://stellar.expert/explorer/testnet/tx/55cc1f65518551c872c926beebe9be00f3f4b16bfa1e91c48ba841ca6413d5a3 |
| Inversión de 100 | Rechazada con `Error(Contract, #7)` `AmountTooLow` |
| Contrato | [`dia-3/src/lib.rs`](dia-3/src/lib.rs) · tests en [`dia-3/src/test.rs`](dia-3/src/test.rs) |
| Front de la demo | [`frontend/dia-3/`](frontend/dia-3/) |

Detalle completo (todas las transacciones, salida de tests y de los scripts, cómo reproducirlo):
[`dia-3/ENTREGA.md`](dia-3/ENTREGA.md).

---

Hands-on starter repository for the Oppia Education Bolivia bootcamp. Over three days every team builds the **same RWA Launchpad** smart contract, adding one SEP layer per day. Admin operations (mint, whitelist, withdraw, pause) and user operations (invest, balance, transfer) are kept distinct on purpose — that split carries through to deploy scripts on Día 3.

## Prerequisites

- Rust 1.84+ with `wasm32v1-none` target
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli/install-cli)
- A code editor with rust-analyzer
- Testnet account funded via Friendbot (Día 1)

## How the three days build on each other

| Day | Folder | SEP focus | What you add |
|-----|--------|-----------|--------------|
| **Día 1** | [`dia-1/`](dia-1/) | SEP-1 — asset identity | Environment setup, `stellar.toml`, contract scaffold (`initialize` only), run tests & build |
| **Día 2** | [`dia-2/`](dia-2/) | SEP-41 — token interface | `balance`, `mint`, `transfer`, `set_whitelist`, `Error` enum, events, auth; find the planted bug; implement your **variación** in `check_variation_gate` |
| **Día 3** | [`dia-3/`](dia-3/) | SEP-10/45 + deploy | `invest`, `withdraw`, deploy to testnet, `admin-tool.sh` / `user-tool.sh`, 3-minute demo |

Each day is a **separate crate** (copy-forward, not symlinks). Start in `dia-1/`; on Día 2 open `dia-2/` which extends the resolved Día 1 scaffold; on Día 3 open `dia-3/` which extends your completed Día 2 contract.

## Payment token

Investments use an **instructor-deployed test payment token** on testnet — not a token your team deploys. Your instructor shares the contract address; set it in `AssetInfo.payment_token` at initialization.

## Quick start

```bash
cd dia-1
cargo test
stellar contract build
```

See each day's README for detailed setup (Friendbot funding, SEP-1 fields, bug exercise, deploy steps).

## Variación (team twist)

On Día 1 each team picks an access rule for investors, for example:

- Verified investor pass before investing
- Minimum balance of another asset
- Limited investment slots with a public message

Implement the rule in `check_variation_gate` (Día 2). Día 3's `invest()` calls that gate before minting.

## Final deliverable

1. Working contract on testnet (from `dia-3/`)
2. Three-minute demo — follow [`dia-3/DEMO.md`](dia-3/DEMO.md)
