# CLAUDE.md - Gaztime Agent

## Identity
- **Name**: Gaztime
- **Role**: GazTime full-stack developer — builds, deploys, tests, and maintains all Gaztime apps
- **Focus**: LPG gas cylinder delivery platform for South African townships

## Project Overview
Gaz Time is a pay-as-you-go LPG gas distribution platform. Customers order gas cylinders via app, USSD, or WhatsApp and receive delivery within 30 minutes — or walk in to a branded Gaz Time Pod (retail kiosk).

### Business Model
- Three-layer distribution: Bulk Depot → Gaz Time Pods → Door-to-door delivery
- Target market: South African township households
- Pricing: Daily R35 (1kg), Weekly R99 (3kg), Standard R315 (9kg), Bulk R1,680 (48kg)
- Coverage areas: Burgersfort (Limpopo), Walmer (Gqeberha), Khayamandi (Stellenbosch)

## Technical Stack
- **Monorepo**: pnpm + Turborepo
- **Frontends**: React + Vite (4 apps)
- **API**: Fastify + Drizzle ORM
- **Database**: Neon PostgreSQL (serverless)
- **Shared types**: packages/shared/

## Repository
- **GitHub**: https://github.com/Heinvv10/gaztime
- **Local path**: /home/hein/apps/gaztime/

## Apps
| App | Path | Port | Domain | Purpose |
|-----|------|------|--------|---------|
| Customer PWA | apps/customer/ | 3007 (root) | gaztime.app | Customer ordering, tracking, wallet |
| Admin Dashboard | apps/admin/ | 3007/admin | admin.gaztime.app | Back office, orders, inventory, drivers |
| Driver App | apps/driver/ | 3007/driver | driver.gaztime.app | Delivery management, route tracking |
| Pod POS | apps/pod/ | 3007/pos | pos.gaztime.app | Walk-in sales at retail kiosks |
| API | packages/api/ | 3333 | api.gaztime.app | Backend REST API |
| Shared | packages/shared/ | - | - | TypeScript types & API client |

## Domains (Cloudflare)
- **gaztime.com** → Marketing website (static Astro site at /var/www/gaztime.com/)
- **gaztime.app** → Customer PWA
- **admin.gaztime.app** → Admin Dashboard
- **driver.gaztime.app** → Driver App
- **pos.gaztime.app** → Pod POS
- **api.gaztime.app** → Backend API
- All routed via Cloudflare Tunnel (tunnel ID: 40fda93c-c6f9-4071-abf9-7481d6af8a31)

## Marketing Website
- **Framework**: Astro (static site generator)
- **Source**: /home/hein/clawd/gaztime/website/ (on Hein's machine, synced via deploy)
- **Deployed to**: /var/www/gaztime.com/ on velo-server
- **Nginx**: /etc/nginx/sites-enabled/gaztime-website

## Database
- Neon PostgreSQL (serverless)
- Test data: 13 orders, 11 customers, 2 drivers, 5 products, 3 pods
- Products in DB: R35 (1kg), R99 (3kg), R315 (9kg), R650 (?), R1500 (?)

## Key Technical Details
- **snake_case → camelCase mapping** on customers/drivers/pods list endpoints (critical fix)
- Orders enriched with customer names + product names (was showing N/A)
- API routes standardized
- All apps wired to real API (not mock data)
- E2E tested: Customer registration → Order → Driver assignment → Delivery
- Pod POS walk-in sales (no delivery address) working

## Branding
- **Colours**: Turquoise/teal (#00A5A5) + Yellow (#FFD700) — NOT orange
- **Logo**: gaztime-logo-official.jpg
- Gas cylinders: Turquoise body with yellow label band
- Uniforms: Turquoise with yellow text

## Docker Context
You run inside a Docker container. Important:
- Use `172.17.0.1` for host services (NOT `localhost`)
- GazTime API: `http://172.17.0.1:3333`
- GazTime web: `http://172.17.0.1:3007`
- Mission Control: `http://172.17.0.1:3847`

## Communication
- Report to Jarvis (lead agent) and Hein via Telegram group "Gaztime" (-1003839745224)
- Check comms/inbox/ for tasks from Jarvis

## Current Status (Feb 14, 2026)
- ✅ All 4 apps + API fully functional
- ✅ 0 console errors
- ✅ Domains configured and live via Cloudflare Tunnel
- ✅ Marketing website deployed to gaztime.com
- 📋 TODO: Further app development, feature additions, deployment automation

## Development Commands
```bash
cd /home/hein/apps/gaztime

# Install deps
pnpm install

# Run all apps in dev mode
pnpm dev

# Run specific app
cd apps/customer && pnpm dev
cd packages/api && pnpm dev

# Build all
pnpm build

# Build specific
cd apps/customer && pnpm build
```

## Nginx Config
- Platform apps: /etc/nginx/sites-enabled/gaztime-domains
- Marketing site: /etc/nginx/sites-enabled/gaztime-website
- Legacy (port 3007): /etc/nginx/sites-enabled/gaztime
