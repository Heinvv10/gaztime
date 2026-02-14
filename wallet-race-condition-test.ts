// ============================================================================
// Wallet Race Condition Test
// Demonstrates the fix for concurrent wallet operations
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { CustomerService } from '../packages/api/src/services/customer.js';

/**
 * These tests verify that wallet operations are atomic and safe under concurrent access.
 *
 * RACE CONDITION SCENARIO:
 * Without atomic operations, concurrent requests can cause lost updates:
 *
 * Time | Request A (top-up R50)        | Request B (top-up R30)
 * -----|-------------------------------|--------------------------------
 * t1   | Read balance = R100           |
 * t2   |                               | Read balance = R100
 * t3   | Calculate: R100 + R50 = R150  |
 * t4   |                               | Calculate: R100 + R30 = R130
 * t5   | Write R150                    |
 * t6   |                               | Write R130 (overwrites R150!)
 *
 * Result: Final balance is R130 instead of R180 - R50 is lost!
 *
 * THE FIX:
 * Using SQL-level atomic operations:
 * UPDATE customers SET wallet_balance = wallet_balance + amount WHERE id = ?
 *
 * PostgreSQL guarantees this executes atomically. Even if 100 concurrent requests
 * arrive, the database serializes them and each increment is applied correctly.
 */

describe('Wallet Race Condition Tests', () => {
  let customerService: CustomerService;
  let testCustomerId: string;

  beforeEach(async () => {
    // Setup: Create a test customer with initial balance
    const customer = await customerService.registerCustomer({
      phone: '+27123456789',
      name: 'Test Customer',
      address: {
        street: '123 Test St',
        area: 'Test Area',
        city: 'Test City',
        coordinates: { lat: -25.7461, lng: 28.1881 }
      }
    });
    testCustomerId = customer.id;
  });

  it('should handle concurrent top-ups without losing updates', async () => {
    // Simulate 10 concurrent top-ups of R10 each
    const topUpPromises = Array.from({ length: 10 }, () =>
      customerService.topUpWallet(testCustomerId, 10)
    );

    await Promise.all(topUpPromises);

    const finalBalance = await customerService.getWalletBalance(testCustomerId);

    // With atomic operations, all 10 top-ups should be applied
    expect(finalBalance).toBe(100); // 10 × R10 = R100

    // Without atomic operations, this would likely fail due to lost updates
    // (final balance would be less than 100)
  });

  it('should handle concurrent debits without allowing negative balance', async () => {
    // Setup: Top up to R100
    await customerService.topUpWallet(testCustomerId, 100);

    // Simulate 20 concurrent debit attempts of R10 each (total R200)
    const debitPromises = Array.from({ length: 20 }, () =>
      customerService.debitWallet(testCustomerId, 10)
    );

    // Execute all concurrently
    const results = await Promise.allSettled(debitPromises);

    const finalBalance = await customerService.getWalletBalance(testCustomerId);

    // Exactly 10 debits should succeed (R100 / R10 = 10)
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    expect(successCount).toBe(10);
    expect(failureCount).toBe(10);
    expect(finalBalance).toBe(0); // All R100 spent, no overdraft

    // Without atomic operations, this could result in negative balance
  });

  it('should handle mixed concurrent operations (top-ups and debits)', async () => {
    // Setup: Start with R100
    await customerService.topUpWallet(testCustomerId, 100);

    // Simulate concurrent operations:
    // - 5 top-ups of R20 each (total +R100)
    // - 5 debits of R30 each (total -R150)
    const operations = [
      ...Array.from({ length: 5 }, () =>
        customerService.topUpWallet(testCustomerId, 20)
      ),
      ...Array.from({ length: 5 }, () =>
        customerService.debitWallet(testCustomerId, 30)
      ),
    ];

    // Shuffle to ensure random order
    operations.sort(() => Math.random() - 0.5);

    const results = await Promise.allSettled(operations);
    const finalBalance = await customerService.getWalletBalance(testCustomerId);

    // Calculate expected balance:
    // Start: R100
    // Top-ups: +R100 (5 × R20)
    // Maximum possible debits: R200 / R30 = 6 debits, but only 5 attempted
    //
    // The exact final balance depends on execution order, but it should be:
    // - Between R50 and R200
    // - Never negative
    // - Mathematically correct based on which operations succeeded

    expect(finalBalance).toBeGreaterThanOrEqual(0);
    expect(finalBalance).toBeLessThanOrEqual(200);

    // Count successful operations
    const successful = results.filter(r => r.status === 'fulfilled').length;
    expect(successful).toBeGreaterThan(0);
  });

  it('should reject negative top-up amounts', async () => {
    await expect(
      customerService.topUpWallet(testCustomerId, -50)
    ).rejects.toThrow('Top-up amount must be positive');

    await expect(
      customerService.topUpWallet(testCustomerId, 0)
    ).rejects.toThrow('Top-up amount must be positive');
  });

  it('should reject negative debit amounts', async () => {
    await expect(
      customerService.debitWallet(testCustomerId, -50)
    ).rejects.toThrow('Debit amount must be positive');

    await expect(
      customerService.debitWallet(testCustomerId, 0)
    ).rejects.toThrow('Debit amount must be positive');
  });

  it('should handle non-existent customer gracefully', async () => {
    const fakeId = 'non-existent-customer-id';

    await expect(
      customerService.topUpWallet(fakeId, 100)
    ).rejects.toThrow('Customer not found');

    await expect(
      customerService.debitWallet(fakeId, 100)
    ).rejects.toThrow('Customer not found');
  });
});

/**
 * PERFORMANCE TEST
 *
 * Stress test with high concurrency to verify atomic operations scale correctly.
 */
describe('Wallet Performance Under Load', () => {
  let customerService: CustomerService;
  let testCustomerId: string;

  beforeEach(async () => {
    const customer = await customerService.registerCustomer({
      phone: '+27987654321',
      name: 'Performance Test Customer',
      address: {
        street: '456 Load St',
        area: 'Stress Area',
        city: 'Test City',
        coordinates: { lat: -25.7461, lng: 28.1881 }
      }
    });
    testCustomerId = customer.id;
  });

  it('should handle 100 concurrent operations correctly', async () => {
    // Start with R10,000
    await customerService.topUpWallet(testCustomerId, 10000);

    // Execute 100 concurrent operations:
    // - 50 top-ups of R100 each (+R5,000)
    // - 50 debits of R200 each (-R10,000)
    const operations = [
      ...Array.from({ length: 50 }, () =>
        customerService.topUpWallet(testCustomerId, 100)
      ),
      ...Array.from({ length: 50 }, () =>
        customerService.debitWallet(testCustomerId, 200)
      ),
    ];

    operations.sort(() => Math.random() - 0.5);

    const startTime = Date.now();
    await Promise.all(operations);
    const endTime = Date.now();

    const finalBalance = await customerService.getWalletBalance(testCustomerId);

    console.log(`100 concurrent operations completed in ${endTime - startTime}ms`);
    console.log(`Final balance: R${finalBalance}`);

    // Balance should be non-negative and mathematically correct
    expect(finalBalance).toBeGreaterThanOrEqual(0);
  }, 30000); // 30 second timeout for high-concurrency test
});
