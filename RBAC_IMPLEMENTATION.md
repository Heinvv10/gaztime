# RBAC Implementation - Gaztime API

**Task**: #232 - Implement Role-Based Access Control
**Status**: Partially Complete - Need file permission fixes to complete implementation
**Date**: 2026-02-14

## Current Status

### ✅ Already Implemented
1. **JWT Authentication**: All endpoints require authentication
2. **Role Middleware**: `requireRole(...roles)` middleware exists and works
3. **Partial RBAC**: Some endpoints already have role restrictions:
   - Customer management: admin, operator only
   - Inventory management: admin, operator only  
   - Driver management: admin, operator only
   - Order cancellation: admin, operator only
   - Driver assignment: admin, operator only

### ⚠️ Gaps Identified

#### 1. Driver Resource Ownership
**Location**: `packages/api/src/routes/drivers.ts`
- Lines 87-88: TODO comment - drivers should only update their own status
- Lines 111-112: TODO comment - drivers should only update their own location
- Currently any authenticated user can update any driver's data

#### 2. Customer Resource Ownership  
- Customers should only be able to view/update their own profile
- Currently customers cannot create orders (need customer role support)

#### 3. Order Access Control
**Location**: `packages/api/src/routes/orders.ts`
- Create order (line 30): Should allow customers to create their own orders
- Get order (line 60): Customers should only see their own orders
- List orders (line 94): Should filter by customer_id for customer role
- Update status (line 128): Customers should not be able to update status

## Proposed Implementation

### Step 1: Enhanced Auth Middleware

Add to `packages/api/src/middleware/auth.ts`:

```typescript
// Check if user can access a specific resource
export async function requireOwnership(
  resourceType: 'driver' | 'customer' | 'order',
  request: FastifyRequest,
  reply: FastifyReply
): Promise<boolean> {
  const user = request.user as AuthUser;

  // Admins and operators can access all resources
  if (user.role === 'admin' || user.role === 'operator') {
    return true;
  }

  const resourceId = (request.params as any).id;

  // Drivers can only access their own driver record
  if (resourceType === 'driver' && user.role === 'driver') {
    if (user.id !== resourceId) {
      reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Drivers can only access their own data',
        },
      });
      return false;
    }
    return true;
  }

  // Customers can only access their own customer record
  if (resourceType === 'customer' && user.role === 'customer') {
    if (user.id !== resourceId) {
      reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Customers can only access their own data',
        },
      });
      return false;
    }
    return true;
  }

  return true;
}

// Middleware factory for resource ownership checks
export function requireResourceAccess(resourceType: 'driver' | 'customer' | 'order') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (reply.sent) return; // Auth failed

    const hasAccess = await requireOwnership(resourceType, request, reply);
    if (!hasAccess && !reply.sent) {
      reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to this resource',
        },
      });
    }
  };
}
```

### Step 2: Update Driver Routes

In `packages/api/src/routes/drivers.ts`:

```typescript
// Update driver status - drivers can only update their own
fastify.patch<{ Params: { id: string }; Body: { status: DriverStatus } }>(
  '/drivers/:id/status',
  {
    onRequest: [requireResourceAccess('driver')], // Changed from [authenticate]
  },
  async (request: any, reply) => {
    // Rest of handler unchanged
  }
);

// Update driver location - drivers can only update their own
fastify.patch<{ Params: { id: string }; Body: { location: { lat: number; lng: number } } }>(
  '/drivers/:id/location',
  {
    onRequest: [requireResourceAccess('driver')], // Changed from [authenticate]
  },
  async (request: any, reply) => {
    // Rest of handler unchanged
  }
);
```

### Step 3: Update Order Routes

In `packages/api/src/routes/orders.ts`:

```typescript
// Get order by ID - add ownership check
fastify.get<{ Params: { id: string } }>('/orders/:id', {
  onRequest: [authenticate],
}, async (request: any, reply) => {
  const user = request.user as AuthUser;
  const order = await orderService.getOrder(request.params.id);

  if (!order) {
    return reply.code(404).send({
      success: false,
      error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
    });
  }

  // Customers can only see their own orders
  if (user.role === 'customer' && order.customerId !== user.id) {
    return reply.code(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied to this order' },
    });
  }

  // Drivers can only see orders assigned to them
  if (user.role === 'driver' && order.driverId !== user.id) {
    return reply.code(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied to this order' },
    });
  }

  // Rest of handler unchanged...
});

// List orders - filter by role
fastify.get<{ Querystring: ListOrdersQuery }>('/orders', {
  onRequest: [authenticate],
}, async (request: any, reply) => {
  const user = request.user as AuthUser;
  const query = { ...request.query };

  // Customers can only see their own orders
  if (user.role === 'customer') {
    query.customerId = user.id;
  }

  // Drivers can only see their assigned orders
  if (user.role === 'driver') {
    query.driverId = user.id;
  }

  const orders = await orderService.listOrders(query);
  // Rest of handler unchanged...
});
```

