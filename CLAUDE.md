# CLAUDE.md - GazTime AI Assistant Context

## Project Overview
**GazTime** - LPG (gas cylinder) delivery platform
- **Architecture**: pnpm monorepo with Turborepo
- **Frontend**: React + Vite + Tailwind CSS (4 apps)
- **Backend**: Fastify API with Drizzle ORM
- **Database**: Neon PostgreSQL
- **Hosting**: https://gaztime.fibreflow.app (port 3007 on Velocity server)

## Monorepo Structure
```
gaztime/
├── apps/
│   ├── admin/       # Admin dashboard (React + Vite)
│   ├── customer/    # Customer ordering app (React + Vite, PWA)
│   ├── driver/      # Driver delivery app (React + Vite)
│   └── pod/         # Pod POS terminal (React + Vite)
├── packages/
│   ├── api/         # Fastify API server (port 3333)
│   └── shared/      # Shared types, API client, mock data
├── turbo.json       # Turborepo config
└── pnpm-workspace.yaml
```

## Key Commands
```bash
pnpm dev              # Start all apps + API in dev mode (Turborepo)
pnpm build            # Build all packages
pnpm test             # Run all tests (Vitest)
pnpm lint             # Lint all packages
```

### API-specific
```bash
cd packages/api
pnpm dev              # API only (tsx watch, port 3333)
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:studio        # Drizzle Studio (DB browser)
pnpm test             # Vitest
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | React 18, Vite, Tailwind CSS |
| State | Zustand (per-app stores) |
| API | Fastify 4, Zod validation |
| ORM | Drizzle ORM (PostgreSQL) |
| Database | Neon PostgreSQL |
| Testing | Vitest |
| Types | TypeScript 5, shared via `@gaztime/shared` |

## API Routes

All routes prefixed with `/api`:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| GET | `/api` | API info |
| * | `/api/orders` | Order CRUD + status updates |
| * | `/api/customers` | Customer management |
| * | `/api/inventory` | Cylinder & stock tracking |
| * | `/api/drivers` | Driver management |
| * | `/api/products` | Product catalog |
| * | `/api/pods` | Pod (point of delivery) management |

## Database Schema (Drizzle)

Defined in `packages/api/src/db/schema.ts`:

| Table | Purpose |
|-------|---------|
| `customers` | Customer profiles, addresses, wallet balance |
| `orders` | Delivery orders with status tracking |
| `products` | Gas cylinder products with pricing |
| `cylinders` | Individual cylinder tracking (serial, fill count, location) |
| `drivers` | Driver profiles, certifications, ratings |
| `vehicles` | Delivery vehicles with stock tracking |
| `pods` | Point-of-delivery locations (physical stores) |
| `depots` | Bulk storage depots |
| `wallets` | Customer wallet balances |
| `wallet_transactions` | Wallet transaction history |
| `subscriptions` | Recurring delivery subscriptions |

## Database Connection
```
Host: ep-green-dawn-aiixamk2-pooler.c-4.us-east-1.aws.neon.tech
Database: neondb
Env file: packages/api/.env
```

## Infrastructure

- **URL**: https://gaztime.fibreflow.app
- **Server**: Velocity (100.96.203.105)
- **Port**: 3007 (served via nginx)
- **Tunnel**: Cloudflare Tunnel `vf-fibreflow`
- **Nginx config**: `/etc/nginx/sites-enabled/gaztime`
- **Cloudflare account**: ai@velocityfibre.co.za

See `INFRASTRUCTURE.md` for full Cloudflare details.

## App Details

### Admin Dashboard (`apps/admin`)
- Pages: Home, Orders, Customers, Inventory, Fleet, Pods, Finance, Reports, LiveMap, Settings, Login
- Store: `authStore.ts` (Zustand)

### Customer App (`apps/customer`)
- Pages: Splash, Home, OrderProduct, Orders, OrderTracking, Profile, Wallet, Referrals, Safety, Onboarding
- Store: `useStore.ts` (Zustand)
- PWA enabled

### Driver App (`apps/driver`)
- Screens: Dashboard, Login, Navigation, DeliveryCompletion, OrderNotification, StockManagement, SafetyChecklist, Earnings
- Store: `useStore.ts` (Zustand)

### Pod POS (`apps/pod`)
- Pages: Login, POS, CustomerRegistration, CustomerOrders, StockManagement, ShiftManagement, DailyReports, SaleConfirmation
- Store: `usePodStore.ts` (Zustand)

## Shared Package (`packages/shared`)
- `api-client.ts` - Shared fetch wrapper with auto-unwrapping
- `types.ts` - Shared TypeScript types
- `mock-data.ts` - Development mock data

## Development Guidelines

- Use `pnpm` (not npm/yarn) - monorepo requires it
- Shared types go in `packages/shared`
- API responses are wrapped: `{ success: true, data: {...} }` - client auto-unwraps
- Each app has its own Zustand store
- Vite dev servers proxy `/api` to the Fastify backend on port 3333

## Module Documentation
See `.claude/modules/` for detailed module docs.
