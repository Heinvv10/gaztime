// Pod POS API helpers
import { api } from '@gaztime/shared';

const POD_ID = 'pod-default-1'; // Default pod ID

// Customer operations
export async function findOrCreateCustomer(phone: string, name?: string) {
  try {
    // Try to find existing customer
    const customer = await api.customers.getByPhone(phone);
    return customer;
  } catch (err: any) {
    if (err.status === 404 && name) {
      // Customer doesn't exist, create new one
      return await api.customers.create({
        phone,
        name,
        addresses: [],
      });
    }
    throw err;
  }
}

// Create POS sale (order)
export async function createPOSSale(
  customerId: string,
  items: Array<{ productId: string; quantity: number; unitPrice: number }>,
  paymentMethod: string
) {
  return await api.orders.create({
    customerId,
    channel: 'pos',
    items,
    deliveryAddressId: 'walk-in',
    deliveryFee: 0,
    paymentMethod: paymentMethod as any,
    notes: `Walk-in sale at ${POD_ID}`,
  });
}

// Get stock levels for the pod
export async function getPodStockLevels() {
  return await api.inventory.getStockLevels(POD_ID);
}

// Get orders for the pod
export async function getPodOrders(status?: string) {
  // Note: This assumes the API supports filtering by podId
  // If not, we'll need to fetch all orders and filter client-side
  return await api.orders.list({ podId: POD_ID, status: status as any });
}
