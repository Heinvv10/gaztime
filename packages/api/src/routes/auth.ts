import { FastifyRequest } from 'fastify';
// ============================================================================
// Authentication Routes
// Login, register, refresh token endpoints
// ============================================================================

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
// FastifyRequest from fastify;

const SALT_ROUNDS = 12;

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'driver', 'operator', 'customer']).default('customer'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/auth/register
   * Register a new user
   * Rate limit: 10 requests per minute
   */
  fastify.post('/auth/register', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);

      // Check if user already exists
      const existingUser = await fastify.db
        .select()
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);

      if (existingUser.length > 0) {
        return reply.code(409).send({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists',
          },
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS);

      // Create user
      const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const [newUser] = await fastify.db
        .insert(users)
        .values({
          id: userId,
          email: body.email,
          password_hash: passwordHash,
          name: body.name,
          phone: body.phone || null,
          role: body.role,
          active: true,
          created_at: new Date(),
          last_login_at: null,
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
        });

      // Generate JWT token
      const token = fastify.jwt.sign({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
      });

      // Generate refresh token (expires in 7 days)
      const refreshToken = fastify.jwt.sign(
        { id: newUser.id, type: 'refresh' },
        { expiresIn: '7d' }
      );

      return reply.code(201).send({
        success: true,
        data: {
          user: newUser,
          token,
          refreshToken,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        });
      }
      throw error;
    }
  });

  /**
   * POST /api/auth/login
   * Authenticate user and get token
   * Rate limit: 10 requests per minute (prevents brute force)
   */
  fastify.post('/auth/login', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);

      // Find user
      const [user] = await fastify.db
        .select()
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
      }

      // Check if user is active
      if (!user.active) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Your account has been disabled',
          },
        });
      }

      // Verify password
      const passwordValid = await bcrypt.compare(body.password, user.password_hash);

      if (!passwordValid) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
      }

      // Update last login
      await fastify.db
        .update(users)
        .set({ last_login_at: new Date() })
        .where(eq(users.id, user.id));

      // Generate JWT token (expires in 24 hours)
      const token = fastify.jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
        { expiresIn: '24h' }
      );

      // Generate refresh token (expires in 7 days)
      const refreshToken = fastify.jwt.sign(
        { id: user.id, type: 'refresh' },
        { expiresIn: '7d' }
      );

      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
          },
          token,
          refreshToken,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        });
      }
      throw error;
    }
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   * Rate limit: 20 requests per minute
   */
  fastify.post('/auth/refresh', {
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    try {
      const { refreshToken } = request.body as { refreshToken: string };

      if (!refreshToken) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Refresh token is required',
          },
        });
      }

      // Verify refresh token
      const decoded = fastify.jwt.verify(refreshToken) as {
        id: string;
        type: string;
      };

      if (decoded.type !== 'refresh') {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid refresh token',
          },
        });
      }

      // Get user
      const [user] = await fastify.db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          active: users.active,
        })
        .from(users)
        .where(eq(users.id, decoded.id))
        .limit(1);

      if (!user || !user.active) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found or inactive',
          },
        });
      }

      // Generate new access token
      const newToken = fastify.jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
        { expiresIn: '24h' }
      );

      return reply.send({
        success: true,
        data: {
          token: newToken,
        },
      });
    } catch (error) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired refresh token',
        },
      });
    }
  });

  /**
   * GET /api/auth/me
   * Get current authenticated user
   */
  fastify.get('/auth/me', {
    onRequest: [async (request: any, reply) => {
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
    }],
  }, async (request: any, reply) => {
    const userId = (request.user as any)?.id;

    const [user] = await fastify.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        phone: users.phone,
        active: users.active,
        created_at: users.created_at,
        last_login_at: users.last_login_at,
      })
      .from(users)
      .where(eq(users.id, userId!))
      .limit(1);

    if (!user) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    return reply.send({
      success: true,
      data: { user },
    });
  });
}
