import { FastifyRequest, FastifyReply } from 'fastify';

// Use Fastify's built-in user from @fastify/jwt
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string;
      email?: string;
      role?: string;
      name?: string;
      type?: string;
    };
    user: {
      id: string;
      email: string;
      role: string;
      name: string;
    };
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing authentication token',
      },
    });
  }
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (reply.sent) return; // Auth failed

    const user = request.user as { id: string; email: string; role: string; name: string };
    if (!user || !roles.includes(user.role)) {
      reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions for this action',
        },
      });
    }
  };
}

export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch (err) {
    // Silently fail
  }
}

// Re-export type for route handlers that need user info
export type AuthUser = { id: string; email: string; role: string; name: string };

// ============================================================================
// NEW: Resource Ownership Validation
// ============================================================================

/**
 * Check if the authenticated user can access a specific resource
 *
 * Rules:
 * - Admin and Operator: Can access all resources
 * - Driver: Can only access their own driver record and assigned orders
 * - Customer: Can only access their own customer record and orders
 */
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

  // For orders, specific logic is handled in the route handler
  // because we need to check customerId or driverId from the database
  return true;
}

/**
 * Middleware factory for resource ownership checks
 * Combines authentication with ownership validation
 */
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
