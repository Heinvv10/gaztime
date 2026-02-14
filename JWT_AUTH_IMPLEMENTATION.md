# JWT Authentication Implementation - Gaztime API

**Status**: Implementation Complete - Ready for Testing
**Date**: 2026-02-14
**Task**: #223 - Implement JWT Authentication

## What Was Implemented

### 1. Database Schema ✅
- **File**: `packages/api/src/db/schema.ts`
- Added `users` table with fields:
  - `id`, `email`, `password_hash`, `role`, `name`, `phone`
  - `active`, `created_at`, `last_login_at`
- Roles supported: `admin`, `driver`, `operator`, `customer`
- Indexes on `email` and `role`

### 2. Authentication Middleware ✅
- **File**: `packages/api/src/middleware/auth.ts`
- Functions:
  - `authenticate()` - Verify JWT and attach user to request
  - `requireRole(...roles)` - Check user has required role
  - `optionalAuth()` - Optional authentication (don't fail if no token)

### 3. Authentication Routes ✅
- **File**: `packages/api/src/routes/auth.ts`
- Endpoints implemented:
  - `POST /api/auth/register` - Register new user
  - `POST /api/auth/login` - Login and get JWT token
  - `POST /api/auth/refresh` - Refresh access token using refresh token
  - `GET /api/auth/me` - Get current user info (protected)

### 4. JWT Plugin Configuration ✅
- **File**: `packages/api/src/server.ts`
- Added `@fastify/jwt` plugin registration
- JWT secret configurable via `JWT_SECRET` env var
- Extended Fastify types for `request.user`

### 5. Dependencies ✅
- **File**: `packages/api/package.json`
- Added:
  - `bcrypt: ^5.1.1` - Password hashing
  - `@types/bcrypt: ^5.0.2` - TypeScript types
- Already present:
  - `@fastify/jwt: ^8.0.0` - JWT plugin

## Setup Instructions

### Step 1: Install Dependencies
```bash
cd /workspace/extra/gaztime
# Use the host's pnpm (node_modules exists, needs proper pnpm setup)
# OR manually run npm install in packages/api after fixing workspace refs
```

### Step 2: Create Users Table
```bash
cd packages/api

# Option A: Run migration script
npx tsx src/db/create-users-table.ts

# Option B: Manual SQL (via psql or DB client)
# Execute the SQL in: src/db/migrations/002_create_users_table.sql
```

### Step 3: Set JWT Secret
Add to `packages/api/.env`:
```env
JWT_SECRET=your-super-secret-key-change-me-in-production
```

### Step 4: Restart API Server
```bash
cd packages/api
npm run dev
```

## API Usage Examples

### Register New User
```bash
curl -X POST http://localhost:3333/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gaztime.app",
    "password": "SecurePass123!",
    "name": "Admin User",
    "role": "admin"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_...",
      "email": "admin@gaztime.app",
      "name": "Admin User",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
```bash
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gaztime.app",
    "password": "SecurePass123!"
  }'
```

### Use Protected Endpoint
```bash
curl -X GET http://localhost:3333/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Refresh Token
```bash
curl -X POST http://localhost:3333/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

## Next Steps - Protect Existing Routes

To protect existing API routes, add the `authenticate` middleware:

### Example: Protect Orders Route
```typescript
// In packages/api/src/routes/orders.ts
import { authenticate } from '../middleware/auth.js';

export async function orderRoutes(fastify: FastifyInstance) {
  // Protect all order routes
  fastify.addHook('onRequest', authenticate);

  // Or protect individual routes:
  fastify.get('/orders', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    // Route handler
  });
}
```

### Example: Role-Based Protection
```typescript
import { requireRole } from '../middleware/auth.js';

// Admin only endpoint
fastify.delete('/orders/:id', {
  onRequest: [requireRole('admin')]
}, async (request, reply) => {
  // Only admins can delete orders
});

