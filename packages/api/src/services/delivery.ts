// ============================================================================
// Delivery Service
// Handles driver management, location tracking, and delivery assignment
// ============================================================================

import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { drivers, orders } from '../db/schema.js';
import { mapDriver, mapOrder } from '../db/mappers.js';
import type {
  Driver,
  DriverStatus,
  UpdateDriverLocationRequest,
  DeliveryProof,
  Order,
  GeoLocation,
} from '../../../shared/src/types.js';

export class DeliveryService {
  constructor(private db: BetterSQLite3Database<any>) {}

  /**
   * Update driver status (online/offline/on_delivery/on_break)
   */
  async updateDriverStatus(driverId: string, status: DriverStatus): Promise<void> {
    await this.db.update(drivers).set({ status }).where(eq(drivers.id, driverId));
  }

  /**
   * Update driver GPS location
   */
  async updateDriverLocation(
    driverId: string,
    location: GeoLocation
  ): Promise<void> {
    await this.db
      .update(drivers)
      .set({
        current_location: location,
      })
      .where(eq(drivers.id, driverId));
  }

  /**
   * Get all available (online) drivers
   */
  async getAvailableDrivers(): Promise<Driver[]> {
    const dbDrivers = await this.db.select().from(drivers).where(eq(drivers.status, 'online'));
    return dbDrivers.map(mapDriver);
  }

  /**
   * Find nearest available driver to a location
   * Simple implementation using Euclidean distance
   * TODO: Use proper geospatial calculations (Haversine formula)
   */
  async findNearestDriver(destination: GeoLocation): Promise<Driver | null> {
    const availableDrivers = await this.getAvailableDrivers();

    if (availableDrivers.length === 0) {
      return null;
    }

    // Calculate distances and find nearest
    let nearestDriver: Driver | null = null;
    let minDistance = Infinity;

    for (const driver of availableDrivers) {
      if (!driver.currentLocation) continue;

      const distance = this.calculateDistance(destination, driver.currentLocation);

      if (distance < minDistance) {
        minDistance = distance;
        nearestDriver = driver;
      }
    }

    return nearestDriver;
  }

  /**
   * Assign driver to an order
   */
  async assignDriverToOrder(orderId: string, driverId: string): Promise<Order> {
    // Update order
    await this.db
      .update(orders)
      .set({
        driver_id: driverId,
        status: 'assigned',
        assigned_at: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Update driver status
    await this.updateDriverStatus(driverId, 'on_delivery');

    const dbOrder = await this.db.select().from(orders).where(eq(orders.id, orderId)).then(r => r[0]);
    return mapOrder(dbOrder!);
  }

  /**
   * Complete delivery with proof
   */
  async completeDelivery(orderId: string, proof: DeliveryProof): Promise<Order> {
    const dbOrder = await this.db.select().from(orders).where(eq(orders.id, orderId)).then(r => r[0]);

    if (!dbOrder) {
      throw new Error('Order not found');
    }

    // Update order to delivered
    await this.db
      .update(orders)
      .set({
        status: 'delivered',
        delivered_at: new Date(),
        delivery_proof: proof,
      })
      .where(eq(orders.id, orderId));

    // Update driver status back to online and increment delivery count
    if (dbOrder.driver_id) {
      const dbDriver = await this.db
        .select()
        .from(drivers)
        .where(eq(drivers.id, dbOrder.driver_id))
        .then(r => r[0]);

      if (dbDriver) {
        await this.db
          .update(drivers)
          .set({
            status: 'online',
            total_deliveries: dbDriver.total_deliveries + 1,
          })
          .where(eq(drivers.id, dbOrder.driver_id));
      }
    }

    const updatedDbOrder = await this.db.select().from(orders).where(eq(orders.id, orderId)).then(r => r[0]);
    return mapOrder(updatedDbOrder!);
  }

  /**
   * Calculate simple distance between two points
   * TODO: Replace with proper Haversine formula for accurate geospatial distance
   */
  private calculateDistance(point1: GeoLocation, point2: GeoLocation): number {
    const latDiff = point1.lat - point2.lat;
    const lngDiff = point1.lng - point2.lng;
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  }
}
