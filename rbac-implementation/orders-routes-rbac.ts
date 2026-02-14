// ============================================================================
// Order Routes - WITH RBAC IMPLEMENTATION
// REST API endpoints for order management
// ============================================================================

import type { FastifyInstance, FastifyRequest } from 'fastify';
import { inArray, eq } from 'drizzle-orm';
import { ZodError } from 'zod';
import { OrderService } from '../services/order.js';
import { customers as customersTable, products as productsTable } from '../db/schema.js';
import { authenticate, requireRole, type AuthUser } from '../middleware/auth.js';
import type {
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  ListOrdersQuery,
} from '../../../shared/src/types.js';
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  AssignDriverSchema,
} from '../validation.js';

export async function orderRoutes(fastify: FastifyInstance) {
  const db = fastify.db as any;
  const orderService = new OrderService(db);

  // Create new order
  // ✅ RBAC: admin, operator, customer (customer can only create orders for themselves)
  fastify.post<{ Body: CreateOrderRequest }>('/orders', {
    onRequest: [authenticate],
  }, async (request: any, reply) => {
    try {
      const user = request.user as AuthUser;
      const validatedBody = CreateOrderSchema.parse(request.body);

      // ✅ NEW: If customer role, ensure they're creating order for themselves
      if (user.role === 'customer') {
        if (validatedBody.customerId && validatedBody.customerId !== user.id) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Customers can only create orders for themselves',
            },
          });
        }
        // Force customerId to be the authenticated user
        validatedBody.customerId = user.id;
      }

      const order = await orderService.createOrder(validatedBody as CreateOrderRequest);
      return reply.code(201).send({ success: true, data: order });
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
          code: 'ORDER_CREATE_FAILED',
          message: error.message,
        },
      });
    }
  });

  // Get order by ID
  // ✅ RBAC: admin, operator see all; drivers see only assigned; customers see only their own
  fastify.get<{ Params: { id: string } }>('/orders/:id', {
    onRequest: [authenticate],
  }, async (request: any, reply) => {
    const user = request.user as AuthUser;
    const order = await orderService.getOrder(request.params.id);

    if (!order) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      });
    }

    // ✅ NEW: Customers can only see their own orders
    if (user.role === 'customer' && order.customerId !== user.id) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to this order',
        },
      });
    }

    // ✅ NEW: Drivers can only see orders assigned to them
    if (user.role === 'driver' && order.driverId !== user.id) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to this order',
        },
      });
    }

    // Enrich single order
    const custRow = order.customerId
      ? await db.select().from(customersTable).where(eq(customersTable.id, order.customerId)).then((r: any[]) => r[0])
      : null;
    const pIds = (order.items || []).map((i: any) => i.productId).filter(Boolean);
    const prodRows = pIds.length > 0 ? await db.select().from(productsTable).where(inArray(productsTable.id, pIds)) : [];
    const prodMap = new Map(prodRows.map((p: any) => [p.id, p.name]));

    const enriched = {
      ...order,
      customer: custRow ? { name: custRow.name, phone: custRow.phone } : null,
      items: (order.items || []).map((i: any) => ({ ...i, product: { name: prodMap.get(i.productId) || 'Unknown' } })),
    };

    return reply.send({ success: true, data: enriched });
  });

  // List orders with filters (enriched with customer/product names)
  // ✅ RBAC: admin, operator see all; drivers see assigned; customers see their own
  fastify.get<{ Querystring: ListOrdersQuery }>('/orders', {
    onRequest: [authenticate],
  }, async (request: any, reply) => {
    const user = request.user as AuthUser;
    const query = { ...request.query };

    // ✅ NEW: Customers can only see their own orders
    if (user.role === 'customer') {
      query.customerId = user.id;
    }

    // ✅ NEW: Drivers can only see their assigned orders
    if (user.role === 'driver') {
      query.driverId = user.id;
    }

    const orders = await orderService.listOrders(query);

    // Enrich with customer names and product names
    const customerIds = [...new Set(orders.map((o: any) => o.customerId).filter(Boolean))];
    const customerRows = customerIds.length > 0
      ? await db.select().from(customersTable).where(inArray(customersTable.id, customerIds as string[]))
      : [];
    const customerMap = new Map(customerRows.map((c: any) => [c.id, { name: c.name, phone: c.phone }]));

    const productIds = [...new Set(orders.flatMap((o: any) => (o.items || []).map((i: any) => i.productId)).filter(Boolean))];
    const productRows = productIds.length > 0
      ? await db.select().from(productsTable).where(inArray(productsTable.id, productIds as string[]))
      : [];
    const productMap = new Map(productRows.map((p: any) => [p.id, p.name]));

    const enriched = orders.map((o: any) => ({
      ...o,
      customer: customerMap.get(o.customerId) || null,
      items: (o.items || []).map((item: any) => ({
        ...item,
        product: { name: productMap.get(item.productId) || 'Unknown' },
      })),
    }));

    return reply.send({ success: true, data: enriched });
  });

  // Update order status
  // ✅ RBAC: admin, operator can update any; drivers can only update assigned orders
  fastify.patch<{ Params: { id: string }; Body: UpdateOrderStatusRequest }>(
    '/orders/:id/status',
    {
      onRequest: [authenticate],
    },
    async (request: any, reply) => {
      try {
        const user = request.user as AuthUser;

        // ✅ NEW: If driver role, verify they're assigned to this order
        if (user.role === 'driver') {
          const order = await orderService.getOrder(request.params.id);
          if (!order) {
            return reply.code(404).send({
              success: false,
              error: {
                code: 'ORDER_NOT_FOUND',
                message: 'Order not found',
              },
            });
          }

          if (order.driverId !== user.id) {
            return reply.code(403).send({
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Drivers can only update their assigned orders',
              },
            });
          }
        }

        // ✅ NEW: Customers cannot update order status
        if (user.role === 'customer') {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Customers cannot update order status',
            },
          });
        }

        const validatedBody = UpdateOrderStatusSchema.parse(request.body);
        const order = await orderService.updateOrderStatus(
          request.params.id,
          validatedBody.status as any,
          {
            driver_id: validatedBody.driverId,
            delivery_proof: validatedBody.deliveryProof,
          }
        );
        return reply.send({ success: true, data: order });
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
            code: 'ORDER_UPDATE_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Cancel order
  // Accessible by: admin, operator (unchanged - already has RBAC)
  fastify.post<{ Params: { id: string }; Body: { reason: string } }>(
    '/orders/:id/cancel',
    {
      onRequest: [requireRole('admin', 'operator')],
    },
    async (request: any, reply) => {
      try {
        const order = await orderService.cancelOrder(request.params.id, request.body.reason);
        return reply.send({ success: true, data: order });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'ORDER_CANCEL_FAILED',
            message: error.message,
          },
        });
      }
    }
  );

  // Assign driver to order
  // Accessible by: admin, operator only (unchanged - already has RBAC)
  fastify.post<{ Params: { id: string }; Body: { driverId: string } }>(
    '/orders/:id/assign',
    {
      onRequest: [requireRole('admin', 'operator')],
    },
    async (request: any, reply) => {
      try {
        const validatedBody = AssignDriverSchema.parse(request.body);
        const order = await orderService.assignDriver(request.params.id, validatedBody.driverId);
        return reply.send({ success: true, data: order });
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
            code: 'ORDER_ASSIGN_FAILED',
            message: error.message,
          },
        });
      }
    }
  );
}
