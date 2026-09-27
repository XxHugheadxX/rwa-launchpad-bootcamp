# RWA Launchpad Bolivia Stellar Soroban Bootcamp

## Entrega semana 4 — Stellar Elite Bolivia

**Objetivo:** desplegar en testnet un RWA Launchpad propio con una regla de inversión simple y
demostrar que funciona. La regla elegida es un **monto mínimo**: cada inversión debe ser de al
menos **500 unidades del token de pago**; si es menor, falla con el error nuevo `AmountTooLow`.

### Datos para la revisión

| | |
|---|---|
| Repo | https://github.com/XxHugheadxX/rwa-launchpad-bootcamp |
| **Contract ID** (testnet) | `CCU4MTTMV23RCABGK3QHG4XRIJIJUC67EK7XCXXUXHI6PJYTKB7NSJTF` |
| **Inversión exitosa de 500** | https://stellar.expert/explorer/testnet/tx/55cc1f65518551c872c926beebe9be00f3f4b16bfa1e91c48ba841ca6413d5a3 |
| Inversión de 100 | Rechazada por el contrato con `Error(Contract, #7)` `AmountTooLow` |
| Contrato en stellar.expert | https://stellar.expert/explorer/testnet/contract/CCU4MTTMV23RCABGK3QHG4XRIJIJUC67EK7XCXXUXHI6PJYTKB7NSJTF |
| Detalle completo | [`dia-3/ENTREGA.md`](dia-3/ENTREGA.md) |

### 1. La regla en el contrato

Archivo: [`dia-3/src/lib.rs`](dia-3/src/lib.rs).

- Error nuevo `AmountTooLow = 7` en el enum `Error`.
- Constante `MIN_INVESTMENT: i128 = 500`.
- `check_variation_gate` ahora recibe el monto de la inversión y lo compara con el mínimo:

```rust
fn check_variation_gate(env: &Env, investor: &Address, payment_amount: i128) -> Result<(), Error> {
    let _ = (env, investor);
    if payment_amount < MIN_INVESTMENT {
        return Err(Error::AmountTooLow);
    }
    Ok(())
}
```

Orden de validaciones en `invest`:

