// ============================================================================
// COMPLETE PODS ROUTES - Replace packages/api/src/routes/pods.ts with this
// ============================================================================

import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { pods, reconciliations } from '../db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { requireRole } from '../middleware/auth.js';

export async function podRoutes(fastify: FastifyInstance) {
  // GET /api/pods - List all pods
  // Accessible by: admin, operator
  fastify.get('/pods', {
    onRequest: [requireRole('admin', 'operator')],
  }, async (request: any, reply) => {
    const allPods = await db.select().from(pods).where(eq(pods.active, true));
    const mapped = allPods.map((p: any) => ({
      id: p.id,
      name: p.name,
      location: p.location,
      operatingHours: p.operating_hours,
      operatorId: p.operator_id,
      fibertimePopId: p.fibertime_pop_id,
      stock: p.stock,
      active: p.active,
    }));
    return reply.send(mapped);
  });

  // GET /api/pods/:id - Get pod by ID
  // Accessible by: admin, operator
  fastify.get<{ Params: { id: string } }>('/pods/:id', {
    onRequest: [requireRole('admin', 'operator')],
  }, async (request: any, reply) => {
    const pod = await db.select().from(pods).where(eq(pods.id, request.params.id)).then(r => r[0]);
    if (!pod) {
      return reply.code(404).send({ error: 'Pod not found' });
    }
    return reply.send(pod);
  });

  // POST /api/pods/:podId/reconciliation - Submit cash reconciliation
  // Accessible by: admin, operator
  fastify.post<{
    Params: { podId: string };
    Body: {
      date: string;
      expectedCash: number;
      actualCash: number;
      operatorId: string;
      notes?: string;
    };
  }>('/pods/:podId/reconciliation', {
    onRequest: [requireRole('admin', 'operator')],
  }, async (request, reply) => {
    const { podId } = request.params;
    const { date, expectedCash, actualCash, operatorId, notes } = request.body;

    // Validate pod exists
    const pod = await db.select().from(pods).where(eq(pods.id, podId)).then(r => r[0]);
    if (!pod) {
      return reply.code(404).send({ error: 'Pod not found' });
    }

    // Calculate variance
    const variance = actualCash - expectedCash;

    // Create reconciliation record
    const reconciliationId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const [reconciliation] = await db.insert(reconciliations).values({
      id: reconciliationId,
      pod_id: podId,
      date,
      expected_cash: expectedCash,
      actual_cash: actualCash,
      variance,
      operator_id: operatorId,
      notes: notes || null,
      created_at: new Date(),
    }).returning();

    return reply.send({
      success: true,
      data: {
        id: reconciliation.id,
        podId: reconciliation.pod_id,
        date: reconciliation.date,
        expectedCash: reconciliation.expected_cash,
        actualCash: reconciliation.actual_cash,
        variance: reconciliation.variance,
        operatorId: reconciliation.operator_id,
        notes: reconciliation.notes,
        createdAt: reconciliation.created_at,
      }
    });
  });

  // GET /api/pods/:podId/reconciliations - Get reconciliation history
  // Accessible by: admin, operator
  fastify.get<{
    Params: { podId: string };
    Querystring: { from?: string; to?: string };
  }>('/pods/:podId/reconciliations', {
    onRequest: [requireRole('admin', 'operator')],
  }, async (request, reply) => {
    const { podId } = request.params;
    const { from, to } = request.query;

    let query = db.select().from(reconciliations).where(eq(reconciliations.pod_id, podId));

    if (from && to) {
      query = query.where(
        and(
          gte(reconciliations.date, from),
          lte(reconciliations.date, to)
        )
      ) as any;
    }

    const results = await query;

    const mapped = results.map(r => ({
      id: r.id,
      podId: r.pod_id,
      date: r.date,
      expectedCash: r.expected_cash,
      actualCash: r.actual_cash,
      variance: r.variance,
      operatorId: r.operator_id,
      notes: r.notes,
      createdAt: r.created_at,
    }));

    return reply.send(mapped);
  });
}
