# Infrastructure

## Hosting

| Component | Location |
|-----------|----------|
| Frontend + API | Velocity server (100.96.203.105) |
| Database | Neon PostgreSQL (US East) |
| DNS/Tunnel | Cloudflare (ai@velocityfibre.co.za) |

## Velocity Server

- **URL**: https://gaztime.fibreflow.app
- **Port**: 3007
- **Nginx config**: `/etc/nginx/sites-enabled/gaztime`
- **Nginx proxies**: `/api/` -> `localhost:3333` (Fastify API)
- **Static files**: Served by nginx from built Vite output

## Cloudflare

- **Account**: ai@velocityfibre.co.za
- **API Key**: b606ca0397f318d413473a65102b7a37ef649
- **Zone ID**: 88b2df513589e5894a2e633944bbf010
- **Tunnel**: vf-fibreflow (40fda93c-c6f9-4071-abf9-7481d6af8a31)
- **Service**: `cloudflared-vf.service` on Velocity

## Database

- **Provider**: Neon PostgreSQL (serverless)
- **Region**: US East
- **Host**: ep-green-dawn-aiixamk2-pooler.c-4.us-east-1.aws.neon.tech
- **Env file**: `packages/api/.env`

## Deployment

```bash
# SSH to Velocity
ssh velo@100.96.203.105

# Build and deploy
cd /path/to/gaztime
git pull
pnpm install
pnpm build

# Restart services
# (systemd service or PM2 - TBD)
```

## Server Access

```
ssh velo@100.96.203.105   # SSH key auth, sudo password: velo2026
ssh zander@100.96.203.105 # Password: zander2026
```