### Step 4: Update Customer Routes

In `packages/api/src/routes/customers.ts`:

```typescript
// GET /api/customers/:id - add ownership check
fastify.get<{ Params: { id: string } }>('/customers/:id', {
  onRequest: [authenticate],
}, async (request: any, reply) => {
  const user = request.user as AuthUser;

  // Customers can only access their own profile
  if (user.role === 'customer' && request.params.id !== user.id) {
    return reply.code(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied' },
    });
  }

  // Rest of handler unchanged...
});
```

## RBAC Matrix

| Endpoint | Admin | Operator | Driver | Customer |
|----------|-------|----------|--------|----------|
| **Orders** |  |  |  |  |
| POST /orders | ✅ | ✅ | ❌ | ✅ (own) |
| GET /orders | ✅ (all) | ✅ (all) | ✅ (own) | ✅ (own) |
| GET /orders/:id | ✅ | ✅ | ✅ (assigned) | ✅ (own) |
| PATCH /orders/:id/status | ✅ | ✅ | ✅ (assigned) | ❌ |
| POST /orders/:id/cancel | ✅ | ✅ | ❌ | ❌ |
| POST /orders/:id/assign | ✅ | ✅ | ❌ | ❌ |
| **Drivers** |  |  |  |  |
| GET /drivers | ✅ | ✅ | ❌ | ❌ |
| GET /drivers/phone/:phone | ✅ | ✅ | ❌ | ❌ |
| PATCH /drivers/:id/status | ✅ | ✅ | ✅ (own) | ❌ |
| PATCH /drivers/:id/location | ✅ | ✅ | ✅ (own) | ❌ |
| GET /drivers/available | ✅ | ✅ | ❌ | ❌ |
| POST /drivers/nearest | ✅ | ✅ | ❌ | ❌ |
| POST /drivers/assign | ✅ | ✅ | ❌ | ❌ |
| POST /drivers/complete-delivery | ✅ | ✅ | ✅ (assigned) | ❌ |
| **Customers** |  |  |  |  |
| GET /customers | ✅ | ✅ | ❌ | ❌ |
| POST /customers | ✅ | ✅ | ❌ | ❌ |
| GET /customers/:id | ✅ | ✅ | ❌ | ✅ (own) |
| PATCH /customers/:id | ✅ | ✅ | ❌ | ✅ (own) |
| GET /customers/phone/:phone | ✅ | ✅ | ❌ | ❌ |
| POST /customers/:id/wallet/add | ✅ | ✅ | ❌ | ❌ |
| POST /customers/:id/wallet/deduct | ✅ | ✅ | ❌ | ❌ |
| **Inventory** |  |  |  |  |
| GET /inventory | ✅ | ✅ | ❌ | ❌ |
| POST /inventory/transfer | ✅ | ✅ | ❌ | ❌ |
| All other inventory endpoints | ✅ | ✅ | ❌ | ❌ |
| **Products** |  |  |  |  |
| GET /products | ✅ | ✅ | ✅ | ✅ |
| GET /products/:id | ✅ | ✅ | ✅ | ✅ |
| **Pods** |  |  |  |  |
| GET /pods | ✅ | ✅ | ❌ | ❌ |
| GET /pods/:id | ✅ | ✅ | ❌ | ❌ |

## Implementation Blockers

### Permission Issue
Cannot edit files in `/workspace/extra/gaztime/packages/api/src/` - files are owned by UID 1003, running as UID 1000 (node), no sudo access.

**Solutions**:
1. Have the file owner (UID 1003) apply the changes
2. SSH to production server and apply changes there
3. Change directory ownership: `chown -R node:node /workspace/extra/gaztime/`

## Testing Checklist

After implementation:

- [ ] Test admin can access all endpoints
- [ ] Test operator can access all management endpoints
- [ ] Test driver can only update own status/location
- [ ] Test driver cannot update other driver's data
- [ ] Test driver can only see assigned deliveries
- [ ] Test customer can create orders
- [ ] Test customer can only see own orders
- [ ] Test customer cannot see other customers' orders
- [ ] Test customer cannot update order status
- [ ] Test 403 responses have proper error messages
- [ ] Test products endpoint is public (all roles can view)

## Next Steps

1. Fix file permissions
2. Implement changes from Steps 1-4 above
3. Run test suite
4. Update API documentation with RBAC matrix
5. Update frontend apps to handle 403 responses
6. Mark task #232 as completed

---

**Status**: Implementation designed, blocked by file permissions
**Estimated effort**: 30 minutes once permissions are fixed
