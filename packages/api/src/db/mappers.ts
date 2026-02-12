// ============================================================================
// DB Mappers - Convert between snake_case DB schema and camelCase types
// ============================================================================

import type {
  Customer,
  Order,
  Cylinder,
  Driver,
  Vehicle,
  Pod,
  Depot,
  Product,
  Wallet,
  WalletTransaction,
  Subscription,
  Address,
} from '../../../shared/src/types.js';

// Type for DB result (snake_case)
type DbCustomer = {
  id: string;
  phone: string;
  name: string;
  addresses: any[];
  wallet_balance: number;
  fibertime_account_id: string | null;
  referral_code: string;
  referred_by: string | null;
  segment: string;
  language_preference: string;
  status: string;
  created_at: Date;
};

type DbOrder = {
  id: string;
  reference: string;
  customer_id: string | null;
  channel: string;
  status: string;
  items: any[];
  delivery_address: any;
  delivery_fee: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  driver_id: string | null;
  pod_id: string | null;
  assigned_at: Date | null;
  picked_up_at: Date | null;
  delivered_at: Date | null;
  delivery_proof: any | null;
  rating: number | null;
  notes: string | null;
  created_at: Date;
  cancelled_reason: string | null;
};

type DbCylinder = {
  id: string;
  serial_number: string;
  size_kg: number;
  status: string;
  location_type: string;
  location_id: string;
  fill_count: number;
  last_filled_at: Date | null;
  last_inspected_at: Date | null;
  next_inspection_due: Date | null;
  manufactured_at: Date | null;
  condemned_at: Date | null;
  movements?: any[];
};

type DbDriver = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  license_number: string;
  license_expiry: Date;
  lpgsa_cert_number: string;
  cert_expiry: Date;
  vehicle_id: string | null;
  status: string;
  current_location: any | null;
  rating_avg: number;
  total_deliveries: number;
  hired_at: Date;
  active: boolean;
};

type DbVehicle = {
  id: string;
  registration: string;
  make: string;
  model: string;
  capacity_cylinders: number;
  current_stock: any[];
  insurance_expiry: Date;
  service_due_date: Date;
  gps_device_id: string | null;
  active: boolean;
};

type DbPod = {
  id: string;
  name: string;
  location: any;
  operator_id: string | null;
  stock: any[];
  operating_hours: any;
  fibertime_pop_id: string | null;
  active: boolean;
};

type DbDepot = {
  id: string;
  name: string;
  location: any;
  bulk_storage_capacity_tonnes: number;
  current_stock_tonnes: number;
  cylinder_stock: any[];
  active: boolean;
};

type DbProduct = {
  id: string;
  name: string;
  description?: string | null;
  sku: string;
  size_kg: number;
  type: string;
  prices: any[];
  image_url?: string | null;
  active: boolean;
  created_at?: Date;
  updated_at?: Date;
};

/**
 * Map DB customer to Customer type
 */
export function mapCustomer(dbCustomer: DbCustomer): Customer {
  return {
    id: dbCustomer.id,
    phone: dbCustomer.phone,
    name: dbCustomer.name,
    addresses: dbCustomer.addresses as Address[],
    walletBalance: dbCustomer.wallet_balance,
    fibertimeAccountId: dbCustomer.fibertime_account_id || undefined,
    referralCode: dbCustomer.referral_code,
    referredBy: dbCustomer.referred_by || undefined,
    segment: dbCustomer.segment as any,
    languagePreference: dbCustomer.language_preference as any,
    status: dbCustomer.status as any,
    createdAt: dbCustomer.created_at.toISOString(),
    updatedAt: dbCustomer.created_at.toISOString(), // TODO: Add updated_at to schema
  };
}

/**
 * Map DB order to Order type
 */
export function mapOrder(dbOrder: DbOrder): Order {
  return {
    id: dbOrder.id,
    reference: dbOrder.reference,
    customerId: dbOrder.customer_id || '',
    channel: dbOrder.channel as any,
    status: dbOrder.status as any,
    items: dbOrder.items as any,
    deliveryAddress: dbOrder.delivery_address,
    deliveryFee: dbOrder.delivery_fee,
    totalAmount: dbOrder.total_amount,
    paymentMethod: dbOrder.payment_method as any,
    paymentStatus: dbOrder.payment_status as any,
    driverId: dbOrder.driver_id || undefined,
    podId: dbOrder.pod_id || undefined,
    assignedAt: dbOrder.assigned_at?.toISOString(),
    pickedUpAt: dbOrder.picked_up_at?.toISOString(),
    deliveredAt: dbOrder.delivered_at?.toISOString(),
    deliveryProof: dbOrder.delivery_proof,
    rating: dbOrder.rating || undefined,
    notes: dbOrder.notes || undefined,
    cancelledReason: dbOrder.cancelled_reason || undefined,
    createdAt: dbOrder.created_at.toISOString(),
    updatedAt: dbOrder.created_at.toISOString(), // TODO: Add updated_at to schema
  };
}

