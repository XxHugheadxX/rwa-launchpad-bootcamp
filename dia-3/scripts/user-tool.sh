#!/usr/bin/env bash
# User tool — invocations signed by the investor / token holder.
#
# Uso: ./scripts/user-tool.sh [paso]
#   demo         invest 100 (debe fallar con AmountTooLow) -> invest 500 -> balance
#   invest-low | invest | balance | transfer
# Sin argumento corre "demo".

set -euo pipefail

NETWORK="${NETWORK:-testnet}"
USER_KEY="${USER_KEY:-elite-investor}"
CONTRACT_ID="${CONTRACT_ID:-CBP2EIV53RRKFSOHSSNY4APZHIEQHBLQNRXYXVER2FKLX5PXSJWUB4SC}"
RECIPIENT="${RECIPIENT:-GAJVFEEYVTYEYKECCMNO2WESXWKTEXP3JUHX7T2YPORNISE2WQEIJYZV}"

USER_ADDRESS="$(stellar keys address "$USER_KEY")"

invoke() {
  stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source "$USER_KEY" \
    --network "$NETWORK" \
    -- "$@"
}

step_invest_low() {
  echo "=== invest 100 (debe fallar: minimo 500) ==="
  if invoke invest --investor "$USER_ADDRESS" --payment_amount 100; then
    echo "!! la inversion de 100 NO fallo: la regla del minimo no esta activa" >&2
    return 1
  fi
  echo "-> rechazada como se esperaba (Error #7 AmountTooLow)"
}

step_invest() {
  echo "=== invest 500 (minimo permitido) ==="
  invoke invest --investor "$USER_ADDRESS" --payment_amount 500
}

step_balance() {
  echo "=== balance ==="
  invoke balance --id "$USER_ADDRESS"
}

step_transfer() {
  echo "=== transfer RWA tokens ==="
  invoke transfer --from "$USER_ADDRESS" --to "$RECIPIENT" --amount 1
}

case "${1:-demo}" in
  demo)       step_invest_low; step_invest; step_balance ;;
  invest-low) step_invest_low ;;
  invest)     step_invest ;;
  balance)    step_balance ;;
  transfer)   step_transfer ;;
  *) echo "paso desconocido: $1" >&2; exit 1 ;;
esac
