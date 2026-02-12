// ============================================================================
// GAZ TIME - Database Schema (Drizzle ORM)
// PostgreSQL with Neon
// ============================================================================

import { pgTable, text, integer, real, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ----------------------------------------------------------------------------
// Customers
// ----------------------------------------------------------------------------

export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  phone: text('phone').notNull().unique(),
  name: text('name').notNull(),
  addresses: jsonb('addresses').notNull().$type<any[]>(),
  wallet_balance: real('wallet_balance').notNull().default(0),
  fibertime_account_id: text('fibertime_account_id'),
  referral_code: text('referral_code').notNull().unique(),
  referred_by: text('referred_by'),
  segment: text('segment').notNull().default('new'),
  language_preference: text('language_preference').notNull().default('en'),
  status: text('status').notNull().default('active'),
  created_at: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  phoneIdx: index('customers_phone_idx').on(table.phone),
  referralCodeIdx: index('customers_referral_code_idx').on(table.referral_code),
}));

export const customersRelations = relations(customers, ({ many, one }) => ({
  orders: many(orders),
  wallets: many(wallets),
  subscriptions: many(subscriptions),
  referrer: one(customers, {
    fields: [customers.referred_by],
    references: [customers.id],
  }),
}));

// ----------------------------------------------------------------------------
// Orders
// ----------------------------------------------------------------------------

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  reference: text('reference').notNull().unique(),
  customer_id: text('customer_id'),
  channel: text('channel').notNull(),
  status: text('status').notNull().default('created'),
  items: jsonb('items').notNull().$type<any[]>(),
  delivery_address: jsonb('delivery_address').$type<any>(),
  delivery_fee: real('delivery_fee').notNull().default(0),
  total_amount: real('total_amount').notNull(),
  payment_method: text('payment_method').notNull(),
  payment_status: text('payment_status').notNull().default('pending'),
  driver_id: text('driver_id'),
  pod_id: text('pod_id'),
  assigned_at: timestamp('assigned_at'),
  picked_up_at: timestamp('picked_up_at'),
  delivered_at: timestamp('delivered_at'),
  delivery_proof: jsonb('delivery_proof').$type<any>(),
  rating: integer('rating'),
  notes: text('notes'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  cancelled_reason: text('cancelled_reason'),
}, (table) => ({
  customerIdx: index('orders_customer_idx').on(table.customer_id),
  statusIdx: index('orders_status_idx').on(table.status),
  driverIdx: index('orders_driver_idx').on(table.driver_id),
  createdAtIdx: index('orders_created_at_idx').on(table.created_at),
  referenceIdx: index('orders_reference_idx').on(table.reference),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  customer: one(customers, {
    fields: [orders.customer_id],
    references: [customers.id],
  }),
  driver: one(drivers, {
    fields: [orders.driver_id],
    references: [drivers.id],
  }),
  pod: one(pods, {
    fields: [orders.pod_id],
    references: [pods.id],
  }),
}));

// ----------------------------------------------------------------------------
// Products
// ----------------------------------------------------------------------------

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  size_kg: real('size_kg').notNull(),
  type: text('type').notNull(),
  prices: jsonb('prices').notNull().$type<any[]>(),
  active: boolean('active').notNull().default(true),
}, (table) => ({
  skuIdx: index('products_sku_idx').on(table.sku),
}));

// ----------------------------------------------------------------------------
// Cylinders
// ----------------------------------------------------------------------------

export const cylinders = pgTable('cylinders', {
  id: text('id').primaryKey(),
  serial_number: text('serial_number').notNull().unique(),
  size_kg: real('size_kg').notNull(),
  status: text('status').notNull().default('new'),
  location_type: text('location_type').notNull(),
  location_id: text('location_id').notNull(),
  fill_count: integer('fill_count').notNull().default(0),
  last_filled_at: timestamp('last_filled_at'),
  last_inspected_at: timestamp('last_inspected_at'),
  next_inspection_due: timestamp('next_inspection_due'),
  manufactured_at: timestamp('manufactured_at').notNull(),
  condemned_at: timestamp('condemned_at'),
  movements: jsonb('movements').notNull().default('[]').$type<any[]>(),
}, (table) => ({
  serialIdx: index('cylinders_serial_idx').on(table.serial_number),
  statusIdx: index('cylinders_status_idx').on(table.status),
  locationIdx: index('cylinders_location_idx').on(table.location_type, table.location_id),
}));

// ----------------------------------------------------------------------------
// Drivers
// ----------------------------------------------------------------------------

