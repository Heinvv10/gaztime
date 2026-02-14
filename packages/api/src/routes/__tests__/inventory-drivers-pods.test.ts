// ============================================================================
// Inventory, Drivers, Pods, Products Routes Integration Tests
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildServer } from '../../server.js';
import type { FastifyInstance } from 'fastify';
import { db } from '../../db/index.js';
import { pods as podsTable, depots as depotsTable } from '../../db/schema.js';

describe('Inventory Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildServer();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/inventory/cylinders', () => {
    it('should list all cylinders', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/inventory/cylinders',
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });
  });

  describe('GET /api/inventory/stock', () => {
    it('should get stock levels', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/inventory/stock',
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
    });
  });
});

describe('Driver Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildServer();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/drivers', () => {
    it('should create a new driver', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/drivers',
        payload: {
          name: 'Test Driver',
          phone: '+27781234567',
          licenseNumber: 'DL12345',
        },
      });

      expect(response.statusCode).toBe(201);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.name).toBe('Test Driver');
      expect(json.data.status).toBe('active');
    });

    it('should reject duplicate phone number', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/drivers',
        payload: {
          name: 'Driver 1',
          phone: '+27781234567',
          licenseNumber: 'DL111',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/drivers',
        payload: {
          name: 'Driver 2',
          phone: '+27781234567',
          licenseNumber: 'DL222',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/drivers', () => {
    it('should list all drivers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/drivers',
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });

    it('should filter available drivers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/drivers?available=true',
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.data.every((d: any) => d.available === true)).toBe(true);
    });
  });

  describe('GET /api/drivers/:id', () => {
    it('should get driver by id', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/drivers',
        payload: {
          name: 'Test Driver',
          phone: '+27782222222',
          licenseNumber: 'DL333',
        },
      });
      const driverId = createRes.json().data.id;

      const response = await app.inject({
        method: 'GET',
        url: `/api/drivers/${driverId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.id).toBe(driverId);
    });

    it('should return 404 for non-existent driver', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/drivers/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/drivers/:id/location', () => {
    it('should update driver location', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/drivers',
        payload: {
          name: 'Location Driver',
          phone: '+27783333333',
          licenseNumber: 'DL444',
        },
      });
      const driverId = createRes.json().data.id;

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/drivers/${driverId}/location`,
        payload: {
          location: {
            lat: -26.2041,
            lng: 28.0473,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.currentLocation).toBeDefined();
    });

    it('should reject invalid coordinates', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/drivers',
        payload: {
          name: 'Test Driver',
          phone: '+27784444444',
          licenseNumber: 'DL555',
        },
      });
      const driverId = createRes.json().data.id;

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/drivers/${driverId}/location`,
        payload: {
          location: {
            lat: 91, // Invalid latitude (> 90)
            lng: 28.0473,
          },
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /api/drivers/:id/status', () => {
    it('should update driver status', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/drivers',
        payload: {
          name: 'Status Driver',
          phone: '+27785555555',
          licenseNumber: 'DL666',
        },
      });
      const driverId = createRes.json().data.id;

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/drivers/${driverId}/status`,
        payload: {
          status: 'inactive',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.status).toBe('inactive');
    });
  });
});

describe('POD Routes', () => {
  let app: FastifyInstance;
  let testDepotId: string;

  beforeEach(async () => {
    app = await buildServer();

    // Create test depot
    const depot = await db.insert(depotsTable).values({
      name: 'Test Depot',
      location: { lat: -26.2041, lng: 28.0473 },
    }).returning();
    testDepotId = depot[0].id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/pods', () => {
    it('should create a new POD', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pods',
        payload: {
          name: 'Test POD',
          location: { lat: -26.2041, lng: 28.0473 },
          depotId: testDepotId,
        },
      });

      expect(response.statusCode).toBe(201);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.name).toBe('Test POD');
      expect(json.data.status).toBe('active');
    });
  });

  describe('GET /api/pods', () => {
    it('should list all PODs', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/pods',
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });
  });

  describe('GET /api/pods/:id', () => {
    it('should get POD by id', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/pods',
        payload: {
          name: 'Get Test POD',
          location: { lat: -26.2041, lng: 28.0473 },
          depotId: testDepotId,
        },
      });
      const podId = createRes.json().data.id;

      const response = await app.inject({
        method: 'GET',
        url: `/api/pods/${podId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.id).toBe(podId);
    });

    it('should return 404 for non-existent POD', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/pods/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });
});

describe('Product Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildServer();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: {
          name: '9kg Gas Cylinder',
          sku: 'GAS-9KG',
          sizeKg: 9,
          type: 'cylinder_full',
          price: 350,
          active: true,
        },
      });

      expect(response.statusCode).toBe(201);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.name).toBe('9kg Gas Cylinder');
      expect(json.data.price).toBe(350);
    });

    it('should reject duplicate SKU', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: {
          name: 'Product 1',
          sku: 'DUPLICATE-SKU',
          sizeKg: 9,
          type: 'cylinder_full',
          price: 100,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: {
          name: 'Product 2',
          sku: 'DUPLICATE-SKU',
          sizeKg: 9,
          type: 'cylinder_full',
          price: 200,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject invalid product type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: {
          name: 'Bad Product',
          sku: 'BAD-PROD',
          sizeKg: 9,
          type: 'invalid_type',
          price: 100,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject negative price', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: {
          name: 'Negative Price',
          sku: 'NEG-PRICE',
          sizeKg: 9,
          type: 'cylinder_full',
          price: -100,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/products', () => {
    it('should list all products', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products',
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });

    it('should filter active products', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products?active=true',
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.data.every((p: any) => p.active === true)).toBe(true);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get product by id', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: {
          name: 'Get Test Product',
          sku: 'GET-TEST',
          sizeKg: 9,
          type: 'cylinder_full',
          price: 250,
        },
      });
      const productId = createRes.json().data.id;

      const response = await app.inject({
        method: 'GET',
        url: `/api/products/${productId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.id).toBe(productId);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/products/:id', () => {
    it('should update product details', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: {
          name: 'Original Product',
          sku: 'ORIG-PROD',
          sizeKg: 9,
          type: 'cylinder_full',
          price: 300,
        },
      });
      const productId = createRes.json().data.id;

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/products/${productId}`,
        payload: {
          price: 350,
          name: 'Updated Product',
        },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.data.price).toBe(350);
      expect(json.data.name).toBe('Updated Product');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should deactivate product', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/products',
        payload: {
          name: 'Delete Test',
          sku: 'DEL-TEST',
          sizeKg: 9,
          type: 'cylinder_full',
          price: 200,
        },
      });
      const productId = createRes.json().data.id;

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/products/${productId}`,
      });

      expect(response.statusCode).toBe(200);

      // Verify product is deactivated
      const getRes = await app.inject({
        method: 'GET',
        url: `/api/products/${productId}`,
      });
      expect(getRes.json().data.active).toBe(false);
    });
  });
});
