# coopfin-api

NestJS backend for CoopFinance. Handles off-chain indexing, notifications, reporting, and bridges the frontend with Stellar contracts.

[![CI](https://github.com/coopfinance/coopfin-api/actions/workflows/ci.yml/badge.svg)](https://github.com/coopfinance/coopfin-api/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Endpoints

| Route | Description |
|-------|-------------|
| `GET /api/groups` | List all groups |
| `POST /api/groups` | Register a new group |
| `GET /api/groups/:id` | Get group details |
| `GET /api/loans` | List loans (filterable) |
| `POST /api/loans` | Create loan request |
| `GET /api/governance/proposals` | List proposals |
| `POST /api/governance/proposals` | Create a proposal |
| `GET /api/stats` | Dashboard statistics |
| `GET /api/notifications` | User notifications |

Full Swagger docs: `http://localhost:3001/api/docs`

## Setup

```bash
git clone https://github.com/coopfinance/coopfin-api
cd coopfin-api
npm install
cp .env.example .env
npm run db:migrate
npm run start:dev
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/coopfin
STELLAR_NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
HORIZON_URL=https://horizon-testnet.stellar.org
FRONTEND_URL=http://localhost:3000
JWT_SECRET=change-me-in-production
PORT=3001
REDIS_URL=redis://localhost:6379
```

## Architecture

```
src/
├── main.ts                    # App entry point + Swagger
├── app.module.ts              # Root module
├── common/
│   ├── prisma.service.ts      # DB client
│   └── stellar.service.ts     # Soroban RPC / Horizon
└── modules/
    ├── groups/                # Group CRUD + on-chain sync
    ├── members/               # Member management
    ├── loans/                 # Loan lifecycle tracking
    ├── governance/            # Proposal + vote indexing
    └── notifications/         # Email / push alerts
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). This repo participates in the [Stellar Drips Wave](https://drips.network/wave/stellar).
