// @ts-nocheck
// ============================================================================
// Test Data Factories
// Helpers to create test data with sensible defaults
// ============================================================================

import { randomUUID } from 'crypto';
import type {
  Customer,
  Order,
  Product,
  Cylinder,
  Driver,
  Vehicle,
  Pod,
  Depot,
  CreateOrderRequest,
} from '../../../shared/src/types.js';

// Generate unique reference numbers
let orderRefCounter = 1000;
export function generateOrderReference(): string {
  return `GT-${String(orderRefCounter++).padStart(4, '0')}`;
}

// Generate unique referral codes
export function generateReferralCode(): string {
  return `REF-${randomUUID().slice(0, 8).toUpperCase()}`;
}

// Customer factory
export function createTestCustomer(overrides: Partial<Customer> = {}): Customer {
  const id = randomUUID();
  return {
    id,
    phone: `+2778${Math.random().toString().slice(2, 9)}`,
    name: 'Test Customer',
    addresses: [
      {
        text: '47 Mandela Street, Ext 5, South Africa',
        landmark: 'Near the blue tuck shop',
        lat: -24.6792,
        lng: 30.3247,
        is_default: true,
      },
    ],
    wallet_balance: 0,
    fibertime_account_id: null,
    referral_code: generateReferralCode(),
    referred_by: null,
    segment: 'new',
    language_preference: 'en',
    status: 'active',
    created_at: new Date(),
    ...overrides,
  };
}

// Product factory
export function createTestProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: randomUUID(),
    name: '9kg LPG Cylinder',
    sku: 'LPG-9KG',
    sizeKg: 9,
    type: 'cylinder_full',
    prices: [
      {
        price: 315,
        effective_from: new Date('2024-01-01'),
        effective_to: null,
      },
    ],
    active: true,
    ...overrides,
  };
}

// Order factory
export function createTestOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: randomUUID(),
    reference: generateOrderReference(),
    customer_id: randomUUID(),
    channel: 'app',
    status: 'created',
    items: [
      {
        product_id: randomUUID(),
        quantity: 1,
        unit_price: 315,
        total: 315,
      },
    ],
    delivery_address: {
      text: '47 Mandela Street, Ext 5, South Africa',
      landmark: 'Near the blue tuck shop',
      lat: -24.6792,
      lng: 30.3247,
    },
    delivery_fee: 0,
    total_amount: 315,
    payment_method: 'cash',
    payment_status: 'pending',
    driver_id: null,
    pod_id: null,
    assigned_at: null,
    picked_up_at: null,
    delivered_at: null,
    delivery_proof: null,
    rating: null,
    notes: undefined,
    created_at: new Date(),
    cancelled_reason: null,
    ...overrides,
  };
}

// CreateOrderRequest factory
export function createTestOrderRequest(
  overrides: Partial<CreateOrderRequest> = {}
): CreateOrderRequest {
  return {
    customer_id: randomUUID(),
    channel: 'app',
    items: [
      {
        product_id: randomUUID(),
        quantity: 1,
        unit_price: 315,
      },
    ],
    delivery_address: {
      text: '47 Mandela Street, Ext 5, South Africa',
      landmark: 'Near the blue tuck shop',
      lat: -24.6792,
      lng: 30.3247,
    },
    payment_method: 'cash',
    ...overrides,
  };
}

// Cylinder factory
export function createTestCylinder(overrides: Partial<Cylinder> = {}): Cylinder {
  return {
    id: randomUUID(),
    serialNumber: `CYL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    sizeKg: 9,
    status: 'new' as const,
    locationType: 'depot' as const,
    locationId: randomUUID(),
    fillCount: 0,
    lastFilledAt: undefined,
    lastInspectedAt: undefined,
    nextInspectionDue: undefined,
    manufacturedAt: new Date().toISOString(),
    condemnedAt: undefined,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// Driver factory
export function createTestDriver(overrides: Partial<Driver> = {}): Driver {
  return {
    id: randomUUID(),
    name: 'Test Driver',
    phone: `+2778${Math.random().toString().slice(2, 9)}`,
    licenseNumber: `LIC${Math.random().toString().slice(2, 10)}`,
    licenseExpiry: '2026-12-31',
    lpgsaCertNumber: `LPGSA${Math.random().toString().slice(2, 8)}`,
    certExpiry: '2026-12-31',
    vehicleId: undefined,
    status: 'offline' as const,
    currentLocation: undefined,
    ratingAvg: 0,
    totalDeliveries: 0,
    todayDeliveries: 0,
    todayEarnings: 0,
    hiredAt: new Date().toISOString(),
    active: true,
    ...overrides,
  };
}

// Vehicle factory
export function createTestVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: randomUUID(),
    registration: `GP${Math.random().toString().slice(2, 8)}`,
    make: 'Toyota',
    model: 'Hilux',
    capacityCylinders: 20,
    currentStock: [],
    insuranceExpiry: '2026-12-31',
    serviceDueDate: '2025-06-30',
    gpsDeviceId: undefined,
    active: true,
    ...overrides,
  };
}

// Pod factory
export function createTestPod(overrides: Partial<Pod> = {}): Pod {
  return {
    id: randomUUID(),
    name: 'Test Pod',
    location: {
      id: randomUUID(),
      label: 'Pod',
      text: 'Test Street, South Africa',
      isDefault: true,
      location: { lat: -24.6792, lng: 30.3247 },
    },
    operatorId: undefined,
    stock: [],
    operatingHours: {
      open: '08:00',
      close: '18:00',
    },
    fibertimePopId: null,
    active: true,
    ...overrides,
  };
}

// Depot factory
export function createTestDepot(overrides: Partial<Depot> = {}): Depot {
  return {
    id: randomUUID(),
    name: 'Main Depot',
    location: {
      id: randomUUID(),
      label: 'Depot',
      text: 'Industrial Area, South Africa',
      isDefault: true,
      location: { lat: -24.6792, lng: 30.3247 },
    },
    bulkStorageCapacityTonnes: 100,
    currentStockTonnes: 50,
    cylinderStock: [],
    active: true,
    ...overrides,
  };
}
