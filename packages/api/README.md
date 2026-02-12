# Gaz Time API

Backend API for the Gaz Time LPG delivery platform.

## Tech Stack

- **Runtime:** Node.js 22+ with TypeScript
- **Framework:** Fastify 4
- **Database:** SQLite (dev/test) / PostgreSQL (production) with Drizzle ORM
- **Testing:** Vitest
- **Real-time:** Socket.io (planned)
- **Background Jobs:** BullMQ (planned)

## Project Structure

```
src/
├── db/
│   ├── schema.ts          # Drizzle ORM schema definitions
│   ├── index.ts           # Database connection
│   ├── migrate.ts         # Migration runner
│   └── seed.ts            # Test data seeder
├── services/
│   ├── order.ts           # Order management service
│   ├── customer.ts        # Customer & wallet service
│   ├── inventory.ts       # Cylinder & stock tracking
│   └── delivery.ts        # Driver & delivery management
├── routes/
│   ├── orders.ts          # Order API endpoints
│   ├── customers.ts       # Customer API endpoints
│   ├── inventory.ts       # Inventory API endpoints
│   └── drivers.ts         # Driver API endpoints
├── test/
│   ├── setup.ts           # Vitest test setup
│   └── factories.ts       # Test data factories
└── server.ts              # Main Fastify server
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Database Migrations

```bash
npm run db:generate
```

### 3. Run Migrations

```bash
npm run db:migrate
```

### 4. Seed Database (Optional)

```bash
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at: `http://localhost:3333`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests in watch mode
- `npm run test:once` - Run tests once
- `npm run test:ui` - Open Vitest UI
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with test data
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## Testing

All services are built using **Test-Driven Development (TDD)**:

1. Write tests first (`.test.ts` files)
2. Run tests - they should fail (red)
3. Implement code to make tests pass (green)
4. Refactor

Run tests:

```bash
npm test
```

Test coverage:

```bash
npm test -- --coverage
```

## API Endpoints

### Health Check

```
GET /health
```

### Orders

```
POST   /api/orders              - Create new order
GET    /api/orders              - List orders (with filters)
GET    /api/orders/:id          - Get order by ID
PATCH  /api/orders/:id/status   - Update order status
POST   /api/orders/:id/cancel   - Cancel order
POST   /api/orders/:id/assign   - Assign driver to order
```

### Customers

```
POST   /api/customers                - Register new customer
GET    /api/customers/:id            - Get customer by ID
GET    /api/customers/phone/:phone   - Get customer by phone
PATCH  /api/customers/:id            - Update customer profile
GET    /api/customers/:id/wallet     - Get wallet balance
POST   /api/customers/:id/wallet/topup - Top up wallet
POST   /api/customers/:id/wallet/debit - Debit wallet
```

### Inventory

```
POST   /api/inventory/cylinders              - Create new cylinder
GET    /api/inventory/cylinders/:id          - Get cylinder by ID
GET    /api/inventory/cylinders/serial/:serial - Get cylinder by serial
POST   /api/inventory/cylinders/move         - Move cylinder between locations
POST   /api/inventory/cylinders/:id/fill     - Mark cylinder as filled
PATCH  /api/inventory/cylinders/:id/status   - Update cylinder status
GET    /api/inventory/stock                  - Get stock levels
GET    /api/inventory/alerts/low-stock       - Get low stock alerts
POST   /api/inventory/cylinders/:id/condemn  - Condemn cylinder
```

### Drivers

```
PATCH  /api/drivers/:id/status          - Update driver status (online/offline)
PATCH  /api/drivers/:id/location        - Update driver GPS location
GET    /api/drivers/available            - Get all online drivers
POST   /api/drivers/nearest              - Find nearest driver to location
POST   /api/drivers/assign               - Assign driver to order
POST   /api/drivers/complete-delivery    - Complete delivery with proof
```

## Environment Variables

Create a `.env` file in the root:

```bash
# Server
PORT=3333
HOST=0.0.0.0
LOG_LEVEL=info
CORS_ORIGIN=*

# Database
DATABASE_URL=./data/gaztime.db

# Node Environment
NODE_ENV=development
```

## Database Schema

See `src/db/schema.ts` for full schema definition.

Key entities:
- **customers** - Customer profiles, addresses, wallet
- **orders** - Orders with items, delivery info, status tracking
- **products** - LPG cylinder products and pricing
- **cylinders** - Individual cylinder tracking with serial numbers
- **drivers** - Driver profiles, status, location
- **vehicles** - Vehicle details and current stock
- **pods** - Retail kiosks with stock levels
- **depots** - Main distribution centers
- **wallets** - Customer wallet balances
- **wallet_transactions** - Wallet transaction history
- **subscriptions** - Recurring delivery subscriptions

## Order State Machine

```
created → confirmed → assigned → in_transit → delivered → completed
  │
  └──> cancelled (allowed before delivery)
```

## Development

### Adding a New Service

1. Create test file: `src/services/myservice.test.ts`
2. Write tests following TDD approach
3. Create service file: `src/services/myservice.ts`
4. Implement to pass tests
5. Create routes: `src/routes/myservice.ts`
6. Register routes in `src/server.ts`

### Database Changes

1. Modify schema in `src/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Run migration: `npm run db:migrate`

## Production Deployment

1. Set `NODE_ENV=production`
2. Use PostgreSQL instead of SQLite
3. Set `DATABASE_URL` to PostgreSQL connection string
4. Update Drizzle config for PostgreSQL driver
5. Build: `npm run build`
6. Start: `npm start`

## License

Proprietary - Velocity Fibre / Gaz Time

---

Built with ❤️ by the Gaz Time team
