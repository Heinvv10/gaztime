// ============================================================================
// Product Routes Integration Tests
// Tests product listing and retrieval endpoints
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildServer } from '../../server.js';
import type { FastifyInstance } from 'fastify';
import { db } from '../../db/index.js';
import { products as productsTable } from '../../db/schema.js';
import { randomUUID } from 'crypto';

describe('Product Routes', () => {
  let app: FastifyInstance;
  let testProductId: string;

  beforeEach(async () => {
    app = await buildServer();

    // Create test products with proper schema
    const productIds = [randomUUID(), randomUUID(), randomUUID()];
    const products = await db.insert(productsTable).values([
      {
        id: productIds[0],
        name: '9kg LPG Cylinder',
        sku: 'LPG-9KG-TEST',
        size_kg: 9,
        type: 'cylinder_full',
        prices: [{ price: 315, effective_from: new Date('2024-01-01'), effective_to: null }],
        active: true,
      },
      {
        id: productIds[1],
        name: '3kg LPG Cylinder',
        sku: 'LPG-3KG-TEST',
        size_kg: 3,
        type: 'cylinder_full',
        prices: [{ price: 99, effective_from: new Date('2024-01-01'), effective_to: null }],
        active: true,
      },
      {
        id: productIds[2],
        name: 'Inactive Product',
        sku: 'LPG-INACTIVE-TEST',
        size_kg: 5,
        type: 'cylinder_full',
        prices: [{ price: 150, effective_from: new Date('2024-01-01'), effective_to: null }],
        active: false,
      },
    ]).returning();

    testProductId = products[0].id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/products', () => {
    it('should list all active products', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products',
      });

      expect(response.statusCode).toBe(200);
      const products = response.json();
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThanOrEqual(2);
      
      // Should only include active products
      const inactiveProducts = products.filter((p: any) => !p.active);
      expect(inactiveProducts.length).toBe(0);

      // Check product structure
      if (products.length > 0) {
        expect(products[0]).toHaveProperty('id');
        expect(products[0]).toHaveProperty('name');
        expect(products[0]).toHaveProperty('sku');
        expect(products[0]).toHaveProperty('sizeKg');
        expect(products[0]).toHaveProperty('type');
      }
    });

    it('should handle empty product list', async () => {
      // Clear all products
      await db.delete(productsTable);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products',
      });

      expect(response.statusCode).toBe(200);
      const products = response.json();
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBe(0);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get product by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/products/${testProductId}`,
      });

      expect(response.statusCode).toBe(200);
      const product = response.json();
      expect(product.id).toBe(testProductId);
      expect(product.name).toBe('9kg LPG Cylinder');
      expect(product.sizeKg).toBe(9);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/products/${randomUUID()}`,
      });

      expect(response.statusCode).toBe(404);
      const json = response.json();
      expect(json.error).toBe('Product not found');
    });
  });
});
