// ============================================================================
// Order Routes Integration Tests
// Tests all order endpoints with validation, auth checks, error handling
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildServer } from '../../server.js';
import type { FastifyInstance } from 'fastify';
import { CustomerService } from '../../services/customer.js';
import { db } from '../../db/index.js';
import { products as productsTable, drivers as driversTable } from '../../db/schema.js';

describe('Order Routes', () => {
  let app: FastifyInstance;
  let customerService: CustomerService;
  let testCustomerId: string;
  let testProductId: string;

  beforeEach(async () => {
    app = await buildServer();
    customerService = new CustomerService(db);

    // Create test customer
    const customer = await customerService.registerCustomer({
      phone: '+27781234567',
      name: 'Test Customer',
      address: { text: '123 Test St', isDefault: true },
    });
    testCustomerId = customer.id;

    // Create test product
    const product = await db.insert(productsTable).values({
      name: '9kg Gas',
      sku: 'GAS-9KG',
      sizeKg: 9,
      type: 'cylinder_full',
      price: 350,
      active: true,
    }).returning();
    testProductId = product[0].id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/orders', () => {
    it('should create a new order with valid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: {
          customerId: testCustomerId,
          channel: 'app',
          items: [{ productId: testProductId, quantity: 2 }],
          paymentMethod: 'cash',
        },
      });

      expect(response.statusCode).toBe(201);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();
      expect(json.data.customerId).toBe(testCustomerId);
      expect(json.data.status).toBe('pending');
      expect(json.data.items).toHaveLength(1);
      expect(json.data.items[0].quantity).toBe(2);
    });

    it('should create order without customer (walk-in)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: {
          channel: 'pos',
          items: [{ productId: testProductId, quantity: 1 }],
          paymentMethod: 'cash',
        },
      });

      expect(response.statusCode).toBe(201);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.customerId).toBeNull();
    });

    it('should reject order with invalid channel', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: {
          customerId: testCustomerId,
          channel: 'invalid_channel',
          items: [{ productId: testProductId, quantity: 1 }],
          paymentMethod: 'cash',
        },
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject order with empty items array', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: {
          customerId: testCustomerId,
          channel: 'app',
          items: [],
          paymentMethod: 'cash',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject order with invalid product quantity', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: {
          customerId: testCustomerId,
          channel: 'app',
          items: [{ productId: testProductId, quantity: -1 }],
          paymentMethod: 'cash',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept delivery address with location', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: {
          customerId: testCustomerId,
          channel: 'app',
          items: [{ productId: testProductId, quantity: 1 }],
          deliveryAddress: {
            text: '456 New Address',
            location: { lat: -26.2041, lng: 28.0473 },
            landmark: 'Near big tree',
          },
          paymentMethod: 'cash',
        },
      });

      expect(response.statusCode).toBe(201);
      const json = response.json();
      expect(json.data.deliveryAddress.text).toBe('456 New Address');
      expect(json.data.deliveryAddress.landmark).toBe('Near big tree');
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should get order by id', async () => {
      // Create order first
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: {
          customerId: testCustomerId,
          channel: 'app',
          items: [{ productId: testProductId, quantity: 1 }],
          paymentMethod: 'cash',
        },
      });
      const orderId = createRes.json().data.id;

      // Get order
      const response = await app.inject({
        method: 'GET',
        url: `/api/orders/${orderId}`,
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(orderId);
      expect(json.data.customer).toBeDefined();
      expect(json.data.customer.name).toBe('Test Customer');
    });

    it('should return 404 for non-existent order', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/orders/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error.code).toBe('ORDER_NOT_FOUND');
    });
  });

  describe('GET /api/orders', () => {
    it('should list all orders', async () => {
      // Create 2 orders
      await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: {
          customerId: testCustomerId,
          channel: 'app',
          items: [{ productId: testProductId, quantity: 1 }],
          paymentMethod: 'cash',
        },
      });
      await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: {
          customerId: testCustomerId,
          channel: 'app',
          items: [{ productId: testProductId, quantity: 2 }],
          paymentMethod: 'wallet',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/orders',
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(2);
      expect(json.data[0].customer).toBeDefined();
      expect(json.data[0].items[0].product).toBeDefined();
    });

    it('should filter orders by status', async () => {
      // Create order and update status
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: {
          customerId: testCustomerId,
          channel: 'app',
          items: [{ productId: testProductId, quantity: 1 }],
          paymentMethod: 'cash',
        },
      });
      const orderId = createRes.json().data.id;

      await app.inject({
        method: 'PATCH',
        url: `/api/orders/${orderId}/status`,
        payload: { status: 'confirmed' },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/orders?status=confirmed',
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.data.every((o: any) => o.status === 'confirmed')).toBe(true);
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('should update order status', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: {
          customerId: testCustomerId,
          channel: 'app',
          items: [{ productId: testProductId, quantity: 1 }],
          paymentMethod: 'cash',
        },
      });
      const orderId = createRes.json().data.id;

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/orders/${orderId}/status`,
        payload: { status: 'confirmed' },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('confirmed');
    });

    it('should reject invalid status', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: {
          customerId: testCustomerId,
          channel: 'app',
          items: [{ productId: testProductId, quantity: 1 }],
          paymentMethod: 'cash',
        },
      });
      const orderId = createRes.json().data.id;

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/orders/${orderId}/status`,
        payload: { status: 'invalid_status' },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/orders/:id/cancel', () => {
    it('should cancel order with reason', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: {
          customerId: testCustomerId,
          channel: 'app',
          items: [{ productId: testProductId, quantity: 1 }],
          paymentMethod: 'cash',
        },
      });
      const orderId = createRes.json().data.id;

      const response = await app.inject({
        method: 'POST',
        url: `/api/orders/${orderId}/cancel`,
        payload: { reason: 'Customer changed mind' },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('cancelled');
    });
  });

  describe('POST /api/orders/:id/assign', () => {
    it('should assign driver to order', async () => {
      // Create driver first
      const driver = await db.insert(driversTable).values({
        name: 'Test Driver',
        phone: '+27789999999',
        status: 'active',
        available: true,
      }).returning();

      const createRes = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: {
          customerId: testCustomerId,
          channel: 'app',
          items: [{ productId: testProductId, quantity: 1 }],
          paymentMethod: 'cash',
        },
      });
      const orderId = createRes.json().data.id;

      const response = await app.inject({
        method: 'POST',
        url: `/api/orders/${orderId}/assign`,
        payload: { driverId: driver[0].id },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.driverId).toBe(driver[0].id);
    });

    it('should reject invalid driver id format', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: {
          customerId: testCustomerId,
          channel: 'app',
          items: [{ productId: testProductId, quantity: 1 }],
          paymentMethod: 'cash',
        },
      });
      const orderId = createRes.json().data.id;

      const response = await app.inject({
        method: 'POST',
        url: `/api/orders/${orderId}/assign`,
        payload: { driverId: 'not-a-uuid' },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe('VALIDATION_ERROR');
    });
  });
});
