import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { products } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { mapProduct } from '../db/mappers.js';
import { authenticate } from '../middleware/auth.js';

export async function productRoutes(fastify: FastifyInstance) {
  // GET /api/products - List all active products
  // Accessible by: authenticated users (products can be viewed by anyone logged in)
  fastify.get('/products', {
    onRequest: [authenticate],
  }, async (request: any, reply) => {
    const allProducts = await db.select().from(products).where(eq(products.active, true));
    return reply.send(allProducts.map(mapProduct));
  });

  // GET /api/products/:id - Get product by ID
  // Accessible by: authenticated users
  fastify.get<{ Params: { id: string } }>('/products/:id', {
    onRequest: [authenticate],
  }, async (request: any, reply) => {
    const product = await db.select().from(products).where(eq(products.id, request.params.id)).then(r => r[0]);
    if (!product) {
      return reply.code(404).send({ error: 'Product not found' });
    }
    return reply.send(mapProduct(product));
  });
}
