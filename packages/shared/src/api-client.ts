// ============================================================
// GAZ TIME — Shared API Client
// ============================================================

import type {
  Customer,
  Order,
  CylinderStatus,
  OrderStatus,
  PaymentMethod,
  OrderChannel,
  Address,
  GeoLocation,
  StockLevel,
} from './types';

// ---- Config ----

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

// ---- Helper: Fetch with error handling ----

interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      const error: ApiError = {
        message: errorData.message || `HTTP ${response.status}`,
        status: response.status,
        data: errorData,
      };
      throw error;
    }

    const json = await response.json();
    
    // Auto-unwrap {success: true, data: ...} responses
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data as T;
    }
    
    return json as T;
  } catch (error) {
    if ((error as ApiError).status) {
      throw error;
    }
    // Network or other error
    throw {
      message: 'Network error - please check your connection',
      data: error,
    } as ApiError;
  }
}

// ---- Customer API ----

export interface CreateCustomerData {
  phone: string;
  name: string;
  addresses?: Partial<Address>[];
  language?: string;
  fibertimeAccountId?: string;
}

export interface UpdateCustomerData {
  name?: string;
  language?: string;
  fibertimeAccountId?: string;
}

export const customerApi = {
  list: () =>
    apiFetch<Customer[]>('/customers').catch(() => []),

  create: (data: CreateCustomerData) =>
    apiFetch<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getById: (id: string) =>
    apiFetch<Customer>(`/customers/${id}`),

  getByPhone: (phone: string) =>
    apiFetch<Customer>(`/customers/phone/${phone}`),

  update: (id: string, data: UpdateCustomerData) =>
    apiFetch<Customer>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getAddresses: (id: string) =>
    apiFetch<Customer>(`/customers/${id}`).then(c => c.addresses || []),

  creditWallet: (id: string, amount: number, description?: string) =>
    apiFetch<{ newBalance: number }>(`/customers/${id}/wallet/topup`, {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    }),

  debitWallet: (id: string, amount: number, description?: string) =>
    apiFetch<{ newBalance: number }>(`/customers/${id}/wallet/debit`, {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    }),
};

// ---- Order API ----

export interface CreateOrderData {
  customerId: string;
  channel?: OrderChannel;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  deliveryAddressId: string;
  deliveryAddress?: Address;
  deliveryFee?: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface OrderFilters {
  customerId?: string;
  podId?: string;
  driverId?: string;
  status?: OrderStatus;
  limit?: number;
  offset?: number;
}

export const orderApi = {
  create: (data: CreateOrderData) =>
    apiFetch<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getById: (id: string) =>
    apiFetch<Order>(`/orders/${id}`),

  list: (filters?: OrderFilters) => {
    const params = new URLSearchParams();
    if (filters?.customerId) params.set('customerId', filters.customerId);
    if (filters?.podId) params.set('podId', filters.podId);
    if (filters?.driverId) params.set('driverId', filters.driverId);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());
    
    const query = params.toString();
    return apiFetch<Order[]>(`/orders${query ? `?${query}` : ''}`);
  },

  updateStatus: (id: string, status: OrderStatus) =>
    apiFetch<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  cancel: (id: string, reason?: string) =>
    apiFetch<Order>(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  assign: (id: string, driverId: string) =>
    apiFetch<Order>(`/orders/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ driverId }),
    }),
};

// ---- Inventory API ----

export interface CreateCylinderData {
  serial: string;
  sizeKg: number;
  location: string;
  locationType: 'depot' | 'pod' | 'vehicle' | 'customer';
  status?: CylinderStatus;
}

export const inventoryApi = {
  listCylinders: () =>
    apiFetch<any[]>(`/inventory/cylinders`).catch(() => []),

  getStockLevels: (location?: string) => {
    const params = location ? `?locationId=${encodeURIComponent(location)}` : '';
    return apiFetch<StockLevel[]>(`/inventory/stock${params}`);
  },

  getLowStock: (threshold?: number) => {
    const params = threshold ? `?threshold=${threshold}` : '';
    return apiFetch<any[]>(`/inventory/alerts/low-stock${params}`);
  },

  createCylinder: (data: CreateCylinderData) =>
    apiFetch(`/inventory/cylinders`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCylinderById: (id: string) =>
    apiFetch(`/inventory/cylinders/${id}`),

  getCylinderBySerial: (serial: string) =>
    apiFetch(`/inventory/cylinders/serial/${serial}`),

  moveCylinder: (cylinderId: string, toLocation: string, toLocationType: string) =>
    apiFetch(`/inventory/cylinders/move`, {
      method: 'POST',
      body: JSON.stringify({ cylinderId, toLocation, toLocationType }),
    }),

  fillCylinder: (id: string, filledBy: string) =>
    apiFetch(`/inventory/cylinders/${id}/fill`, {
      method: 'POST',
      body: JSON.stringify({ filledBy }),
    }),

  updateCylinderStatus: (id: string, status: CylinderStatus) =>
    apiFetch(`/inventory/cylinders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  condemnCylinder: (id: string, reason: string) =>
    apiFetch(`/inventory/cylinders/${id}/condemn`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// ---- Product API ----

export const productApi = {
  list: () =>
    apiFetch<any[]>('/products').then(products =>
      products.map(p => ({
        ...p,
        price: p.price ?? p.prices?.[0]?.price ?? 0,
        sizeKg: p.sizeKg ?? p.size_kg,
      }))
    ),

  getById: (id: string) =>
    apiFetch<any>(`/products/${id}`).then(p => ({
      ...p,
      price: p.price ?? p.prices?.[0]?.price ?? 0,
      sizeKg: p.sizeKg ?? p.size_kg,
    })),
};

// ---- Driver API ----

export interface DriverLocation {
  lat: number;
  lng: number;
}

export interface NearestDriverRequest {
  location: GeoLocation;
  maxDistanceKm?: number;
}

export const driverApi = {
  list: () =>
    apiFetch<any[]>(`/drivers`).catch(() => []),

  getByPhone: (phone: string) =>
    apiFetch<any>(`/drivers/phone/${encodeURIComponent(phone)}`),

  updateStatus: (id: string, status: 'online' | 'offline' | 'on_delivery' | 'on_break') =>
    apiFetch(`/drivers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updateLocation: (id: string, location: DriverLocation) =>
    apiFetch(`/drivers/${id}/location`, {
      method: 'PATCH',
      body: JSON.stringify({ location }),
    }),

  getAvailable: () =>
    apiFetch(`/drivers/available`),

  findNearest: (request: NearestDriverRequest) =>
    apiFetch(`/drivers/nearest`, {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  assignToOrder: (driverId: string, orderId: string) =>
    apiFetch(`/drivers/assign`, {
      method: 'POST',
      body: JSON.stringify({ driverId, orderId }),
    }),

  completeDelivery: (driverId: string, orderId: string, proof?: { type: string; data: string }) =>
    apiFetch(`/drivers/complete-delivery`, {
      method: 'POST',
      body: JSON.stringify({ driverId, orderId, proof }),
    }),
};

// ---- Export all ----

export const podApi = {
  list: () =>
    apiFetch<any[]>(`/pods`).catch(() => []),

  getById: (id: string) =>
    apiFetch<any>(`/pods/${id}`),
};

export const api = {
  customers: customerApi,
  products: productApi,
  orders: orderApi,
  inventory: inventoryApi,
  drivers: driverApi,
  pods: podApi,
};

export default api;
