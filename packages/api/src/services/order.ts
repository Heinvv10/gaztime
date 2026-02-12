// ============================================================================
// Order Service
// Handles order creation, updates, state transitions, and queries
// ============================================================================

import { randomUUID } from 'crypto';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { orders, customers, products } from '../db/schema.js';
import { mapOrder } from '../db/mappers.js';
import type {
  Order,
  CreateOrderRequest,
  OrderStatus,
  ListOrdersQuery,
  DeliveryProof,
} from '../../../shared/src/types.js';

export class OrderService {
  private orderRefCounter = 0;
  private initialized = false;

  constructor(private db: BetterSQLite3Database<any>) {}

  private async ensureCounter() {
    if (this.initialized) return;
    const rows: any[] = await this.db.select().from(orders);
    let max = 999;
    for (const row of rows) {
      const ref = row.reference as string;
      const num = parseInt(ref.replace('GT-', ''), 10);
      if (!isNaN(num) && num > max) max = num;
    }
    this.orderRefCounter = max + 1;
    this.initialized = true;
  }

  /**
   * Create a new order
   */
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    await this.ensureCounter();
    // Verify customer exists (skip for walk-in pod orders)
    let customer = null;
    if (request.customerId && request.customerId !== 'walk-in') {
      customer = await this.db
        .select()
        .from(customers)
        .where(eq(customers.id, request.customerId))
        .then(r => r[0]);

      if (!customer) {
        throw new Error('Customer not found');
      }
    }

    // Fetch product prices from DB
    const productIds = request.items.map((item) => item.productId);
    const productRows = await this.db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const priceMap = new Map<string, number>();
    for (const prod of productRows) {
      const prices = prod.prices as Array<{ price: number; effective_from: string; effective_to: string | null }>;
      // Get current active price (no effective_to or effective_to in future)
      const now = new Date().toISOString();
      const activePrice = prices
        .filter(p => !p.effective_to || p.effective_to > now)
        .sort((a, b) => b.effective_from.localeCompare(a.effective_from))[0];
      priceMap.set(prod.id, activePrice?.price ?? 0);
    }

    // Calculate item totals
    const itemsWithTotals = request.items.map((item) => {
      const unitPrice = priceMap.get(item.productId) ?? 0;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        total: item.quantity * unitPrice,
      };
    });

    const totalAmount = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);

    // Generate order reference
    const reference = this.generateOrderReference();

    // Create DB order object (snake_case)
    const dbOrder = {
      id: randomUUID(),
      reference,
      customer_id: (request.customerId && request.customerId !== 'walk-in') ? request.customerId : null,
      channel: request.channel,
      status: 'created',
      items: itemsWithTotals,
      delivery_address: request.deliveryAddress || null,
      delivery_fee: 0, // TODO: Calculate delivery fee based on distance
      total_amount: totalAmount,
      payment_method: request.paymentMethod,
      payment_status: 'pending',
      driver_id: null,
      pod_id: request.podId || null,
      assigned_at: null,
      picked_up_at: null,
      delivered_at: null,
      delivery_proof: null,
      rating: null,
      notes: request.notes || null,
      created_at: new Date(),
      cancelled_reason: null,
    };

    // Insert into database
    await this.db.insert(orders).values(dbOrder);

    return mapOrder(dbOrder);
  }

  /**
   * Get order by ID
   */
  async getOrder(id: string): Promise<Order | null> {
    const dbOrder = await this.db.select().from(orders).where(eq(orders.id, id)).then(r => r[0]);

    return dbOrder ? mapOrder(dbOrder) : null;
  }

  /**
   * Update order status with optional metadata
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    metadata?: {
      driver_id?: string;
      delivery_proof?: DeliveryProof;
    }
  ): Promise<Order> {
    const order = await this.getOrder(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const updates: any = { status };

    // Handle state-specific updates
    if (status === 'assigned' && metadata?.driver_id) {
      updates.driver_id = metadata.driver_id;
      updates.assigned_at = new Date();
    }

    if (status === 'delivered') {
      updates.delivered_at = new Date();
      if (metadata?.delivery_proof) {
        updates.delivery_proof = metadata.delivery_proof;
      }
    }

    if (status === 'completed') {
      updates.payment_status = 'paid';
    }

    await this.db.update(orders).set(updates).where(eq(orders.id, orderId));

    return this.getOrder(orderId) as Promise<Order>;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, reason: string): Promise<Order> {
    const order = await this.getOrder(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Cannot cancel after delivery
    if (order.status === 'delivered' || order.status === 'completed') {
      throw new Error('Cannot cancel order after delivery');
    }

    await this.db
      .update(orders)
      .set({
        status: 'cancelled',
        cancelled_reason: reason,
      })
      .where(eq(orders.id, orderId));

    return this.getOrder(orderId) as Promise<Order>;
  }

  /**
   * List orders with filters
   */
  async listOrders(query: ListOrdersQuery): Promise<Order[]> {
    let queryBuilder = this.db.select().from(orders);

    // Apply filters
    const conditions: any[] = [];

    if (query.status) {
      conditions.push(eq(orders.status, query.status));
    }

    if (query.customerId) {
      conditions.push(eq(orders.customer_id, query.customerId));
    }

    if (query.driverId) {
      conditions.push(eq(orders.driver_id, query.driverId));
    }

    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions)) as any;
    }

    // Order by created_at descending
    queryBuilder = queryBuilder.orderBy(desc(orders.created_at)) as any;

    // Apply pagination
    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit) as any;
    }

    if (query.offset) {
      queryBuilder = queryBuilder.offset(query.offset) as any;
    }

    const dbOrders = await queryBuilder;
    return dbOrders.map(mapOrder);
  }

  /**
   * Assign a driver to an order
   */
  async assignDriver(orderId: string, driverId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'assigned', { driver_id: driverId });
  }

  /**
   * Generate unique order reference
   */
  private generateOrderReference(): string {
    return `GT-${String(this.orderRefCounter++).padStart(4, '0')}`;
  }
}
