// ============================================================================
// Inventory Service Tests
// TDD: Write tests first, then implement
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { InventoryService } from './inventory.js';
import { db } from '../db/index.js';
import { createTestCylinder, createTestDepot, createTestPod } from '../test/factories.js';
import { cylinders, depots, pods } from '../db/schema.js';
import { CylinderStatus, CylinderLocationType } from '../../../shared/src/types.js';

describe('InventoryService', () => {
  let inventoryService: InventoryService;
  let testDepot: any;
  let testPod: any;

  beforeEach(async () => {
    inventoryService = new InventoryService(db);

    // Create test depot and pod
    testDepot = createTestDepot({ id: 'depot1' });
    testPod = createTestPod({ id: 'pod1' });

    await db.insert(depots).values(testDepot);
    await db.insert(pods).values(testPod);
  });

  describe('createCylinder', () => {
    it('should create a new cylinder with unique serial number', async () => {
      const cylinder = await inventoryService.createCylinder({
        serialNumber: 'CYL-001',
        sizeKg: 9,
        manufacturedAt: '2024-01-01',
      });

      expect(cylinder.id).toBeDefined();
      expect(cylinder.serialNumber).toBe('CYL-001');
      expect(cylinder.sizeKg).toBe(9);
      expect(cylinder.status).toBe('new');
      expect(cylinder.locationType).toBe('depot');
      expect(cylinder.fillCount).toBe(0);
    });

    it('should throw error if serial number already exists', async () => {
      await inventoryService.createCylinder({
        serialNumber: 'CYL-001',
        sizeKg: 9,
        manufacturedAt: '2024-01-01',
      });

      await expect(
        inventoryService.createCylinder({
          serialNumber: 'CYL-001',
          sizeKg: 19,
          manufacturedAt: '2024-01-01',
        })
      ).rejects.toThrow('Cylinder with this serial number already exists');
    });
  });

  describe('getCylinder', () => {
    it('should get cylinder by id', async () => {
      const created = await inventoryService.createCylinder({
        serialNumber: 'CYL-001',
        sizeKg: 9,
        manufacturedAt: '2024-01-01',
      });

      const retrieved = await inventoryService.getCylinder(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
    });

    it('should get cylinder by serial number', async () => {
      const created = await inventoryService.createCylinder({
        serialNumber: 'CYL-001',
        sizeKg: 9,
        manufacturedAt: '2024-01-01',
      });

      const retrieved = await inventoryService.getCylinderBySerial('CYL-001');

      expect(retrieved).toBeDefined();
      expect(retrieved!.serialNumber).toBe('CYL-001');
    });
  });

  describe('moveCylinder', () => {
    it('should move cylinder from depot to pod', async () => {
      const cylinder = await inventoryService.createCylinder({
        serialNumber: 'CYL-001',
        sizeKg: 9,
        manufacturedAt: '2024-01-01',
      });

      const moved = await inventoryService.moveCylinder({
        cylinderId: cylinder.id,
        to_locationType: 'pod',
        to_locationId: testPod.id,
        actor_id: 'user123',
      });

      expect(moved.locationType).toBe('pod');
      expect(moved.locationId).toBe(testPod.id);
      expect(moved.movements).toHaveLength(1);
      expect(moved.movements[0].to_locationType).toBe('pod');
    });

    it('should track movement history', async () => {
      const cylinder = await inventoryService.createCylinder({
        serialNumber: 'CYL-001',
        sizeKg: 9,
        manufacturedAt: '2024-01-01',
      });

      // Depot → Pod
      await inventoryService.moveCylinder({
        cylinderId: cylinder.id,
        to_locationType: 'pod',
        to_locationId: testPod.id,
        actor_id: 'user123',
      });

      // Pod → Vehicle
      const moved = await inventoryService.moveCylinder({
        cylinderId: cylinder.id,
        to_locationType: 'vehicle',
        to_locationId: 'vehicle1',
        actor_id: 'driver456',
      });

      expect(moved.movements).toHaveLength(2);
      expect(moved.locationType).toBe('vehicle');
    });
  });

  describe('fillCylinder', () => {
    it('should mark cylinder as filled and increment fill count', async () => {
      const cylinder = await inventoryService.createCylinder({
        serialNumber: 'CYL-001',
        sizeKg: 9,
        manufacturedAt: '2024-01-01',
      });

      const filled = await inventoryService.fillCylinder(cylinder.id);

      expect(filled.status).toBe('filled');
      expect(filled.fillCount).toBe(1);
      expect(filled.lastFilledAt).toBeDefined();
    });

    it('should increment fill count on subsequent fills', async () => {
      const cylinder = await inventoryService.createCylinder({
        serialNumber: 'CYL-001',
        sizeKg: 9,
        manufacturedAt: '2024-01-01',
      });

      await inventoryService.fillCylinder(cylinder.id);
      await inventoryService.updateCylinderStatus(cylinder.id, 'empty');
      const filled = await inventoryService.fillCylinder(cylinder.id);

      expect(filled.fillCount).toBe(2);
    });
  });

  describe('updateCylinderStatus', () => {
    it('should update cylinder status', async () => {
      const cylinder = await inventoryService.createCylinder({
        serialNumber: 'CYL-001',
        sizeKg: 9,
        manufacturedAt: '2024-01-01',
      });

      const updated = await inventoryService.updateCylinderStatus(
        cylinder.id,
        'with_customer'
      );

      expect(updated.status).toBe('with_customer');
    });
  });

  describe('getStockLevels', () => {
    beforeEach(async () => {
      // Create cylinders in different locations
      for (let i = 0; i < 5; i++) {
        const cylinder = await inventoryService.createCylinder({
          serialNumber: `CYL-${i}`,
          sizeKg: 9,
          manufacturedAt: '2024-01-01',
        });

        await inventoryService.fillCylinder(cylinder.id);

        if (i < 3) {
          await inventoryService.moveCylinder({
            cylinderId: cylinder.id,
            to_locationType: 'pod',
            to_locationId: testPod.id,
            actor_id: 'user123',
          });
        }
      }
    });

    it('should return stock levels by location', async () => {
      const levels = await inventoryService.getStockLevels();

      expect(levels).toHaveLength(2); // Depot and Pod

      const depotStock = levels.find((l) => l.locationType === 'depot');
      const podStock = levels.find((l) => l.locationType === 'pod');

      expect(depotStock?.stockBySize[0].filled).toBe(2);
      expect(podStock?.stockBySize[0].filled).toBe(3);
    });

    it('should filter stock levels by location', async () => {
      const levels = await inventoryService.getStockLevels({
        locationType: 'pod',
        locationId: testPod.id,
      });

      expect(levels).toHaveLength(1);
      expect(levels[0].locationId).toBe(testPod.id);
    });
  });

  describe('getLowStockAlerts', () => {
    beforeEach(async () => {
      // Create only 2 cylinders in pod (below threshold of 3)
      for (let i = 0; i < 2; i++) {
        const cylinder = await inventoryService.createCylinder({
          serialNumber: `CYL-${i}`,
          sizeKg: 9,
          manufacturedAt: '2024-01-01',
        });

        await inventoryService.fillCylinder(cylinder.id);
        await inventoryService.moveCylinder({
          cylinderId: cylinder.id,
          to_locationType: 'pod',
          to_locationId: testPod.id,
          actor_id: 'user123',
        });
      }
    });

    it('should return low stock alerts', async () => {
      const alerts = await inventoryService.getLowStockAlerts(3);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].currentStock).toBeLessThan(3);
    });
  });

  describe('condemnCylinder', () => {
    it('should condemn a cylinder', async () => {
      const cylinder = await inventoryService.createCylinder({
        serialNumber: 'CYL-001',
        sizeKg: 9,
        manufacturedAt: '2024-01-01',
      });

      const condemned = await inventoryService.condemnCylinder(cylinder.id, 'Failed inspection');

      expect(condemned.status).toBe('condemned');
      expect(condemned.condemnedAt).toBeDefined();
    });
  });
});
