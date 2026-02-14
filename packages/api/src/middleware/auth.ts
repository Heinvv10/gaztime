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
