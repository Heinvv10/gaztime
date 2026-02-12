// ============================================================================
// Inventory Service
// Handles cylinder tracking, stock movements, and inventory management
// ============================================================================

import { randomUUID } from 'crypto';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, and, sql } from 'drizzle-orm';
import { cylinders, depots, pods } from '../db/schema.js';
import { mapCylinder } from '../db/mappers.js';
import type {
  Cylinder,
  CreateCylinderRequest,
  MoveCylinderRequest,
  CylinderStatus,
  CylinderLocationType,
  CylinderMovement,
  StockLevel,
  LowStockAlert,
} from '../../../shared/src/types.js';

export class InventoryService {
  constructor(private db: BetterSQLite3Database<any>) {}

  /**
   * Create a new cylinder
   */
  async createCylinder(request: CreateCylinderRequest): Promise<Cylinder> {
    // Check if serial number already exists
    const existing = await this.getCylinderBySerial(request.serialNumber);
    if (existing) {
      throw new Error('Cylinder with this serial number already exists');
    }

    // Get default depot (first active depot)
    const depot = await this.db.select().from(depots).where(eq(depots.active, true)).then(r => r[0]);
    const defaultDepotId = depot?.id || 'default-depot';

    const dbCylinder = {
      id: randomUUID(),
      serial_number: request.serialNumber,
      size_kg: request.sizeKg,
      status: 'new',
      location_type: 'depot',
      location_id: defaultDepotId,
      fill_count: 0,
      last_filled_at: null,
      last_inspected_at: null,
      next_inspection_due: null,
      manufactured_at: request.manufacturedAt ? new Date(request.manufacturedAt) : new Date(),
      condemned_at: null,
      movements: [],
    };

    await this.db.insert(cylinders).values(dbCylinder);

    return mapCylinder(dbCylinder);
  }

  /**
   * Get cylinder by ID
   */
  async getCylinder(id: string): Promise<Cylinder | null> {
    const dbCylinder = await this.db.select().from(cylinders).where(eq(cylinders.id, id)).then(r => r[0]);

    return dbCylinder ? mapCylinder(dbCylinder) : null;
  }

  /**
   * Get cylinder by serial number
   */
  async getCylinderBySerial(serialNumber: string): Promise<Cylinder | null> {
    const dbCylinder = await this.db
      .select()
      .from(cylinders)
      .where(eq(cylinders.serial_number, serialNumber))
      .then(r => r[0]);

    return dbCylinder ? mapCylinder(dbCylinder) : null;
  }

  /**
   * Move cylinder from one location to another
   */
  async moveCylinder(request: MoveCylinderRequest): Promise<Cylinder> {
    const cylinder = await this.getCylinder(request.cylinderId);
    if (!cylinder) {
      throw new Error('Cylinder not found');
    }

    if (!request.toLocationType || !request.toLocationId) {
      throw new Error('toLocationType and toLocationId are required');
    }

    // Create movement record
    const movement: CylinderMovement = {
      id: randomUUID(),
      cylinderId: request.cylinderId,
      fromLocationType: cylinder.locationType,
      fromLocationId: cylinder.locationId,
      toLocationType: request.toLocationType,
      toLocationId: request.toLocationId,
      actorId: request.actorId,
      timestamp: new Date().toISOString(),
    };

    // Update cylinder location
    const updateData: any = {};
    if (request.toLocationType) updateData.location_type = request.toLocationType;
    if (request.toLocationId) updateData.location_id = request.toLocationId;

    if (Object.keys(updateData).length === 0) {
      throw new Error('No values to update');
    }

    await this.db
      .update(cylinders)
      .set(updateData)
      .where(eq(cylinders.id, request.cylinderId));

    return this.getCylinder(request.cylinderId) as Promise<Cylinder>;
  }

