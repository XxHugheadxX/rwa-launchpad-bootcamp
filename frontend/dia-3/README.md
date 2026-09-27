# RWA Launchpad: Bootcamp Demo Frontend

Next.js 15 (App Router) + TypeScript + Tailwind demo UI for the **Día 3** Soroban contract (`../dia-3`). It talks to a live contract via Soroban RPC and Freighter. This is not a static mockup.

> Bootcamp demo only. Not production-hardened (no audit, limited error recovery, testnet assumptions).

## Prerequisites

- Node.js 20+
- [Freighter](https://www.freighter.app/) browser extension
- Día 3 contract deployed on Stellar testnet (or leave env unset to browse empty states)

## Setup

```bash
cd frontend/dia-3
pnpm install        # o: npm install
cp .env.example .env.local
pnpm dev            # o: npm run dev
```

Con pnpm, `pnpm-workspace.yaml` hoistea los plugins de ESLint que
`eslint-config-next` busca en la raiz de `node_modules`; sin eso `pnpm lint` falla
con `Cannot find module 'eslint-plugin-react-hooks'`.

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Fill these in `.env.local` **after** the Día 3 contract is deployed:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CONTRACT_ID` | Deployed `rwa-launchpad` contract id (`C…`) |
| `NEXT_PUBLIC_PAYMENT_TOKEN_ID` | Payment token / SAC id used at `initialize` (prefills admin form) |
| `NEXT_PUBLIC_ADMIN_ADDRESS` | Admin `G…` key; gates `/admin` |
| `NEXT_PUBLIC_NETWORK` | `testnet` (default), `public`, or `futurenet` |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | Optional; defaults to `https://soroban-testnet.stellar.org` |

If `NEXT_PUBLIC_CONTRACT_ID` is missing, every page that needs the chain shows a clear **not deployed yet** empty state instead of crashing.

## Pages

- `/`: Launchpad overview, on-chain `AssetInfo`, SEP-1 explainer
- `/invest`: Balance, `invest`, `transfer` (Freighter required)
- `/admin`: `initialize`, whitelist, mint, withdraw, pause/unpause (admin Freighter key)

## Design tokens

Visual tokens live under `frontend-design/` (copied from the Oppia design system). Tailwind exposes them via `tailwind.config.ts` and `app/globals.css`. Brand marks are in `public/brand/`.

## Stack

- Next.js 15 App Router, React 19, TypeScript
- Tailwind CSS (dark-first Oppia tokens)
- `@stellar/stellar-sdk` (Soroban RPC + contract invoke)
- `@stellar/freighter-api` (wallet connect / sign)
