// ============================================================================
// Driver Routes
// REST API endpoints for driver and delivery management
// ============================================================================

import type { FastifyInstance, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { DeliveryService } from '../services/delivery.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import type {
  DriverStatus,
  UpdateDriverLocationRequest,
  DeliveryProof,
} from '../../../shared/src/types.js';
import { UpdateDriverLocationSchema } from '../validation.js';

export async function driverRoutes(fastify: FastifyInstance) {
  const deliveryService = new DeliveryService(fastify.db as any);

  // List all drivers
  // Accessible by: admin, operator
  fastify.get('/drivers', {
    onRequest: [requireRole('admin', 'operator')],
  }, async (request: any, reply) => {
    try {
      const { db } = await import('../db/index.js');
      const { drivers } = await import('../db/schema.js');
      const allDrivers = await db.select().from(drivers);
      const mapped = allDrivers.map((d: any) => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        licenseNumber: d.license_number,
        licenseExpiry: d.license_expiry,
        lpgsaCertNumber: d.lpgsa_cert_number,
        certExpiry: d.cert_expiry,
        vehicleId: d.vehicle_id,
        status: d.status,
        currentLocation: d.current_location,
        ratingAvg: d.rating_avg,
        totalDeliveries: d.total_deliveries,
        todayDeliveries: 0,
        todayEarnings: 0,
        hiredAt: d.hired_at,
        active: d.active,
      }));
      return reply.send(mapped);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // GET /api/drivers/phone/:phone - Get driver by phone number
  // Accessible by: admin, operator
  fastify.get<{ Params: { phone: string } }>(
    '/drivers/phone/:phone',
    {
      onRequest: [requireRole('admin', 'operator')],
    },
    async (request: any, reply) => {
      try {
        const allDrivers = await deliveryService.getAvailableDrivers();
        const driver = allDrivers.find((d: any) => {
          const dPhone = d.phone?.replace(/\D/g, '');
          const reqPhone = request.params.phone.replace(/\D/g, '');
          return dPhone === reqPhone || dPhone?.endsWith(reqPhone) || reqPhone.endsWith(dPhone || '');
        });
        if (!driver) {
          return reply.code(404).send({ success: false, error: { code: 'DRIVER_NOT_FOUND', message: 'Driver not found' } });
        }
        return reply.send({ success: true, data: driver });
      } catch (error: any) {
        return reply.code(500).send({ success: false, error: { message: error.message } });
      }
    }
  );

  // Update driver status
  // Accessible by: admin, operator, driver (driver can only update their own status)
  fastify.patch<{ Params: { id: string }; Body: { status: DriverStatus } }>(
    '/drivers/:id/status',
    {
      onRequest: [authenticate],
    },
    async (request: any, reply) => {
      try {
        // TODO: Add check if driver role, ensure they can only update their own status
        await deliveryService.updateDriverStatus(request.params.id, request.body.status);
        return reply.send({ success: true, data: { id: request.params.id, status: request.body.status } });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'DRIVER_STATUS_UPDATE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Update driver location
  // Accessible by: admin, operator, driver (driver can only update their own location)
  fastify.patch<{ Params: { id: string }; Body: { location: { lat: number; lng: number } } }>(
    '/drivers/:id/location',
    {
      onRequest: [authenticate],
    },
    async (request: any, reply) => {
      try {
        // TODO: Add check if driver role, ensure they can only update their own location
        const validatedBody = UpdateDriverLocationSchema.parse(request.body);
        await deliveryService.updateDriverLocation(request.params.id, validatedBody.location);
        return reply.send({ success: true, data: { id: request.params.id, location: validatedBody.location } });
      } catch (error: any) {
        if (error instanceof ZodError) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
              details: error.errors,
            },
          });
        }
        return reply.code(400).send({
          success: false,
          error: {
            code: 'DRIVER_LOCATION_UPDATE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Get available drivers
  // Accessible by: admin, operator
  fastify.get('/drivers/available', {
    onRequest: [requireRole('admin', 'operator')],
  }, async (request: any, reply) => {
    const drivers = await deliveryService.getAvailableDrivers();
    return reply.send({ success: true, data: drivers });
  });

  // Find nearest driver
  // Accessible by: admin, operator
  fastify.post<{ Body: { lat: number; lng: number } }>(
    '/drivers/nearest',
    {
      onRequest: [requireRole('admin', 'operator')],
    },
    async (request: any, reply) => {
      const driver = await deliveryService.findNearestDriver(request.body);

      if (!driver) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NO_DRIVER_AVAILABLE',
            message: 'No available drivers found',
          },
        });
      }

      return reply.send({ success: true, data: driver });
    }
  );

  // Assign driver to order
  // Accessible by: admin, operator only
  fastify.post<{ Body: { orderId: string; driverId: string } }>(
    '/drivers/assign',
    {
      onRequest: [requireRole('admin', 'operator')],
    },
    async (request: any, reply) => {
      try {
        const order = await deliveryService.assignDriverToOrder(
          request.body.orderId,
          request.body.driverId
        );
        return reply.send({ success: true, data: order });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'DRIVER_ASSIGN_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Complete delivery
  // Accessible by: admin, operator, driver
  fastify.post<{ Body: { orderId: string; proof: DeliveryProof } }>(
    '/drivers/complete-delivery',
    {
      onRequest: [authenticate],
    },
    async (request: any, reply) => {
      try {
        const order = await deliveryService.completeDelivery(request.body.orderId, request.body.proof);
        return reply.send({ success: true, data: order });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'DELIVERY_COMPLETE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );
}
