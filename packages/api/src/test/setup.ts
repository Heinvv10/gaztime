// ============================================================================
// Test Setup - PostgreSQL
// ============================================================================

import { beforeEach, afterAll } from 'vitest';
import { db, closeDb } from '../db/index.js';
import { sql } from 'drizzle-orm';
import {
  walletTransactions,
  wallets,
  subscriptions,
  orders,
  cylinders,
  drivers,
  vehicles,
  pods,
  depots,
  products,
  customers,
} from '../db/schema.js';

// Clear all tables before each test
beforeEach(async () => {
  // Delete in order to avoid foreign key constraints
  await db.delete(walletTransactions);
  await db.delete(wallets);
  await db.delete(subscriptions);
  await db.delete(orders);
  await db.delete(cylinders);
  await db.delete(drivers);
  await db.delete(vehicles);
  await db.delete(pods);
  await db.delete(depots);
  await db.delete(products);
  await db.delete(customers);
});

// Close database connection after all tests
afterAll(() => {
  closeDb();
});