1. Contrato inicializado y firma del inversionista.
2. Monto `<= 0` → `InvalidAmount` (#4). Va antes del gate para que un monto inválido no se
   reporte como "demasiado bajo".
3. Monto `< 500` → `AmountTooLow` (#7).
4. Contrato en pausa → `Paused` (#6).
5. Inversionista fuera de la whitelist → `NotWhitelisted` (#5).
6. Cobro del token de pago y acuñación de `monto / price_per_unit` tokens RWA.

### 2. Tests

Archivo: [`dia-3/src/test.rs`](dia-3/src/test.rs). Se corren con `cd dia-3 && cargo test`.

| Test | Qué comprueba |
|---|---|
| `test_invest_below_minimum` | Invertir **100** falla con `Error(Contract, #7)` |
| `test_invest_at_minimum` | Invertir **500** funciona y acuña 5 RWA |
| `test_invest_below_minimum_returns_amount_too_low` | Con `try_invest`: el error es exactamente `AmountTooLow`, el intento fallido no mueve tokens ni acuña RWA, y a continuación 500 sí funciona |
| `test_invest`, `test_withdraw`, `test_invest_not_whitelisted` | Tests originales del bootcamp, siguen pasando |

Resultado: `test result: ok. 6 passed; 0 failed`.

### 3. Despliegue en testnet

Se desplegó el mismo wasm en dos instancias.

**a) Contrato de la demo** (el que se entrega), manejado desde el front con Freighter:

| | |
|---|---|
| Contract ID | `CCU4MTTMV23RCABGK3QHG4XRIJIJUC67EK7XCXXUXHI6PJYTKB7NSJTF` |
| Admin e inversionista | `GBZEPEUJ43GPVKC2LCPNJ3KSBI6OR2HFBZRMXZUL6KF22XZZEHXETI2J` (wallet de Freighter) |
| Token de pago | SAC de XLM nativo `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| Precio por unidad | 100 |

| Paso | Resultado | Transacción |
|---|---|---|
| `initialize` | OK | [0aa18bc0…](https://stellar.expert/explorer/testnet/tx/0aa18bc0ca08ac78693d7e816cdc543761f13ffeb307de3675852bc7ccb112f5) |
| `set_whitelist` | OK | [28a81af7…](https://stellar.expert/explorer/testnet/tx/28a81af7380153ed179a289108faa771b67a939bcf0b603cdce2cc00b5c534b6) |
| `invest` 100 | Rechazada, `AmountTooLow` (#7) | sin tx: falla en la simulación y no llega al ledger |
| `invest` 500 | OK, 5 RWA | [55cc1f65…](https://stellar.expert/explorer/testnet/tx/55cc1f65518551c872c926beebe9be00f3f4b16bfa1e91c48ba841ca6413d5a3) |
| `invest` 10000 | OK, 100 RWA | [497b8a89…](https://stellar.expert/explorer/testnet/tx/497b8a894d8b38327b84f0bdee0bb4e7279dd7b9a62e6b5fc0445005ca8dbb43) |

**b) Contrato de los scripts**, manejado con claves de la CLI (`elite-admin`, `elite-investor`)
y un token de pago propio (`PAGO`):

| | |
|---|---|
| Contract ID | `CBP2EIV53RRKFSOHSSNY4APZHIEQHBLQNRXYXVER2FKLX5PXSJWUB4SC` |
| Inversión de 500 | [404bf02c…](https://stellar.expert/explorer/testnet/tx/404bf02cb82664ca940046de69c814c1c25b8104f95e4eeead09edde8b5fdb33) |

### 4. Cómo probarlo

**Con los scripts** (contrato b), desde `dia-3/`:

```bash
./scripts/admin-tool.sh setup   # initialize + set_whitelist
./scripts/user-tool.sh demo     # invest 100 (falla con #7) -> invest 500 -> balance
```

Los scripts se dividieron en pasos (`initialize`, `whitelist`, `mint`, `withdraw`, `pause`,
`unpause`, `invest-low`, `invest`, `balance`, `transfer`). La versión original corría todo en
línea y no podía terminar: `withdraw` se ejecutaba antes de que hubiera fondos y abortaba por
`set -e`. `user-tool.sh demo` además verifica que la inversión de 100 falle; si pasara, el
script termina con error.

**Con el front** (contrato a), desde `frontend/dia-3/`:

```bash
pnpm install                  # o npm install
cp .env.example .env.local    # ya trae los ids del contrato de la demo
pnpm dev                      # http://localhost:3000
```

Con Freighter en Testnet: en `/admin` → Whitelist → **Approve**; en `/invest` probar 100 (muestra
el error #7 del contrato) y 500 (muestra la tx y el nuevo balance).

### 5. Cambios en el front (`frontend/`)

| Cambio | Por qué |
|---|---|
| `lib/errors.ts` reconoce `AmountTooLow` (#7) | El parser solo aceptaba los códigos 1 a 6, así que el error nuevo se mostraba como texto crudo del SDK. Ahora los códigos válidos salen del propio enum |
| `/invest` envía cualquier monto y muestra el error del contrato | Para que en la demo se vea al contrato rechazando la inversión de 100; el mínimo se indica en el texto y en el campo |
| `lib/stellar/contract.ts` toma `rpc` del mismo entry point que `TransactionBuilder` | En el navegador, `@stellar/stellar-sdk/rpc` cargaba una segunda copia del SDK y toda operación firmada fallaba con `expected a 'Transaction', got: [object Object]`. Venía en el código original |
| Rediseño visual de `dia-1`, `dia-2` y `dia-3` | Nuevos estilos y componentes (`Main`, `Button`, `Card`, `FormBits`, `Header`) |
| Soporte para pnpm (`pnpm-workspace.yaml`) | Con pnpm, `eslint-config-next` no encontraba sus plugins; ahora se hoistean. npm sigue funcionando |
| `.env.example` con los ids del contrato de la demo | El front arranca apuntando al contrato desplegado sin configurar nada |

Verificación de `frontend/dia-3`: `tsc --noEmit`, `pnpm lint` y `pnpm build` sin errores.
`frontend/dia-1` y `frontend/dia-2`: `tsc` y lint sin errores.

### 6. Token de pago y token RWA

- **Token de pago:** lo que paga el inversionista (en la demo, XLM). Vive en su propio contrato;
  en `invest` pasa de la wallet del inversionista al launchpad, y el admin lo retira con `withdraw`.
- **Token RWA:** lo que recibe el inversionista. Lo emite el launchpad y vive como saldo dentro
  del contrato (`balance`, `transfer`).
- Conversión: `RWA = monto / price_per_unit`; con precio 100, 500 → 5 RWA.
- Unidades: el contrato cuenta en la unidad mínima del token. Con XLM, 500 unidades son 500
  stroops = **0.00005 XLM** (1 XLM = 10.000.000 stroops).

### 7. Observaciones conocidas

- La división `monto / price_per_unit` descarta el resto pero cobra el monto completo: invertir
  550 da 5 RWA y los 50 restantes no se devuelven. Es el comportamiento del código base del
  bootcamp y no se modificó.
- `frontend/dia-1` y `frontend/dia-2` todavía tienen el bug del doble import del SDK; se corrigió
  solo en `dia-3`, que es el que usa la demo.
- No se corrió `next build` en `frontend/dia-1` ni en `frontend/dia-2`; su CSS y su configuración
  de Tailwind son idénticos a los de `dia-3`, que sí buildea.

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
