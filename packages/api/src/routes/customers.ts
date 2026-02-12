// ============================================================================
// Customer Routes
// REST API endpoints for customer management
// ============================================================================

import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { CustomerService } from '../services/customer.js';
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
  fastify.get('/customers', async (request, reply) => {
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
  fastify.post<{ Body: RegisterCustomerRequest }>('/customers', async (request, reply) => {
    try {
      const validatedBody = CreateCustomerSchema.parse(request.body);
      const customer = await customerService.registerCustomer(validatedBody as RegisterCustomerRequest);
      return reply.code(201).send({
        success: true,
        data: {
          customer,
          otp_sent: true, // TODO: Implement OTP sending
        },
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
  fastify.get<{ Params: { id: string } }>('/customers/:id', async (request, reply) => {
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
  fastify.get<{ Params: { phone: string } }>(
    '/customers/phone/:phone',
    async (request, reply) => {
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
  fastify.patch<{ Params: { id: string }; Body: UpdateCustomerRequest }>(
    '/customers/:id',
    async (request, reply) => {
      try {
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
  fastify.get<{ Params: { id: string } }>(
    '/customers/:id/wallet',
    async (request, reply) => {
      try {
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
  fastify.post<{ Params: { id: string }; Body: { amount: number } }>(
    '/customers/:id/wallet/topup',
    async (request, reply) => {
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
  fastify.post<{ Params: { id: string }; Body: { amount: number } }>(
    '/customers/:id/wallet/debit',
    async (request, reply) => {
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
