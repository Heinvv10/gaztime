# API Module (@gaztime/api)

## Overview
Fastify API server for the GazTime platform. Handles all CRUD operations, business logic, and database access.

## Location
`packages/api/`

## Key Files

| File | Purpose |
|------|---------|
| `src/server.ts` | Fastify server setup, route registration |
| `src/db/schema.ts` | Drizzle ORM schema (all tables) |
| `src/db/index.ts` | Database connection (Neon) |
| `src/db/seed.ts` | Database seeder |
| `src/db/mappers.ts` | DB row to API response mappers |
| `src/validation.ts` | Zod validation schemas |
| `src/routes/orders.ts` | Order endpoints |
| `src/routes/customers.ts` | Customer endpoints |
| `src/routes/inventory.ts` | Cylinder/stock endpoints |
| `src/routes/drivers.ts` | Driver endpoints |
| `src/routes/products.ts` | Product endpoints |
| `src/routes/pods.ts` | Pod (POS location) endpoints |
| `src/services/order.ts` | Order business logic |
| `src/services/customer.ts` | Customer business logic |
| `src/services/delivery.ts` | Delivery assignment logic |
| `src/services/inventory.ts` | Inventory/cylinder tracking |

## API Response Pattern
```typescript
// Success
{ success: true, data: { ... } }

// Error
{ success: false, error: { code: 'ERROR_CODE', message: '...' } }
```

## Database
- **ORM**: Drizzle ORM
- **Provider**: Neon PostgreSQL (serverless)
- **Config**: `drizzle.config.ts`
- **Connection**: `packages/api/.env` → `DATABASE_URL`

## Running
```bash
cd packages/api
pnpm dev        # Dev with hot reload (tsx watch)
pnpm test       # Vitest
pnpm db:studio  # Drizzle Studio
```

## Port
- Dev: 3333
- Production: 3333 (nginx proxies /api/ from port 3007)
