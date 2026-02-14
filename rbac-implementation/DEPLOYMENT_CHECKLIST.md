# RBAC Deployment Checklist

Use this checklist when deploying the RBAC implementation.

## Pre-Deployment

- [ ] Read `RBAC_COMPLETE.md` (at least the summary section)
- [ ] Read `QUICK_START.md`
- [ ] Verify API server is currently running and healthy
- [ ] Verify JWT authentication is working (`POST /api/auth/login`)
- [ ] Verify current user: `whoami` and `id -u` (need UID 1003 or appropriate permissions)

## Backup

- [ ] Create backup of current API directory:
  ```bash
  cd /workspace/extra/gaztime
  cp -r packages/api/src packages/api/src.backup.$(date +%Y%m%d_%H%M%S)
  ```

## Deployment

### Option A: Automated (Recommended)

- [ ] Navigate to implementation directory:
  ```bash
  cd /workspace/extra/gaztime/rbac-implementation
  ```

- [ ] Run deployment script:
  ```bash
  ./deploy-rbac.sh
  ```

- [ ] Verify output shows "✅ RBAC Implementation Deployed Successfully!"

### Option B: Manual

- [ ] Copy auth middleware:
  ```bash
  cp enhanced-auth-middleware.ts ../packages/api/src/middleware/auth.ts
  ```

- [ ] Copy driver routes:
  ```bash
  cp drivers-routes-rbac.ts ../packages/api/src/routes/drivers.ts
  ```

- [ ] Copy order routes:
  ```bash
  cp orders-routes-rbac.ts ../packages/api/src/routes/orders.ts
  ```

- [ ] Copy customer routes:
  ```bash
  cp customers-routes-rbac.ts ../packages/api/src/routes/customers.ts
  ```

- [ ] Verify TypeScript compilation:
  ```bash
  cd ../packages/api
  pnpm run build
  ```

## Post-Deployment

- [ ] Restart API server:
  ```bash
  cd /workspace/extra/gaztime/packages/api
  pnpm dev
  ```

- [ ] Verify API is running:
  ```bash
  curl http://172.17.0.1:3333/api/health
  ```

- [ ] Check for errors in console output

## Testing

### Create Test Users (if not already done)

- [ ] Create driver test user:
  ```sql
  INSERT INTO users (id, email, password_hash, role, name, phone, active)
  VALUES (
    'drv_test001',
    'driver@gaztime.app',
    -- Use bcrypt hash of 'Driver123!'
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU.DQ2aWNpGC',
    'driver',
    'Test Driver',
    '+27123456789',
    true
  );
  ```

- [ ] Create customer test user:
  ```sql
  INSERT INTO users (id, email, password_hash, role, name, phone, active)
  VALUES (
    'cust_test001',
    'customer@gaztime.app',
    -- Use bcrypt hash of 'Customer123!'
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU.DQ2aWNpGC',
    'customer',
    'Test Customer',
    '+27987654321',
    true
  );
  ```

### Run Automated Tests

- [ ] Run test suite:
  ```bash
  cd /workspace/extra/gaztime/rbac-implementation
  ./test-rbac.sh
  ```

- [ ] Verify all tests pass (or note which ones fail for investigation)

### Manual Smoke Tests

- [ ] Test 1: Admin can list drivers
  ```bash
  ADMIN_TOKEN=$(curl -s -X POST http://172.17.0.1:3333/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@gaztime.app","password":"Admin123!"}' \
    | jq -r '.data.token')

  curl -H "Authorization: Bearer $ADMIN_TOKEN" \
    http://172.17.0.1:3333/api/drivers
  ```
  Expected: 200 OK with driver list

- [ ] Test 2: Customer cannot list drivers
  ```bash
  CUSTOMER_TOKEN=$(curl -s -X POST http://172.17.0.1:3333/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"customer@gaztime.app","password":"Customer123!"}' \
    | jq -r '.data.token')

  curl -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    http://172.17.0.1:3333/api/drivers
  ```
  Expected: 403 Forbidden

- [ ] Test 3: Driver can view assigned orders
  ```bash
  DRIVER_TOKEN=$(curl -s -X POST http://172.17.0.1:3333/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"driver@gaztime.app","password":"Driver123!"}' \
    | jq -r '.data.token')

  curl -H "Authorization: Bearer $DRIVER_TOKEN" \
    http://172.17.0.1:3333/api/orders
  ```
  Expected: 200 OK with filtered orders (only assigned to this driver)

- [ ] Test 4: Customer can create order
  ```bash
  curl -X POST http://172.17.0.1:3333/api/orders \
    -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "items": [{"productId": "prod_r35", "quantity": 1}],
      "deliveryAddress": {"street": "123 Test St", "city": "Stellenbosch"}
    }'
  ```
  Expected: 201 Created with order details

## Validation

- [ ] No console errors during startup
- [ ] API responds to health checks
- [ ] Admin can access all endpoints
- [ ] Drivers can only access own data
- [ ] Customers can only access own data
- [ ] Proper 403 responses for unauthorized access
- [ ] Proper error messages in responses

## Rollback (if needed)

If deployment fails or tests don't pass:

- [ ] Stop API server (Ctrl+C)

- [ ] Restore from backup:
  ```bash
  cd /workspace/extra/gaztime
  # Find your backup directory
  ls -la packages/api/ | grep backup

  # Restore (replace DATE with your backup timestamp)
  rm -rf packages/api/src
  cp -r packages/api/src.backup.DATE packages/api/src
  ```

- [ ] Restart API:
  ```bash
  cd packages/api
  pnpm dev
  ```

- [ ] Report issue to Gaztime agent or Jarvis

## Documentation

- [ ] Update deployment log with:
  - Deployment date/time
  - Who deployed
  - Any issues encountered
  - Test results

- [ ] Notify team of RBAC changes (breaking changes section in RBAC_COMPLETE.md)

- [ ] Update frontend team about 403 handling requirements

## Success Criteria

✅ All tests pass
✅ API starts without errors
✅ Admin can access all endpoints
✅ Role-based restrictions work as expected
✅ No data leakage (customers can't see other customers' data)
✅ Proper error messages displayed

## Notes

- Backups are created automatically by `deploy-rbac.sh`
- Backup location: `/workspace/extra/gaztime/rbac-implementation/backups/TIMESTAMP/`
- Test user passwords are in this checklist (change in production!)
- Full documentation in `RBAC_COMPLETE.md`
- Quick reference in `QUICK_START.md`

---

**Deployment Date**: ______________
**Deployed By**: ______________
**Result**: [ ] Success  [ ] Failed  [ ] Rolled Back
**Notes**:
