#!/usr/bin/env bash
# Admin tool — invocations that require the issuer/admin key to sign.
#
# Uso: ./scripts/admin-tool.sh [paso]
#   setup      initialize + set_whitelist (flujo de la entrega)
#   initialize | whitelist | mint | withdraw | pause | unpause
# Sin argumento corre "setup".

set -euo pipefail

NETWORK="${NETWORK:-testnet}"
ADMIN_KEY="${ADMIN_KEY:-elite-admin}"
CONTRACT_ID="${CONTRACT_ID:-CBP2EIV53RRKFSOHSSNY4APZHIEQHBLQNRXYXVER2FKLX5PXSJWUB4SC}"
PAYMENT_TOKEN="${PAYMENT_TOKEN:-CACR6IIUQ32FSPNWQG55BT6X77VSBUUQ7ZA3GJFMZ42ZMXJ2TFBIZMES}"
INVESTOR="${INVESTOR:-GAKNII4YSRH4HWSVM3LH2E535IRADOZZQO3BFCIGLR6OWTSTU26PVIDJ}"
TREASURY="${TREASURY:-GAJVFEEYVTYEYKECCMNO2WESXWKTEXP3JUHX7T2YPORNISE2WQEIJYZV}"

ADMIN_ADDRESS="$(stellar keys address "$ADMIN_KEY")"

invoke() {
  stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source "$ADMIN_KEY" \
    --network "$NETWORK" \
    -- "$@"
}

step_initialize() {
  echo "=== initialize (run once after deploy) ==="
  invoke initialize \
    --admin "$ADMIN_ADDRESS" \
    --asset '{"name":"RWAToken","total_supply":"1000000","price_per_unit":"100","payment_token":"'"$PAYMENT_TOKEN"'","paused":false}'
}

step_whitelist() {
  echo "=== set_whitelist ==="
  invoke set_whitelist \
    --admin "$ADMIN_ADDRESS" \
    --investor "$INVESTOR" \
    --approved true
}

step_mint() {
  echo "=== mint (admin-only; optional if using invest) ==="
  invoke mint --admin "$ADMIN_ADDRESS" --to "$INVESTOR" --amount 100
}

step_withdraw() {
  echo "=== withdraw collected payment tokens ==="
  invoke withdraw --admin "$ADMIN_ADDRESS" --to "$TREASURY" --amount 500
}

step_pause() {
  echo "=== pause ==="
  invoke pause --admin "$ADMIN_ADDRESS"
}

step_unpause() {
  echo "=== unpause ==="
  invoke unpause --admin "$ADMIN_ADDRESS"
}

case "${1:-setup}" in
  setup)      step_initialize; step_whitelist ;;
  initialize) step_initialize ;;
  whitelist)  step_whitelist ;;
  mint)       step_mint ;;
  withdraw)   step_withdraw ;;
  pause)      step_pause ;;
  unpause)    step_unpause ;;
  *) echo "paso desconocido: $1" >&2; exit 1 ;;
esac
