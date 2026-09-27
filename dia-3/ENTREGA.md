# Entrega semana 4 — RWA Launchpad con monto mínimo de inversión

## Qué se agregó

Regla de variación en `check_variation_gate` (`src/lib.rs`): **cada inversión debe ser de al
menos 500 unidades del token de pago**. Por debajo de ese monto `invest` falla con el error
nuevo `AmountTooLow` (código de contrato `#7`).

```rust
pub const MIN_INVESTMENT: i128 = 500;

fn check_variation_gate(env: &Env, investor: &Address, payment_amount: i128) -> Result<(), Error> {
    let _ = (env, investor);
    if payment_amount < MIN_INVESTMENT {
        return Err(Error::AmountTooLow);
    }
    Ok(())
}
```

El gate recibe ahora el monto y se evalúa en `invest` después de validar que el monto sea
positivo, de modo que un monto `<= 0` sigue devolviendo `InvalidAmount` y solo los montos
positivos por debajo de 500 devuelven `AmountTooLow`.

## Datos para la entrega

| | |
|---|---|
| Repo | https://github.com/XxHugheadxX/rwa-launchpad-bootcamp/tree/main/dia-3 |
| **Contract ID** | `CCU4MTTMV23RCABGK3QHG4XRIJIJUC67EK7XCXXUXHI6PJYTKB7NSJTF` |
| **Inversión exitosa de 500** | https://stellar.expert/explorer/testnet/tx/55cc1f65518551c872c926beebe9be00f3f4b16bfa1e91c48ba841ca6413d5a3 |

## Despliegue de la demo (testnet, desde el front con Freighter)

| Elemento | Valor |
|---|---|
| Contract ID | `CCU4MTTMV23RCABGK3QHG4XRIJIJUC67EK7XCXXUXHI6PJYTKB7NSJTF` |
| Admin e inversionista (Freighter) | `GBZEPEUJ43GPVKC2LCPNJ3KSBI6OR2HFBZRMXZUL6KF22XZZEHXETI2J` |
| Token de pago (SAC de XLM nativo) | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| Precio por unidad | 100 |

Flujo hecho desde `frontend/dia-3`:

| Paso | Resultado | Transacción |
|---|---|---|
| `initialize` (admin = wallet de Freighter) | OK | https://stellar.expert/explorer/testnet/tx/0aa18bc0ca08ac78693d7e816cdc543761f13ffeb307de3675852bc7ccb112f5 |
| `set_whitelist` del inversionista | OK | https://stellar.expert/explorer/testnet/tx/28a81af7380153ed179a289108faa771b67a939bcf0b603cdce2cc00b5c534b6 |
| `invest` 100 | Rechazada: `Error(Contract, #7)` `AmountTooLow` | sin tx: falla en la simulación y no llega al ledger |
| `invest` 500 | OK, 5 RWA | https://stellar.expert/explorer/testnet/tx/55cc1f65518551c872c926beebe9be00f3f4b16bfa1e91c48ba841ca6413d5a3 |
| `invest` 10000 | OK, 100 RWA | https://stellar.expert/explorer/testnet/tx/497b8a894d8b38327b84f0bdee0bb4e7279dd7b9a62e6b5fc0445005ca8dbb43 |

Contrato en stellar.expert:
https://stellar.expert/explorer/testnet/contract/CCU4MTTMV23RCABGK3QHG4XRIJIJUC67EK7XCXXUXHI6PJYTKB7NSJTF

## Despliegue con los scripts de admin y usuario (testnet, CLI)

El mismo wasm se desplegó primero en otra instancia manejada con claves de la CLI, que es la que
usan por defecto `scripts/admin-tool.sh` y `scripts/user-tool.sh`.

| Elemento | Valor |
|---|---|
| Contract ID | `CBP2EIV53RRKFSOHSSNY4APZHIEQHBLQNRXYXVER2FKLX5PXSJWUB4SC` |
| Token de pago (SAC `PAGO`) | `CACR6IIUQ32FSPNWQG55BT6X77VSBUUQ7ZA3GJFMZ42ZMXJ2TFBIZMES` |
| Admin (`elite-admin`) | `GAJVFEEYVTYEYKECCMNO2WESXWKTEXP3JUHX7T2YPORNISE2WQEIJYZV` |
| Inversionista (`elite-investor`) | `GAKNII4YSRH4HWSVM3LH2E535IRADOZZQO3BFCIGLR6OWTSTU26PVIDJ` |
| Precio por unidad | 100 |

