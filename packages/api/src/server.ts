// ============================================================================
// Gaz Time API Server
// Main Fastify server with all routes
// ============================================================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
// Rate limiting temporarily disabled - package not installed
// import rateLimit from '@fastify/rate-limit';
import { db } from './db/index.js';
import { orderRoutes } from './routes/orders.js';
import { customerRoutes } from './routes/customers.js';
import { inventoryRoutes } from './routes/inventory.js';
import { driverRoutes } from './routes/drivers.js';
import { productRoutes } from './routes/products.js';
import { podRoutes } from './routes/pods.js';
import { authRoutes } from './routes/auth.js';

// Extend Fastify instance with db
declare module 'fastify' {
  interface FastifyInstance {
    db: typeof db;
  }
}

async function buildServer() {
  const fastify = Fastify({
    logger: process.env.NODE_ENV === 'production'
      ? true
      : {
          level: process.env.LOG_LEVEL || 'info',
        },
  });

  // Register CORS - restrict to Gaztime domains only
  const allowedOrigins = [
    'https://gaztime.app',
    'https://www.gaztime.app',
    'https://admin.gaztime.app',
    'https://driver.gaztime.app',
    'https://pos.gaztime.app',
    'https://gaztime.com',
    'https://www.gaztime.com',
    // Development origins
    'http://localhost:3007',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://172.17.0.1:3007',
  ];

  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) {
        cb(null, true);
        return;
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }

      // Allow custom origin from env var (for testing)
      if (process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN) {
        cb(null, true);
        return;
      }

      // Reject all other origins
      cb(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true, // Allow cookies for authentication
  });

  // Register JWT
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'development-secret-change-in-production-2024',
  });

  // Rate limiting temporarily disabled - package not installed
  // TODO: Install @fastify/rate-limit and uncomment
  // await fastify.register(rateLimit, {
  //   global: true,
  //   max: 100,
  //   timeWindow: '1 minute',
  // });

  // Add database to fastify instance
  fastify.decorate('db', db);

  // Health check endpoint
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // API info endpoint
  fastify.get('/api', async () => {
    return {
      name: 'Gaz Time API',
      version: '0.1.0',
      description: 'LPG delivery platform backend',
      endpoints: {
        auth: '/api/auth',
        orders: '/api/orders',
        customers: '/api/customers',
        inventory: '/api/inventory',
        drivers: '/api/drivers',
        products: '/api/products',
        pods: '/api/pods',
      },
    };
  });

  // Register API routes
  await fastify.register(authRoutes, { prefix: '/api' }); // Auth routes (public)
  await fastify.register(orderRoutes, { prefix: '/api' });
  await fastify.register(customerRoutes, { prefix: '/api' });
  await fastify.register(inventoryRoutes, { prefix: '/api' });
  await fastify.register(driverRoutes, { prefix: '/api' });
  await fastify.register(productRoutes, { prefix: '/api' });
  await fastify.register(podRoutes, { prefix: '/api' });

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    reply.code(error.statusCode || 500).send({
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An unexpected error occurred',
      },
    });
  });

  return fastify;
}

// Start server if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = parseInt(process.env.PORT || '3333');
  const HOST = process.env.HOST || '0.0.0.0';

  buildServer()
    .then(async (server) => {
      try {
        await server.listen({ port: PORT, host: HOST });
        console.log(`🚀 Gaz Time API running on http://${HOST}:${PORT}`);
        console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
        console.log(`📚 API info: http://${HOST}:${PORT}/api`);
        console.log(`🔐 Auth endpoints: http://${HOST}:${PORT}/api/auth`);
      } catch (err) {
        server.log.error(err);
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Failed to build server:', err);
      process.exit(1);
    });
}

export { buildServer };
