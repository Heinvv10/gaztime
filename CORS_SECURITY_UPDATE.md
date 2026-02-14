# CORS Security Update - Gaztime API

**Task**: #228 - Restrict CORS to Gaztime domains only
**Date**: 2026-02-14
**Status**: ✅ Complete

## What Changed

### Before
```javascript
origin: process.env.CORS_ORIGIN || '*',  // ❌ Allows ALL origins
```

### After
```javascript
origin: (origin, cb) => {
  // Whitelist of allowed origins
  const allowedOrigins = [
    'https://gaztime.app',
    'https://www.gaztime.app',
    'https://admin.gaztime.app',
    'https://driver.gaztime.app',
    'https://pos.gaztime.app',
    'https://gaztime.com',
    'https://www.gaztime.com',
    // Development
    'http://localhost:3007',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://172.17.0.1:3007',
  ];

  // Dynamic origin checking with fallback to env var
}
```

## Security Benefits

✅ **Prevents CSRF Attacks**: Only Gaztime domains can make cross-origin requests
✅ **Reduces Attack Surface**: External sites cannot access API
✅ **Credentials Support**: Added `credentials: true` for secure cookie-based auth
✅ **Flexible for Development**: Localhost origins included for local dev

## Allowed Origins

### Production
- `https://gaztime.app` - Customer PWA
- `https://www.gaztime.app` - Customer PWA (www subdomain)
- `https://admin.gaztime.app` - Admin Dashboard
- `https://driver.gaztime.app` - Driver App
- `https://pos.gaztime.app` - Pod POS
- `https://gaztime.com` - Marketing website
- `https://www.gaztime.com` - Marketing website (www subdomain)

### Development
- `http://localhost:3007` - Local dev server (main)
- `http://localhost:5173` - Vite dev server (default)
- `http://localhost:5174` - Vite dev server (alternate)
- `http://172.17.0.1:3007` - Docker host access

### Custom Origin
- Any origin set in `CORS_ORIGIN` env var (for testing/staging)

## Special Cases

### No Origin (Allowed)
Requests without an origin header are allowed. This includes:
- Mobile apps (React Native, Flutter)
- API testing tools (Postman, curl, Insomnia)
- Server-to-server requests

### Rejected Origins
Any origin not in the whitelist will receive:
```
HTTP 403 Forbidden
Error: Not allowed by CORS
```

## Configuration

### Add Custom Origin for Testing
```bash
# In packages/api/.env
CORS_ORIGIN=https://staging.gaztime.app
```

This will be added to the allowed list automatically.

### Add New Production Domain
Edit `packages/api/src/server.ts`:
```javascript
const allowedOrigins = [
  // ... existing origins
  'https://new-domain.gaztime.app',  // Add here
];
```

## Testing CORS

### Test Allowed Origin
```bash
curl -H "Origin: https://gaztime.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:3333/api/orders
```

Should return:
```
Access-Control-Allow-Origin: https://gaztime.app
Access-Control-Allow-Credentials: true
```

### Test Blocked Origin
```bash
curl -H "Origin: https://evil-site.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:3333/api/orders
```

Should return:
```
HTTP 403 Forbidden
Error: Not allowed by CORS
```

### Test No Origin (Should Work)
```bash
curl -X GET http://localhost:3333/api/products
```

Should return normal response (mobile apps and API tools need this).

## Files Modified

- `packages/api/src/server.ts` - Updated CORS configuration
- `packages/api/.env.example` - Updated documentation and added JWT_SECRET

## Integration Notes

### Frontend Apps
No changes needed if deployed to official Gaztime domains. The CORS policy allows all official domains by default.

### Local Development
Localhost ports 3007, 5173, 5174 are pre-approved for development.

### Staging/Testing Environments
Add staging domain to `CORS_ORIGIN` env var or update the whitelist in server.ts.

## Security Checklist

- [x] Wildcard `*` removed from CORS config
- [x] Only Gaztime domains whitelisted
- [x] Credentials enabled for secure auth
- [x] No origin requests allowed (for mobile apps)
- [x] Custom origin support via env var
- [x] Development localhost origins included

## Related Security Tasks

- ✅ Task #223: JWT Authentication (Completed)
- ⏳ Task #227: Rate limiting (Pending)
- ⏳ Task #225: Input sanitization (Pending)

---

**Status**: ✅ Complete - CORS restricted to Gaztime domains only
