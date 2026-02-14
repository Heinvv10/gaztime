// ============================================================================
// Customer Routes - WITH RBAC IMPLEMENTATION
// REST API endpoints for customer management
// ============================================================================

import type { FastifyInstance, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { CustomerService } from '../services/customer.js';
import { authenticate, requireRole, type AuthUser } from '../middleware/auth.js';
import type {
  RegisterCustomerRequest,
  UpdateCustomerRequest,
  TopUpWalletRequest,
  DebitWalletRequest,
} from '../../../shared/src/types.js';
import { CreateCustomerSchema } from '../validation.js';

export async function customerRoutes(fastify: FastifyInstance) {
  const customerService = new CustomerService(fastify.db as any);

  // List all customers
  // Accessible by: admin, operator only (unchanged - already has RBAC)
  fastify.get('/customers', {
    onRequest: [requireRole('admin', 'operator')],
  }, async (request: any, reply) => {
    try {
      const { db } = await import('../db/index.js');
      const { customers } = await import('../db/schema.js');
      const allCustomers = await db.select().from(customers);
      // Map snake_case DB fields to camelCase for frontend
      const mapped = allCustomers.map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        addresses: c.addresses || [],
        walletBalance: c.wallet_balance ?? 0,
        referralCode: c.referral_code,
        referredBy: c.referred_by,
        segment: c.segment,
        languagePreference: c.language_preference,
        status: c.status,
        createdAt: c.created_at,
      }));
      return reply.send(mapped);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Register new customer
  // ✅ RBAC: admin, operator can register any customer; customers can register themselves
  fastify.post<{ Body: RegisterCustomerRequest }>('/customers', {
    onRequest: [authenticate],
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request: any, reply) => {
    try {
      const user = request.user as AuthUser;
      const validatedBody = CreateCustomerSchema.parse(request.body);

      // ✅ NEW: If customer role, they're likely registering themselves
      // In practice, customers wouldn't call this endpoint after being authenticated
      // This endpoint is mainly for admin/operator to create customer accounts
      // But we allow it for flexibility

      // Normalize: frontend sends addresses[] or address{}
      const normalized: any = { ...validatedBody };
      if (normalized.addresses && !normalized.address) {
        normalized.address = normalized.addresses[0];
      }
      if (normalized.language && !normalized.languagePreference) {
        normalized.languagePreference = normalized.language;
      }
      const customer = await customerService.registerCustomer(normalized as RegisterCustomerRequest);
      return reply.code(201).send({
        success: true,
        data: customer,
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        });
      }
      return reply.code(400).send({
        success: false,
        error: {
          code: 'CUSTOMER_REGISTER_FAILED',
          message: error.message,
        },
      });
    }
  });

  // Get customer by ID
  // ✅ RBAC: admin, operator see all; customers see only their own profile
  fastify.get<{ Params: { id: string } }>('/customers/:id', {
    onRequest: [authenticate],
  }, async (request: any, reply) => {
    const user = request.user as AuthUser;

    // ✅ NEW: Customers can only access their own profile
    if (user.role === 'customer' && request.params.id !== user.id) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Customers can only access their own profile',
        },
      });
    }

    const customer = await customerService.getCustomer(request.params.id);

    if (!customer) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found',
        },
      });
    }

    return reply.send({ success: true, data: customer });
  });

  // Get customer by phone
  // Accessible by: admin, operator (unchanged - already has RBAC)
  fastify.get<{ Params: { phone: string } }>(
    '/customers/phone/:phone',
    {
      onRequest: [requireRole('admin', 'operator')],
    },
    async (request: any, reply) => {
      const customer = await customerService.getCustomerByPhone(request.params.phone);

      if (!customer) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found',
          },
        });
      }

      return reply.send({ success: true, data: customer });
    }
  );

  // Update customer
  // ✅ RBAC: admin, operator can update any; customers can only update their own profile
  fastify.patch<{ Params: { id: string }; Body: UpdateCustomerRequest }>(
    '/customers/:id',
    {
      onRequest: [authenticate],
    },
    async (request: any, reply) => {
      try {
        const user = request.user as AuthUser;

        // ✅ NEW: Customers can only update their own profile
        if (user.role === 'customer' && request.params.id !== user.id) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Customers can only update their own profile',
            },
          });
        }

        const customer = await customerService.updateCustomer(request.params.id, request.body);
        return reply.send({ success: true, data: customer });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'CUSTOMER_UPDATE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get wallet balance
  // ✅ RBAC: admin, operator see all; customers see only their own wallet
  fastify.get<{ Params: { id: string } }>(
    '/customers/:id/wallet',
    {
      onRequest: [authenticate],
    },
    async (request: any, reply) => {
      try {
        const user = request.user as AuthUser;

        // ✅ NEW: Customers can only view their own wallet
        if (user.role === 'customer' && request.params.id !== user.id) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Customers can only view their own wallet',
            },
          });
        }

        const balance = await customerService.getWalletBalance(request.params.id);
        return reply.send({ success: true, data: { balance } });
      } catch (error: any) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: error.message,
          },
        });
      }
    }
  );

  // Top up wallet
  // Accessible by: admin, operator only (unchanged - already has RBAC)
  // Customers should NOT be able to directly top up their own wallet (payment processing required)
  fastify.post<{ Params: { id: string }; Body: { amount: number } }>(
    '/customers/:id/wallet/topup',
    {
      onRequest: [requireRole('admin', 'operator')],
    },
    async (request: any, reply) => {
      try {
        await customerService.topUpWallet(request.params.id, request.body.amount);
        const balance = await customerService.getWalletBalance(request.params.id);
        return reply.send({ success: true, data: { balance } });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'WALLET_TOPUP_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Debit wallet
  // Accessible by: admin, operator only (unchanged - already has RBAC)
  // This is for manual corrections, not for order processing
  fastify.post<{ Params: { id: string }; Body: { amount: number } }>(
    '/customers/:id/wallet/debit',
    {
      onRequest: [requireRole('admin', 'operator')],
    },
    async (request: any, reply) => {
      try {
        await customerService.debitWallet(request.params.id, request.body.amount);
        const balance = await customerService.getWalletBalance(request.params.id);
        return reply.send({ success: true, data: { balance } });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'WALLET_DEBIT_FAILED',
            message: error.message,
          },
        });
      }
    }
  );
}