export const drivers = pgTable('drivers', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  license_number: text('license_number').notNull(),
  license_expiry: timestamp('license_expiry').notNull(),
  lpgsa_cert_number: text('lpgsa_cert_number').notNull(),
  cert_expiry: timestamp('cert_expiry').notNull(),
  vehicle_id: text('vehicle_id'),
  status: text('status').notNull().default('offline'),
  current_location: jsonb('current_location').$type<any>(),
  rating_avg: real('rating_avg').notNull().default(0),
  total_deliveries: integer('total_deliveries').notNull().default(0),
  hired_at: timestamp('hired_at').notNull(),
  active: boolean('active').notNull().default(true),
}, (table) => ({
  phoneIdx: index('drivers_phone_idx').on(table.phone),
  statusIdx: index('drivers_status_idx').on(table.status),
  vehicleIdx: index('drivers_vehicle_idx').on(table.vehicle_id),
}));

export const driversRelations = relations(drivers, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [drivers.vehicle_id],
    references: [vehicles.id],
  }),
  orders: many(orders),
}));

// ----------------------------------------------------------------------------
// Vehicles
// ----------------------------------------------------------------------------

export const vehicles = pgTable('vehicles', {
  id: text('id').primaryKey(),
  registration: text('registration').notNull().unique(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  capacity_cylinders: integer('capacity_cylinders').notNull(),
  current_stock: jsonb('current_stock').notNull().default('[]').$type<any[]>(),
  insurance_expiry: timestamp('insurance_expiry').notNull(),
  service_due_date: timestamp('service_due_date').notNull(),
  gps_device_id: text('gps_device_id'),
  active: boolean('active').notNull().default(true),
}, (table) => ({
  registrationIdx: index('vehicles_registration_idx').on(table.registration),
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  drivers: many(drivers),
}));

// ----------------------------------------------------------------------------
// Pods
// ----------------------------------------------------------------------------

export const pods = pgTable('pods', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  location: jsonb('location').notNull().$type<any>(),
  operator_id: text('operator_id'),
  stock: jsonb('stock').notNull().default('[]').$type<any[]>(),
  operating_hours: jsonb('operating_hours').notNull().$type<any>(),
  fibertime_pop_id: text('fibertime_pop_id'),
  active: boolean('active').notNull().default(true),
});

export const podsRelations = relations(pods, ({ many }) => ({
  orders: many(orders),
}));

// ----------------------------------------------------------------------------
// Depots
// ----------------------------------------------------------------------------

export const depots = pgTable('depots', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  location: jsonb('location').notNull().$type<any>(),
  bulk_storage_capacity_tonnes: real('bulk_storage_capacity_tonnes').notNull(),
  current_stock_tonnes: real('current_stock_tonnes').notNull(),
  cylinder_stock: jsonb('cylinder_stock').notNull().default('[]').$type<any[]>(),
  active: boolean('active').notNull().default(true),
});

// ----------------------------------------------------------------------------
// Wallets
// ----------------------------------------------------------------------------

export const wallets = pgTable('wallets', {
  id: text('id').primaryKey(),
  customer_id: text('customer_id').notNull().unique(),
  balance: real('balance').notNull().default(0),
  created_at: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  customerIdx: index('wallets_customer_idx').on(table.customer_id),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  customer: one(customers, {
    fields: [wallets.customer_id],
    references: [customers.id],
  }),
  transactions: many(walletTransactions),
}));

// ----------------------------------------------------------------------------
// Wallet Transactions
// ----------------------------------------------------------------------------

export const walletTransactions = pgTable('wallet_transactions', {
  id: text('id').primaryKey(),
  wallet_id: text('wallet_id').notNull(),
  type: text('type').notNull(),
  amount: real('amount').notNull(),
  reference: text('reference'),
  description: text('description').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  walletIdx: index('wallet_transactions_wallet_idx').on(table.wallet_id),
  createdAtIdx: index('wallet_transactions_created_at_idx').on(table.created_at),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [walletTransactions.wallet_id],
    references: [wallets.id],
  }),
}));

// ----------------------------------------------------------------------------
// Subscriptions
// ----------------------------------------------------------------------------

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  customer_id: text('customer_id').notNull(),
  product_id: text('product_id').notNull(),
  frequency: text('frequency').notNull(),
  delivery_day: text('delivery_day').notNull(),
  delivery_window: text('delivery_window').notNull(),
  payment_method: text('payment_method').notNull(),
  status: text('status').notNull().default('active'),
  next_delivery_date: timestamp('next_delivery_date').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  customerIdx: index('subscriptions_customer_idx').on(table.customer_id),
  statusIdx: index('subscriptions_status_idx').on(table.status),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  customer: one(customers, {
    fields: [subscriptions.customer_id],
    references: [customers.id],
  }),
  product: one(products, {
    fields: [subscriptions.product_id],
    references: [products.id],
  }),
}));
