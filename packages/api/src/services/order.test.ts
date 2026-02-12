// ============================================================================
// Order Service Tests
// TDD: Write tests first, then implement
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { OrderService } from './order.js';
import { db } from '../db/index.js';
import {
  createTestCustomer,
  createTestProduct,
  createTestOrderRequest,
  createTestDriver,
} from '../test/factories.js';
import { customers, products, drivers } from '../db/schema.js';
import { OrderStatus } from '../../../shared/src/types.js';

describe('OrderService', () => {
  let orderService: OrderService;
  let testCustomer: any;
  let testProduct: any;

  beforeEach(async () => {
    orderService = new OrderService(db);

    // Create test customer and product
    testCustomer = createTestCustomer();
    testProduct = createTestProduct();

    await db.insert(customers).values(testCustomer);
    await db.insert(products).values(testProduct);
  });

  describe('createOrder', () => {
    it('should create a new order with generated reference', async () => {
      const request = createTestOrderRequest({
        customerId: testCustomer.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 1,
            unitPrice: 315,
          },
        ],
      });

      const order = await orderService.createOrder(request);

      expect(order.id).toBeDefined();
      expect(order.reference).toMatch(/^GT-\d{4}$/);
      expect(order.customerId).toBe(testCustomer.id);
      expect(order.status).toBe('created');
      expect(order.channel).toBe(request.channel);
      expect(order.items).toHaveLength(1);
      expect(order.items[0].total).toBe(315);
      expect(order.totalAmount).toBe(315);
      expect(order.paymentStatus).toBe('pending');
    });

    it('should calculate item totals correctly', async () => {
      const request = createTestOrderRequest({
        customerId: testCustomer.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 3,
            unitPrice: 315,
          },
        ],
      });

      const order = await orderService.createOrder(request);

      expect(order.items[0].total).toBe(945); // 3 * 315
      expect(order.totalAmount).toBe(945);
    });

    it('should handle multiple items in an order', async () => {
      const product2 = createTestProduct({ id: 'prod2', sizeKg: 19, sku: 'LPG-19KG' });
      await db.insert(products).values(product2);

      const request = createTestOrderRequest({
        customerId: testCustomer.id,
        items: [
          { productId: testProduct.id, quantity: 2, unitPrice: 315 },
          { productId: product2.id, quantity: 1, unitPrice: 550 },
        ],
      });

      const order = await orderService.createOrder(request);

      expect(order.items).toHaveLength(2);
      expect(order.totalAmount).toBe(1180); // (2*315) + 550
    });

    it('should throw error if customer does not exist', async () => {
      const request = createTestOrderRequest({
        customerId: 'non-existent-customer',
      });

      await expect(orderService.createOrder(request)).rejects.toThrow('Customer not found');
    });
  });

  describe('getOrder', () => {
    it('should retrieve an order by id', async () => {
      const request = createTestOrderRequest({ customerId: testCustomer.id });
      const created = await orderService.createOrder(request);

      const retrieved = await orderService.getOrder(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.reference).toBe(created.reference);
    });

    it('should return null for non-existent order', async () => {
      const retrieved = await orderService.getOrder('non-existent');

      expect(retrieved).toBeNull();
    });
  });

  describe('updateOrderStatus', () => {
    it('should transition order from created to confirmed', async () => {
      const request = createTestOrderRequest({ customerId: testCustomer.id });
      const order = await orderService.createOrder(request);

      const updated = await orderService.updateOrderStatus(order.id, 'confirmed');

      expect(updated.status).toBe('confirmed');
    });

    it('should transition through the full order lifecycle', async () => {
      const request = createTestOrderRequest({ customerId: testCustomer.id });
      const order = await orderService.createOrder(request);

      // created → confirmed
      let updated = await orderService.updateOrderStatus(order.id, 'confirmed');
      expect(updated.status).toBe('confirmed');

      // confirmed → assigned
      updated = await orderService.updateOrderStatus(order.id, 'assigned', {
        driverId: 'driver123',
      });
      expect(updated.status).toBe('assigned');
      expect(updated.driverId).toBe('driver123');
      expect(updated.assignedAt).toBeDefined();

      // assigned → in_transit
      updated = await orderService.updateOrderStatus(order.id, 'in_transit');
      expect(updated.status).toBe('in_transit');

      // in_transit → delivered
      updated = await orderService.updateOrderStatus(order.id, 'delivered', {
        deliveryProof: {
          type: 'photo',
          url: 'https://example.com/proof.jpg',
        },
      });
      expect(updated.status).toBe('delivered');
      expect(updated.deliveredAt).toBeDefined();
      expect(updated.deliveryProof).toBeDefined();

      // delivered → completed
      updated = await orderService.updateOrderStatus(order.id, 'completed');
      expect(updated.status).toBe('completed');
      expect(updated.paymentStatus).toBe('paid');
    });

    it('should allow cancellation from any pre-delivery status', async () => {
      const request = createTestOrderRequest({ customerId: testCustomer.id });
      const order = await orderService.createOrder(request);

      const cancelled = await orderService.cancelOrder(order.id, 'Customer requested cancellation');

      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.cancelledReason).toBe('Customer requested cancellation');
    });

    it('should not allow cancellation after delivery', async () => {
      const request = createTestOrderRequest({ customerId: testCustomer.id });
      const order = await orderService.createOrder(request);

      await orderService.updateOrderStatus(order.id, 'delivered');

      await expect(
        orderService.cancelOrder(order.id, 'Too late')
      ).rejects.toThrow('Cannot cancel order after delivery');
    });
  });

  describe('listOrders', () => {
    beforeEach(async () => {
      // Create multiple orders
      for (let i = 0; i < 5; i++) {
        const request = createTestOrderRequest({ customerId: testCustomer.id });
        await orderService.createOrder(request);
      }
    });

    it('should list all orders', async () => {
      const orders = await orderService.listOrders({});

      expect(orders.length).toBe(5);
    });

    it('should filter orders by customer', async () => {
      const customer2 = createTestCustomer({ id: 'customer2' });
      await db.insert(customers).values(customer2);

      const request = createTestOrderRequest({ customerId: customer2.id });
      await orderService.createOrder(request);

      const orders = await orderService.listOrders({ customerId: customer2.id });

      expect(orders.length).toBe(1);
      expect(orders[0].customerId).toBe(customer2.id);
    });

    it('should filter orders by status', async () => {
      const orders = await orderService.listOrders({});
      const firstOrder = orders[0];

      await orderService.updateOrderStatus(firstOrder.id, 'confirmed');

      const confirmedOrders = await orderService.listOrders({ status: 'confirmed' });

      expect(confirmedOrders.length).toBe(1);
      expect(confirmedOrders[0].status).toBe('confirmed');
    });

    it('should filter orders by driver', async () => {
      const driver = createTestDriver({ id: 'driver123' });
      await db.insert(drivers).values(driver);

      const orders = await orderService.listOrders({});
      await orderService.updateOrderStatus(orders[0].id, 'assigned', {
        driverId: driver.id,
      });

      const driverOrders = await orderService.listOrders({ driverId: driver.id });

      expect(driverOrders.length).toBe(1);
      expect(driverOrders[0].driverId).toBe(driver.id);
    });

    it('should support pagination with limit and offset', async () => {
      const page1 = await orderService.listOrders({ limit: 2, offset: 0 });
      const page2 = await orderService.listOrders({ limit: 2, offset: 2 });

      expect(page1.length).toBe(2);
      expect(page2.length).toBe(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe('assignDriver', () => {
    it('should assign a driver to an order', async () => {
      const driver = createTestDriver({ id: 'driver123' });
      await db.insert(drivers).values(driver);

      const request = createTestOrderRequest({ customerId: testCustomer.id });
      const order = await orderService.createOrder(request);

      const assigned = await orderService.assignDriver(order.id, driver.id);

      expect(assigned.driverId).toBe(driver.id);
      expect(assigned.status).toBe('assigned');
      expect(assigned.assignedAt).toBeDefined();
    });
  });
});