/**
 * Map DB cylinder to Cylinder type
 */
export function mapCylinder(dbCylinder: DbCylinder): Cylinder {
  return {
    id: dbCylinder.id,
    serialNumber: dbCylinder.serial_number,
    sizeKg: dbCylinder.size_kg,
    status: dbCylinder.status as any,
    locationType: dbCylinder.location_type as any,
    locationId: dbCylinder.location_id,
    fillCount: dbCylinder.fill_count,
    lastFilledAt: dbCylinder.last_filled_at?.toISOString(),
    lastInspectedAt: dbCylinder.last_inspected_at?.toISOString(),
    nextInspectionDue: dbCylinder.next_inspection_due?.toISOString(),
    manufacturedAt: dbCylinder.manufactured_at?.toISOString(),
    condemnedAt: dbCylinder.condemned_at?.toISOString(),
    createdAt: dbCylinder.manufactured_at?.toISOString() || new Date().toISOString(),
  };
}

/**
 * Map DB driver to Driver type
 */
export function mapDriver(dbDriver: DbDriver): Driver {
  return {
    id: dbDriver.id,
    name: dbDriver.name,
    phone: dbDriver.phone,
    licenseNumber: dbDriver.license_number,
    licenseExpiry: dbDriver.license_expiry.toISOString(),
    lpgsaCertNumber: dbDriver.lpgsa_cert_number,
    certExpiry: dbDriver.cert_expiry.toISOString(),
    vehicleId: dbDriver.vehicle_id || undefined,
    status: dbDriver.status as any,
    currentLocation: dbDriver.current_location,
    ratingAvg: dbDriver.rating_avg,
    totalDeliveries: dbDriver.total_deliveries,
    todayDeliveries: 0, // TODO: Calculate from orders
    todayEarnings: 0, // TODO: Calculate from orders
    hiredAt: dbDriver.hired_at.toISOString(),
    active: dbDriver.active,
  };
}

/**
 * Map DB vehicle to Vehicle type
 */
export function mapVehicle(dbVehicle: DbVehicle): Vehicle {
  return {
    id: dbVehicle.id,
    registration: dbVehicle.registration,
    make: dbVehicle.make,
    model: dbVehicle.model,
    capacityCylinders: dbVehicle.capacity_cylinders,
    currentStock: dbVehicle.current_stock as any,
    insuranceExpiry: dbVehicle.insurance_expiry.toISOString(),
    serviceDueDate: dbVehicle.service_due_date.toISOString(),
    gpsDeviceId: dbVehicle.gps_device_id || undefined,
    active: dbVehicle.active,
  };
}

/**
 * Map DB pod to Pod type
 */
export function mapPod(dbPod: DbPod): Pod {
  return {
    id: dbPod.id,
    name: dbPod.name,
    location: dbPod.location,
    operatorId: dbPod.operator_id || undefined,
    operatorName: undefined, // TODO: Join with user table
    stock: dbPod.stock as any,
    operatingHours: dbPod.operating_hours,
    fibertimePopId: dbPod.fibertime_pop_id || undefined,
    active: dbPod.active,
  };
}

/**
 * Map DB depot to Depot type
 */
export function mapDepot(dbDepot: DbDepot): Depot {
  return {
    id: dbDepot.id,
    name: dbDepot.name,
    location: dbDepot.location,
    bulkStorageCapacityTonnes: dbDepot.bulk_storage_capacity_tonnes,
    currentStockTonnes: dbDepot.current_stock_tonnes,
    cylinderStock: dbDepot.cylinder_stock as any,
    active: dbDepot.active,
  };
}

/**
 * Map DB product to Product type
 */
export function mapProduct(dbProduct: DbProduct): Product {
  // Extract default price from prices array
  const defaultPrice = Array.isArray(dbProduct.prices) && dbProduct.prices.length > 0
    ? dbProduct.prices[0].price || 0
    : 0;

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description || '',
    sku: dbProduct.sku,
    sizeKg: dbProduct.size_kg,
    type: dbProduct.type as any,
    price: defaultPrice,
    icon: dbProduct.image_url || '',
    active: dbProduct.active,
  };
}

/**
 * Convert camelCase to snake_case for DB writes
 */
export function toSnakeCase(obj: any): any {
  const result: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}
