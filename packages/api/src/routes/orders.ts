// ============================================================================
// Order Routes
// REST API endpoints for order management
// ============================================================================

import type { FastifyInstance } from 'fastify';
import { inArray } from 'drizzle-orm';
import { ZodError } from 'zod';
import { OrderService } from '../services/order.js';
import { customers as customersTable, products as productsTable } from '../db/schema.js';
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
  fastify.post<{ Body: CreateOrderRequest }>('/orders', async (request, reply) => {
    try {
      const validatedBody = CreateOrderSchema.parse(request.body);
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
  fastify.get<{ Params: { id: string } }>('/orders/:id', async (request, reply) => {
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

    // Enrich single order too
    const custRow = order.customerId 
      ? await db.select().from(customersTable).where(inArray(customersTable.id, [order.customerId])).then((r: any[]) => r[0])
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
  fastify.get<{ Querystring: ListOrdersQuery }>('/orders', async (request, reply) => {
    const orders = await orderService.listOrders(request.query);
    
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
  fastify.patch<{ Params: { id: string }; Body: UpdateOrderStatusRequest }>(
    '/orders/:id/status',
    async (request, reply) => {
      try {
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
  fastify.post<{ Params: { id: string }; Body: { reason: string } }>(
    '/orders/:id/cancel',
    async (request, reply) => {
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
  fastify.post<{ Params: { id: string }; Body: { driverId: string } }>(
    '/orders/:id/assign',
    async (request, reply) => {
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
