// ============================================================================
// Delivery Service Tests
// TDD: Write tests first, then implement
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { DeliveryService } from './delivery.js';
import { db } from '../db/index.js';
import { createTestDriver, createTestVehicle, createTestOrder } from '../test/factories.js';
import { drivers, vehicles, orders } from '../db/schema.js';
import { DriverStatus } from '../../../shared/src/types.js';
import { eq } from 'drizzle-orm';

describe('DeliveryService', () => {
  let deliveryService: DeliveryService;

  beforeEach(() => {
    deliveryService = new DeliveryService(db);
  });

  describe('updateDriverStatus', () => {
    it('should update driver status to online', async () => {
      const driver = createTestDriver({ id: 'driver1' });
      await db.insert(drivers).values(driver);

      await deliveryService.updateDriverStatus('driver1', 'online');

      const updated = await db.select().from(drivers).where(eq(drivers.id, 'driver1')).get();
      expect(updated?.status).toBe('online');
    });

    it('should update driver status to offline', async () => {
      const driver = createTestDriver({ id: 'driver1', status: 'online' });
      await db.insert(drivers).values(driver);

      await deliveryService.updateDriverStatus('driver1', 'offline');

      const updated = await db.select().from(drivers).where(eq(drivers.id, 'driver1')).get();
      expect(updated?.status).toBe('offline');
    });
  });

  describe('updateDriverLocation', () => {
    it('should update driver GPS location', async () => {
      const driver = createTestDriver({ id: 'driver1' });
      await db.insert(drivers).values(driver);

      await deliveryService.updateDriverLocation('driver1', {
        lat: -24.6792,
        lng: 30.3247,
      });

      const updated = await db.select().from(drivers).where(eq(drivers.id, 'driver1')).get();
      expect(updated?.currentLocation).toBeDefined();
      expect(updated?.currentLocation.lat).toBe(-24.6792);
      expect(updated?.currentLocation.lng).toBe(30.3247);
    });
  });

  describe('getAvailableDrivers', () => {
    beforeEach(async () => {
      // Create drivers with different statuses
      const driver1 = createTestDriver({
        id: 'driver1',
        status: 'online',
        currentLocation: { lat: -24.6792, lng: 30.3247, updated_at: new Date() },
      });

      const driver2 = createTestDriver({
        id: 'driver2',
        status: 'offline',
        currentLocation: { lat: -24.6792, lng: 30.3247, updated_at: new Date() },
      });

      const driver3 = createTestDriver({
        id: 'driver3',
        status: 'online',
        currentLocation: { lat: -24.6792, lng: 30.3247, updated_at: new Date() },
      });

      await db.insert(drivers).values([driver1, driver2, driver3]);
    });

    it('should return only online drivers', async () => {
      const available = await deliveryService.getAvailableDrivers();

      expect(available.length).toBe(2);
      expect(available.every((d) => d.status === 'online')).toBe(true);
    });
  });

  describe('findNearestDriver', () => {
    beforeEach(async () => {
      // Create drivers at different locations
      const driver1 = createTestDriver({
        id: 'driver1',
        status: 'online',
        currentLocation: { lat: -24.6792, lng: 30.3247, updated_at: new Date() }, // Close
      });

      const driver2 = createTestDriver({
        id: 'driver2',
        status: 'online',
        currentLocation: { lat: -24.8, lng: 30.5, updated_at: new Date() }, // Far
      });

      await db.insert(drivers).values([driver1, driver2]);
    });

    it('should find the nearest available driver', async () => {
      const nearest = await deliveryService.findNearestDriver({
        lat: -24.6792,
        lng: 30.3247,
      });

      expect(nearest).toBeDefined();
      expect(nearest!.id).toBe('driver1');
    });

    it('should return null if no drivers available', async () => {
      // Set all drivers offline
      await db.update(drivers).set({ status: 'offline' });

      const nearest = await deliveryService.findNearestDriver({
        lat: -24.6792,
        lng: 30.3247,
      });

      expect(nearest).toBeNull();
    });
  });

  describe('assignDriverToOrder', () => {
    it('should assign driver to order', async () => {
      const driver = createTestDriver({ id: 'driver1', status: 'online' });
      await db.insert(drivers).values(driver);

      const order = createTestOrder({ id: 'order1' });
      await db.insert(orders).values(order);

      const assigned = await deliveryService.assignDriverToOrder('order1', 'driver1');

      expect(assigned.driverId).toBe('driver1');
      expect(assigned.status).toBe('assigned');
      expect(assigned.assignedAt).toBeDefined();
    });

    it('should update driver status to on_delivery', async () => {
      const driver = createTestDriver({ id: 'driver1', status: 'online' });
      await db.insert(drivers).values(driver);

      const order = createTestOrder({ id: 'order1' });
      await db.insert(orders).values(order);

      await deliveryService.assignDriverToOrder('order1', 'driver1');

      const updated = await db.select().from(drivers).where(eq(drivers.id, 'driver1')).get();
      expect(updated?.status).toBe('on_delivery');
    });
  });

  describe('completeDelivery', () => {
    beforeEach(async () => {
      const driver = createTestDriver({ id: 'driver1', status: 'on_delivery' });
      await db.insert(drivers).values(driver);

      const order = createTestOrder({
        id: 'order1',
        driverId: 'driver1',
        status: 'in_transit',
      });
      await db.insert(orders).values(order);
    });

    it('should mark order as delivered with proof', async () => {
      const completed = await deliveryService.completeDelivery('order1', {
        type: 'photo',
        url: 'https://example.com/proof.jpg',
      });

      expect(completed.status).toBe('delivered');
      expect(completed.deliveredAt).toBeDefined();
      expect(completed.deliveryProof).toBeDefined();
    });

    it('should update driver status back to online', async () => {
      await deliveryService.completeDelivery('order1', {
        type: 'photo',
        url: 'https://example.com/proof.jpg',
      });

      const driver = await db.select().from(drivers).where(eq(drivers.id, 'driver1')).get();
      expect(driver?.status).toBe('online');
    });

    it('should increment driver total deliveries', async () => {
      const driverBefore = await db
        .select()
        .from(drivers)
        .where(eq(drivers.id, 'driver1'))
        .get();
      const countBefore = driverBefore!.total_deliveries;

      await deliveryService.completeDelivery('order1', {
        type: 'photo',
        url: 'https://example.com/proof.jpg',
      });

      const driverAfter = await db.select().from(drivers).where(eq(drivers.id, 'driver1')).get();
      expect(driverAfter!.total_deliveries).toBe(countBefore + 1);
    });
  });
});