  /**
   * Fill a cylinder (mark as filled and increment fill count)
   */
  async fillCylinder(cylinderId: string): Promise<Cylinder> {
    const cylinder = await this.getCylinder(cylinderId);
    if (!cylinder) {
      throw new Error('Cylinder not found');
    }

    await this.db
      .update(cylinders)
      .set({
        status: 'filled',
        fill_count: cylinder.fillCount + 1,
        last_filled_at: new Date(),
      })
      .where(eq(cylinders.id, cylinderId));

    return this.getCylinder(cylinderId) as Promise<Cylinder>;
  }

  /**
   * Update cylinder status
   */
  async updateCylinderStatus(cylinderId: string, status: CylinderStatus): Promise<Cylinder> {
    const cylinder = await this.getCylinder(cylinderId);
    if (!cylinder) {
      throw new Error('Cylinder not found');
    }

    await this.db.update(cylinders).set({ status }).where(eq(cylinders.id, cylinderId));

    return this.getCylinder(cylinderId) as Promise<Cylinder>;
  }

  /**
   * Get stock levels across all locations or filtered by location
   */
  async getStockLevels(filter?: {
    location_type?: CylinderLocationType;
    location_id?: string;
  }): Promise<StockLevel[]> {
    let query = this.db.select().from(cylinders);

    if (filter?.location_type) {
      query = query.where(eq(cylinders.location_type, filter.location_type)) as any;
    }

    if (filter?.location_id) {
      query = query.where(eq(cylinders.location_id, filter.location_id)) as any;
    }

    const allCylinders = await query;

    // Group by location
    const grouped = new Map<string, any[]>();

    for (const cylinder of allCylinders) {
      const key = `${cylinder.location_type}:${cylinder.location_id}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(cylinder);
    }

    // Build stock levels
    const stockLevels: StockLevel[] = [];

    for (const [key, cylinders] of grouped.entries()) {
      const [locationType, locationId] = key.split(':');

      // Get location name
      let locationName = locationId;
      if (locationType === 'depot') {
        const depot = await this.db.select().from(depots).where(eq(depots.id, locationId)).then(r => r[0]);
        locationName = depot?.name || locationId;
      } else if (locationType === 'pod') {
        const pod = await this.db.select().from(pods).where(eq(pods.id, locationId)).then(r => r[0]);
        locationName = pod?.name || locationId;
      }

      // Group by size
      const bySize = new Map<number, { filled: number; empty: number }>();

      for (const cylinder of cylinders) {
        if (!bySize.has(cylinder.size_kg)) {
          bySize.set(cylinder.size_kg, { filled: 0, empty: 0 });
        }

        const stock = bySize.get(cylinder.size_kg)!;
        if (cylinder.status === 'filled') {
          stock.filled++;
        } else if (cylinder.status === 'empty' || cylinder.status === 'returned') {
          stock.empty++;
        }
      }

      const stockBySize = Array.from(bySize.entries()).map(([sizeKg, counts]) => ({
        sizeKg,
        filled: counts.filled,
        empty: counts.empty,
      }));

      stockLevels.push({
        locationType: locationType as CylinderLocationType,
        locationId,
        locationName,
        stockBySize,
      });
    }

    return stockLevels;
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(threshold: number = 5): Promise<LowStockAlert[]> {
    const stockLevels = await this.getStockLevels();
    const alerts: LowStockAlert[] = [];

    for (const level of stockLevels) {
      for (const stock of level.stockBySize) {
        if (stock.filled < threshold) {
          alerts.push({
            locationType: level.locationType,
            locationId: level.locationId,
            locationName: level.locationName,
            sizeKg: stock.sizeKg,
            currentStock: stock.filled,
            threshold,
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Condemn a cylinder (mark as condemned and unusable)
   */
  async condemnCylinder(cylinderId: string, reason: string): Promise<Cylinder> {
    const cylinder = await this.getCylinder(cylinderId);
    if (!cylinder) {
      throw new Error('Cylinder not found');
    }

    await this.db
      .update(cylinders)
      .set({
        status: 'condemned',
        condemned_at: new Date(),
      })
      .where(eq(cylinders.id, cylinderId));

    return this.getCylinder(cylinderId) as Promise<Cylinder>;
  }
}
