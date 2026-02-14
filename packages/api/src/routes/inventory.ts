// ============================================================================
// Inventory Routes
// REST API endpoints for inventory and cylinder management
// ============================================================================

import type { FastifyInstance, FastifyRequest } from 'fastify';
import { InventoryService } from '../services/inventory.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import type {
  CreateCylinderRequest,
  MoveCylinderRequest,
  CylinderStatus,
  CylinderLocationType,
} from '../../../shared/src/types.js';

export async function inventoryRoutes(fastify: FastifyInstance) {
  const inventoryService = new InventoryService(fastify.db as any);

  // List all cylinders
  // Accessible by: admin, operator
  fastify.get('/inventory/cylinders', {
    onRequest: [requireRole('admin', 'operator')],
  }, async (request: any, reply) => {
    try {
      const { db } = await import('../db/index.js');
      const { cylinders } = await import('../db/schema.js');
      const allCylinders = await db.select().from(cylinders);
      const mapped = allCylinders.map((c: any) => ({
        id: c.id,
        serialNumber: c.serial_number,
        sizeKg: c.size_kg,
        status: c.status,
        locationType: c.location_type,
        locationId: c.location_id,
        fillCount: c.fill_count,
        lastFilledAt: c.last_filled_at,
        manufacturedAt: c.manufactured_at,
        condemnedAt: c.condemned_at,
        condemnReason: c.condemn_reason,
        createdAt: c.created_at,
      }));
      return reply.send({ success: true, data: mapped });
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: { message: error.message } });
    }
  });

  // Create new cylinder
  // Accessible by: admin, operator
  fastify.post<{ Body: CreateCylinderRequest }>('/inventory/cylinders', {
    onRequest: [requireRole('admin', 'operator')],
  }, async (request: any, reply) => {
    try {
      const cylinder = await inventoryService.createCylinder(request.body);
      return reply.code(201).send({ success: true, data: cylinder });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'CYLINDER_CREATE_FAILED',
          message: error.message,
        },
      });
    }
  });

  // Get cylinder by ID
  // Accessible by: admin, operator
  fastify.get<{ Params: { id: string } }>(
    '/inventory/cylinders/:id',
    {
      onRequest: [requireRole('admin', 'operator')],
    },
    async (request: any, reply) => {
      const cylinder = await inventoryService.getCylinder(request.params.id);

      if (!cylinder) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'CYLINDER_NOT_FOUND',
            message: 'Cylinder not found',
          },
        });
      }

      return reply.send({ success: true, data: cylinder });
    }
  );

  // Get cylinder by serial number
  // Accessible by: admin, operator
  fastify.get<{ Params: { serial: string } }>(
    '/inventory/cylinders/serial/:serial',
    {
      onRequest: [requireRole('admin', 'operator')],
    },
    async (request: any, reply) => {
      const cylinder = await inventoryService.getCylinderBySerial(request.params.serial);

      if (!cylinder) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'CYLINDER_NOT_FOUND',
            message: 'Cylinder not found',
          },
        });
      }

      return reply.send({ success: true, data: cylinder });
    }
  );

  // Move cylinder
  // Accessible by: admin, operator
  fastify.post<{ Body: MoveCylinderRequest }>(
    '/inventory/cylinders/move',
    {
      onRequest: [requireRole('admin', 'operator')],
    },
    async (request: any, reply) => {
      try {
        const cylinder = await inventoryService.moveCylinder(request.body);
        return reply.send({ success: true, data: cylinder });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'CYLINDER_MOVE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Fill cylinder
  // Accessible by: admin, operator
  fastify.post<{ Params: { id: string } }>(
    '/inventory/cylinders/:id/fill',
    {
      onRequest: [requireRole('admin', 'operator')],
    },
    async (request: any, reply) => {
      try {
        const cylinder = await inventoryService.fillCylinder(request.params.id);
        return reply.send({ success: true, data: cylinder });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'CYLINDER_FILL_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Update cylinder status
  // Accessible by: admin, operator
  fastify.patch<{ Params: { id: string }; Body: { status: CylinderStatus } }>(
    '/inventory/cylinders/:id/status',
    {
      onRequest: [requireRole('admin', 'operator')],
    },
    async (request: any, reply) => {
      try {
        const cylinder = await inventoryService.updateCylinderStatus(
          request.params.id,
          request.body.status
        );
        return reply.send({ success: true, data: cylinder });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'CYLINDER_STATUS_UPDATE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get stock levels
  // Accessible by: admin, operator
  fastify.get<{
    Querystring: { locationType?: CylinderLocationType; locationId?: string };
  }>('/inventory/stock', {
    onRequest: [requireRole('admin', 'operator')],
  }, async (request: any, reply) => {
    const stockLevels = await inventoryService.getStockLevels({
      location_type: request.query.locationType,
      location_id: request.query.locationId,
    });
    return reply.send({ success: true, data: stockLevels });
  });

  // Get low stock alerts
  // Accessible by: admin, operator
  fastify.get<{ Querystring: { threshold?: number } }>(
    '/inventory/alerts/low-stock',
    {
      onRequest: [requireRole('admin', 'operator')],
    },
    async (request: any, reply) => {
      const threshold = request.query.threshold ? parseInt(String(request.query.threshold)) : 5;
      const alerts = await inventoryService.getLowStockAlerts(threshold);
      return reply.send({ success: true, data: alerts });
    }
  );

  // Condemn cylinder
  // Accessible by: admin only
  fastify.post<{ Params: { id: string }; Body: { reason: string } }>(
    '/inventory/cylinders/:id/condemn',
    {
      onRequest: [requireRole('admin')],
    },
    async (request: any, reply) => {
      try {
        const cylinder = await inventoryService.condemnCylinder(
          request.params.id,
          request.body.reason
        );
        return reply.send({ success: true, data: cylinder });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'CYLINDER_CONDEMN_FAILED',
            message: error.message,
          },
        });
      }
    }
  );
}
