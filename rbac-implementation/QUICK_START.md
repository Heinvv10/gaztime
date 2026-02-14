# RBAC Quick Start Guide

## TL;DR

Role-Based Access Control is implemented. Use this guide to deploy and test.

## Deploy (Choose One)

### Option A: Automated (if you have sudo access)
```bash
cd /workspace/extra/gaztime/rbac-implementation
sudo -u <file-owner> ./deploy-rbac.sh
```

### Option B: Manual
```bash
cd /workspace/extra/gaztime

# Copy files
cp rbac-implementation/enhanced-auth-middleware.ts packages/api/src/middleware/auth.ts
cp rbac-implementation/drivers-routes-rbac.ts packages/api/src/routes/drivers.ts
cp rbac-implementation/orders-routes-rbac.ts packages/api/src/routes/orders.ts
cp rbac-implementation/customers-routes-rbac.ts packages/api/src/routes/customers.ts

# Restart API
cd packages/api
pnpm dev
```

## Test

```bash
cd /workspace/extra/gaztime/rbac-implementation
./test-rbac.sh
```

## What Changed

### Drivers
- ✅ Can only update own status/location
- ✅ Can only complete assigned deliveries
- ❌ Cannot list all drivers
- ❌ Cannot access other drivers' data

### Customers
- ✅ Can create orders
- ✅ Can view own orders and profile
- ✅ Can view own wallet
- ❌ Cannot see other customers' data
- ❌ Cannot update order status
- ❌ Cannot top up own wallet (admin only)

### Drivers (continued)
- ✅ Can view assigned deliveries
- ✅ Can update status on assigned orders
- ❌ Cannot view all orders
- ❌ Cannot assign deliveries

### Admin/Operator
- ✅ Full access to everything (unchanged)

## Quick Test Commands

```bash
# Get admin token
ADMIN_TOKEN=$(curl -s -X POST http://172.17.0.1:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gaztime.app","password":"Admin123!"}' \
  | jq -r '.data.token')

# Test admin access (should work)
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://172.17.0.1:3333/api/drivers

# Get customer token
CUSTOMER_TOKEN=$(curl -s -X POST http://172.17.0.1:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@gaztime.app","password":"Customer123!"}' \
  | jq -r '.data.token')

# Test customer access to drivers (should fail with 403)
curl -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  http://172.17.0.1:3333/api/drivers
```

## Files Location

All implementation files are in:
```
/workspace/extra/gaztime/rbac-implementation/
├── enhanced-auth-middleware.ts    # Enhanced auth with ownership checks
├── drivers-routes-rbac.ts         # Driver routes with RBAC
├── orders-routes-rbac.ts          # Order routes with RBAC
├── customers-routes-rbac.ts       # Customer routes with RBAC
├── deploy-rbac.sh                 # Deployment script
├── test-rbac.sh                   # Test suite
├── RBAC_COMPLETE.md              # Full documentation
└── QUICK_START.md                # This file
```

## Help

- Full docs: `RBAC_COMPLETE.md`
- RBAC matrix: `RBAC_COMPLETE.md` (see "RBAC Matrix" section)
- Troubleshooting: `RBAC_COMPLETE.md` (see "Troubleshooting" section)