// Drivers and admins
fastify.patch('/orders/:id/status', {
  onRequest: [requireRole('admin', 'driver')]
}, async (request, reply) => {
  // Drivers and admins can update status
});
```

## Security Features Implemented

✅ **Password Hashing**: bcrypt with 12 rounds (SALT_ROUNDS = 12)
✅ **JWT Tokens**: 24-hour expiry for access tokens
✅ **Refresh Tokens**: 7-day expiry for refresh tokens
✅ **Role-Based Access Control**: Middleware for role checking
✅ **Input Validation**: Zod schemas for all auth endpoints
✅ **Error Handling**: Proper HTTP status codes and error messages
✅ **Account Status**: Active/inactive user support

## Default Admin Credentials

After running the migration, a default admin user is created:
- **Email**: `admin@gaztime.app`
- **Password**: `Admin123!`
- **⚠️ CHANGE THIS IMMEDIATELY IN PRODUCTION**

## Token Structure

### Access Token Payload
```json
{
  "id": "usr_...",
  "email": "user@gaztime.app",
  "role": "admin",
  "name": "User Name",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### Refresh Token Payload
```json
{
  "id": "usr_...",
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1235172090
}
```

## Files Created/Modified

### Created:
- `packages/api/src/middleware/auth.ts` - Auth middleware
- `packages/api/src/routes/auth.ts` - Auth routes
- `packages/api/src/db/create-users-table.ts` - Migration script
- `packages/api/src/db/migrations/002_create_users_table.sql` - SQL migration
- `JWT_AUTH_IMPLEMENTATION.md` - This documentation

### Modified:
- `packages/api/src/db/schema.ts` - Added users table
- `packages/api/src/server.ts` - Added JWT plugin and auth routes
- `packages/api/package.json` - Added bcrypt dependencies

## Testing Checklist

- [ ] Run migration to create users table
- [ ] Test user registration endpoint
- [ ] Test login with valid credentials
- [ ] Test login with invalid credentials
- [ ] Test protected endpoint without token (should return 401)
- [ ] Test protected endpoint with valid token (should work)
- [ ] Test refresh token endpoint
- [ ] Test role-based access control
- [ ] Test inactive user cannot login
- [ ] Apply auth to existing routes (orders, customers, etc.)

## Integration with Frontend Apps

Update frontend apps to:
1. Store JWT token in localStorage/sessionStorage
2. Add `Authorization: Bearer ${token}` header to API requests
3. Implement token refresh logic before expiry
4. Handle 401 responses (redirect to login)
5. Clear token on logout

### Example Frontend Code
```javascript
// Store token after login
localStorage.setItem('gaztime_token', data.token);
localStorage.setItem('gaztime_refresh_token', data.refreshToken);

// Add to API requests
const response = await fetch('http://api.gaztime.app/api/orders', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('gaztime_token')}`
  }
});

// Handle 401
if (response.status === 401) {
  // Try refresh token, or redirect to login
}
```

## Environment Variables

Add to `packages/api/.env`:
```env
# JWT Configuration
JWT_SECRET=your-super-secret-key-min-32-chars-change-in-production

# Optional: Token expiry (defaults shown)
JWT_ACCESS_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d
```

## Architecture Notes

- **Stateless Authentication**: JWTs are self-contained, no session storage needed
- **Dual Token System**: Short-lived access tokens + long-lived refresh tokens
- **Role-Based Model**: Users have single role, middleware checks permissions
- **Password Security**: bcrypt with 12 rounds (industry standard)
- **Migration Safe**: `CREATE TABLE IF NOT EXISTS` and `ON CONFLICT DO NOTHING`

## Future Enhancements (Not in Scope)

- [ ] Password reset flow (email-based)
- [ ] Email verification
- [ ] 2FA/MFA support
- [ ] OAuth integration (Google, Facebook)
- [ ] Rate limiting on auth endpoints (see Task #227)
- [ ] Audit log for login attempts
- [ ] JWT blacklist for logout (requires Redis)
- [ ] Password complexity requirements
- [ ] Account lockout after failed attempts

---

**Implementation Status**: ✅ Code Complete - Ready for Testing
**Next Task**: Apply authentication to existing routes and test E2E
