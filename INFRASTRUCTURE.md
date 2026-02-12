# GazTime Infrastructure

## Hosting

- **URL**: https://gaztime.fibreflow.app
- **Server**: Velocity (100.96.203.105)
- **Port**: 3007
- **Nginx config**: `/etc/nginx/sites-enabled/gaztime`

## Cloudflare DNS & Tunnel

All `*.fibreflow.app` domains are managed through Cloudflare.

- **Cloudflare Account**: ai@velocityfibre.co.za
- **Global API Key**: b606ca0397f318d413473a65102b7a37ef649
- **Zone ID** (fibreflow.app): 88b2df513589e5894a2e633944bbf010
- **Tunnel Name**: vf-fibreflow
- **Tunnel ID**: 40fda93c-c6f9-4071-abf9-7481d6af8a31
- **DNS**: `gaztime.fibreflow.app` -> CNAME -> tunnel (proxied)

### Quick Commands

```bash
# Check DNS record
curl -s "https://api.cloudflare.com/client/v4/zones/88b2df513589e5894a2e633944bbf010/dns_records?name=gaztime.fibreflow.app" \
  -H "X-Auth-Email: ai@velocityfibre.co.za" \
  -H "X-Auth-Key: b606ca0397f318d413473a65102b7a37ef649" | python3 -m json.tool

# Check tunnel status
ssh velo@100.96.203.105 "sudo systemctl status cloudflared-vf.service"

# Restart tunnel (if gaztime.fibreflow.app is down)
ssh velo@100.96.203.105 "echo 'velo2026' | sudo -S systemctl restart cloudflared-vf.service"

# Test site
curl -sI https://gaztime.fibreflow.app
```

### Tunnel Ingress (all fibreflow.app sites)

| Hostname | Port | App |
|----------|------|-----|
| app.fibreflow.app | :80 (nginx) | FibreFlow Production |
| fibreflow.app | :80 (nginx) | FibreFlow Root |
| vf.fibreflow.app | :80 (nginx) | FibreFlow Staging |
| dev.fibreflow.app | :80 (nginx) | FibreFlow Dev |
| qfield.fibreflow.app | :8082 | QFieldCloud |
| support.fibreflow.app | :3005 | Support Portal |
| gaztime.fibreflow.app | :3007 | GazTime |

### Full Docs

See `/home/hein/Workspace/VF/docs/CLOUDFLARE_TUNNEL_GUIDE.md` for complete Cloudflare management guide.
