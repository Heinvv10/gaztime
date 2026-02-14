// ============================================================================
// Customer Routes Integration Tests
// Tests customer endpoints, wallet operations, validation
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildServer } from '../../server.js';
import type { FastifyInstance } from 'fastify';

describe('Customer Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildServer();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/customers', () => {
    it('should register a new customer', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers',
        payload: {
          name: 'John Doe',
          phone: '+27781234567',
          address: { text: '123 Main St', isDefault: true },
        },
      });

      expect(response.statusCode).toBe(201);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();
      expect(json.data.name).toBe('John Doe');
      expect(json.data.phone).toBe('+27781234567');
      expect(json.data.referralCode).toMatch(/^REF-/);
      expect(json.data.walletBalance).toBe(0);
    });

    it('should reject duplicate phone number', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/customers',
        payload: {
          name: 'John Doe',
          phone: '+27781234567',
          address: { text: '123 Main St', isDefault: true },
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/customers',
        payload: {
          name: 'Jane Doe',
          phone: '+27781234567',
          address: { text: '456 Oak St', isDefault: true },
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.message).toContain('phone number already exists');
    });

    it('should validate required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers',
        payload: {
          phone: '+27781234567',
          // Missing name
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept multiple addresses', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers',
        payload: {
          name: 'Multi Address',
          phone: '+27782222222',
          addresses: [
            { text: '123 Home St', isDefault: true, label: 'Home' },
            { text: '456 Work St', isDefault: false, label: 'Work' },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      const json = response.json();
      expect(json.data.addresses).toHaveLength(2);
    });

    it('should handle referral code', async () => {
      // Create referrer
      const referrerRes = await app.inject({
        method: 'POST',
        url: '/api/customers',
        payload: {
          name: 'Referrer',
          phone: '+27781111111',
          address: { text: '123 St', isDefault: true },
        },
      });
      const referralCode = referrerRes.json().data.referralCode;

      // Create referred customer
      const response = await app.inject({
        method: 'POST',
        url: '/api/customers',
        payload: {
          name: 'Referred',
          phone: '+27782222222',
          address: { text: '456 St', isDefault: true },
          referredBy: referralCode,
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().data.referredBy).toBeDefined();
    });
  });

  describe('GET /api/customers', () => {
    it('should list all customers', async () => {
      // Create 2 customers
      await app.inject({
        method: 'POST',
        url: '/api/customers',
        payload: {
          name: 'Customer 1',
          phone: '+27781111111',
          address: { text: '123 St', isDefault: true },
        },
      });
      await app.inject({
        method: 'POST',
        url: '/api/customers',
        payload: {
          name: 'Customer 2',
          phone: '+27782222222',
          address: { text: '456 St', isDefault: true },
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/customers',
      });

      expect(response.statusCode).toBe(200);
      const customers = response.json();
      expect(customers.length).toBeGreaterThanOrEqual(2);
      expect(customers[0].id).toBeDefined();
      expect(customers[0].name).toBeDefined();
    });
  });

  describe('GET /api/customers/phone/:phone', () => {
    it('should get customer by phone', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/customers',
        payload: {
          name: 'Phone Test',
          phone: '+27789999999',
          address: { text: '123 St', isDefault: true },
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/customers/phone/+27789999999',
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.phone).toBe('+27789999999');
    });

    it('should return 404 for non-existent phone', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/customers/phone/+27700000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should get customer by id', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/customers',
        payload: {
          name: 'ID Test',
          phone: '+27788888888',
          address: { text: '123 St', isDefault: true },
        },
      });
      const customerId = createRes.json().data.id;

      const response = await app.inject({
        method: 'GET',
        url: `/api/customers/${customerId}`,
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(customerId);
    });

    it('should return 404 for non-existent customer', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/customers/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/customers/:id', () => {
    it('should update customer details', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/customers',
        payload: {
          name: 'Original Name',
          phone: '+27787777777',
          address: { text: '123 St', isDefault: true },
        },
      });
      const customerId = createRes.json().data.id;

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/customers/${customerId}`,
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.name).toBe('Updated Name');
    });
  });

  describe('Wallet Operations', () => {
    let customerId: string;

    beforeEach(async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/customers',
        payload: {
          name: 'Wallet Test',
          phone: '+27786666666',
          address: { text: '123 St', isDefault: true },
        },
      });
      customerId = createRes.json().data.id;
    });

    describe('POST /api/customers/:id/wallet/topup', () => {
      it('should top up customer wallet', async () => {
        const response = await app.inject({
          method: 'POST',
          url: `/api/customers/${customerId}/wallet/topup`,
          payload: {
            amount: 500,
            method: 'eft',
          },
        });

        expect(response.statusCode).toBe(200);
        const json = response.json();
        expect(json.success).toBe(true);
        expect(json.data.walletBalance).toBe(500);
      });

      it('should reject negative amount', async () => {
        const response = await app.inject({
          method: 'POST',
          url: `/api/customers/${customerId}/wallet/topup`,
          payload: {
            amount: -100,
            method: 'eft',
          },
        });

        expect(response.statusCode).toBe(400);
      });

      it('should reject zero amount', async () => {
        const response = await app.inject({
          method: 'POST',
          url: `/api/customers/${customerId}/wallet/topup`,
          payload: {
            amount: 0,
            method: 'eft',
          },
        });

        expect(response.statusCode).toBe(400);
      });
    });

    describe('POST /api/customers/:id/wallet/debit', () => {
      beforeEach(async () => {
        // Top up first
        await app.inject({
          method: 'POST',
          url: `/api/customers/${customerId}/wallet/topup`,
          payload: {
            amount: 1000,
            method: 'eft',
          },
        });
      });

      it('should debit wallet successfully', async () => {
        const response = await app.inject({
          method: 'POST',
          url: `/api/customers/${customerId}/wallet/debit`,
          payload: {
            amount: 300,
            reference: 'ORDER-123',
          },
        });

        expect(response.statusCode).toBe(200);
        const json = response.json();
        expect(json.success).toBe(true);
        expect(json.data.walletBalance).toBe(700);
      });

      it('should reject insufficient funds', async () => {
        const response = await app.inject({
          method: 'POST',
          url: `/api/customers/${customerId}/wallet/debit`,
          payload: {
            amount: 2000,
            reference: 'ORDER-124',
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().error.message).toContain('Insufficient');
      });
    });

    describe('GET /api/customers/:id/wallet/transactions', () => {
      it('should get wallet transaction history', async () => {
        // Create some transactions
        await app.inject({
          method: 'POST',
          url: `/api/customers/${customerId}/wallet/topup`,
          payload: { amount: 500, method: 'eft' },
        });
        await app.inject({
          method: 'POST',
          url: `/api/customers/${customerId}/wallet/topup`,
          payload: { amount: 300, method: 'cash' },
        });

        const response = await app.inject({
          method: 'GET',
          url: `/api/customers/${customerId}/wallet/transactions`,
        });

        expect(response.statusCode).toBe(200);
        const json = response.json();
        expect(json.success).toBe(true);
        expect(json.data.length).toBeGreaterThanOrEqual(2);
        expect(json.data[0].type).toBeDefined();
        expect(json.data[0].amount).toBeDefined();
      });
    });
  });
});
