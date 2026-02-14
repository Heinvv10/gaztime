import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { pods } from '../db/schema.js';
import { eq } from 'drizzle-orm';
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
}