- `initialize`: https://stellar.expert/explorer/testnet/tx/d5b093d6bec33abfba04df7e746fe57960f466ade2e64f06202259088a9bb062
- `set_whitelist`: https://stellar.expert/explorer/testnet/tx/5c8dcb5920cc8b34b1045643c603dbafaaa9e965235e9a93a6dc0c31bdc6ce74
- Inversión de 500: https://stellar.expert/explorer/testnet/tx/404bf02cb82664ca940046de69c814c1c25b8104f95e4eeead09edde8b5fdb33

## Tests

```
cargo test
```

```
running 6 tests
test test::test_invest_not_whitelisted - should panic ... ok
test test::test_invest_below_minimum - should panic ... ok
test test::test_invest ... ok
test test::test_invest_at_minimum ... ok
test test::test_withdraw ... ok
test test::test_invest_below_minimum_returns_amount_too_low ... ok

test result: ok. 6 passed; 0 failed
```

Los tests nuevos están en `src/test.rs`:

- `test_invest_below_minimum` — invertir 100 hace panic con `Error(Contract, #7)`.
- `test_invest_at_minimum` — invertir 500 acuña 5 unidades de RWA.
- `test_invest_below_minimum_returns_amount_too_low` — comprueba con `try_invest` que el error
  sea exactamente `AmountTooLow`, que el intento fallido no mueva tokens ni acuñe RWA, y que
  la inversión de 500 a continuación sí funcione.

## Flujo completo en testnet con los scripts

### Admin

```
./scripts/admin-tool.sh setup      # initialize + set_whitelist
```

```
=== initialize (run once after deploy) ===
✅ Transaction submitted successfully!
🔗 https://stellar.expert/explorer/testnet/tx/d5b093d6bec33abfba04df7e746fe57960f466ade2e64f06202259088a9bb062

=== set_whitelist ===
✅ Transaction submitted successfully!
🔗 https://stellar.expert/explorer/testnet/tx/5c8dcb5920cc8b34b1045643c603dbafaaa9e965235e9a93a6dc0c31bdc6ce74
```

### Inversionista

```
./scripts/user-tool.sh demo        # invest 100 (falla) -> invest 500 -> balance
```

```
=== invest 100 (debe fallar: minimo 500) ===
❌ error: transaction simulation failed: HostError: Error(Contract, #7)

Event log (newest first):
   0: [Diagnostic Event] contract:CBP2EIV53RRKFSOHSSNY4APZHIEQHBLQNRXYXVER2FKLX5PXSJWUB4SC, topics:[error, Error(Contract, #7)], data:"escalating error to VM trap from failed host function call: fail_with_error"
   1: [Diagnostic Event] contract:CBP2EIV53RRKFSOHSSNY4APZHIEQHBLQNRXYXVER2FKLX5PXSJWUB4SC, topics:[error, Error(Contract, #7)], data:["failing with contract error", 7]
   2: [Diagnostic Event] topics:[fn_call, CBP2EIV53RRKFSOHSSNY4APZHIEQHBLQNRXYXVER2FKLX5PXSJWUB4SC, invest], data:[GAKNII4YSRH4HWSVM3LH2E535IRADOZZQO3BFCIGLR6OWTSTU26PVIDJ, 100]

-> rechazada como se esperaba (Error #7 AmountTooLow)

=== invest 500 (minimo permitido) ===
✅ Transaction submitted successfully!
🔗 https://stellar.expert/explorer/testnet/tx/404bf02cb82664ca940046de69c814c1c25b8104f95e4eeead09edde8b5fdb33
📅 Event: [{"symbol":"invest"}] = {"vec":[{"address":"GAKNII4YSRH4HWSVM3LH2E535IRADOZZQO3BFCIGLR6OWTSTU26PVIDJ"},{"i128":"500"},{"i128":"5"}]}
"5"

=== balance ===
"5"
```

## Cómo reproducirlo desde cero

```bash
cd dia-3
cargo test
stellar contract build

# cuentas
stellar keys generate elite-admin --fund --network testnet
stellar keys generate elite-investor --fund --network testnet

# token de pago
stellar contract asset deploy --asset "PAGO:$(stellar keys address elite-admin)" \
  --source elite-admin --network testnet
stellar tx new change-trust --source elite-investor --network testnet \
  --line "PAGO:$(stellar keys address elite-admin)"
stellar contract invoke --id <PAYMENT_TOKEN> --source elite-admin --network testnet \
  -- mint --to "$(stellar keys address elite-investor)" --amount 5000

# launchpad
stellar contract deploy --wasm target/wasm32v1-none/release/rwa_launchpad_dia_3.wasm \
  --source elite-admin --network testnet

# flujo
CONTRACT_ID=<CONTRACT_ID> ./scripts/admin-tool.sh setup
CONTRACT_ID=<CONTRACT_ID> ./scripts/user-tool.sh demo
```
