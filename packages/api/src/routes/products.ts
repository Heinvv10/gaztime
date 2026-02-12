import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { products } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { mapProduct } from '../db/mappers.js';

export async function productRoutes(fastify: FastifyInstance) {
  // GET /api/products - List all active products
  fastify.get('/products', async (request, reply) => {
    const allProducts = await db.select().from(products).where(eq(products.active, true));
    return reply.send(allProducts.map(mapProduct));
  });

  // GET /api/products/:id - Get product by ID
  fastify.get<{ Params: { id: string } }>('/products/:id', async (request, reply) => {
    const product = await db.select().from(products).where(eq(products.id, request.params.id)).then(r => r[0]);
    if (!product) {
      return reply.code(404).send({ error: 'Product not found' });
    }
    return reply.send(mapProduct(product));
  });
}
