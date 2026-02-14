// ============================================================================
// Customer Service - FIXED VERSION with Atomic Wallet Operations
// Handles customer registration, profile management, and wallet operations
// ============================================================================

import { randomUUID } from 'crypto';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, sql } from 'drizzle-orm';
import { customers } from '../db/schema.js';
import { mapCustomer } from '../db/mappers.js';
import type {
  Customer,
  RegisterCustomerRequest,
  UpdateCustomerRequest,
  Address,
  CustomerSegment,
} from '../../../shared/src/types.js';

export class CustomerService {
  constructor(private db: BetterSQLite3Database<any>) {}

  /**
   * Register a new customer
   */
  async registerCustomer(
    request: RegisterCustomerRequest
  ): Promise<Customer> {
    // Check if phone already exists
    const existing = await this.getCustomerByPhone(request.phone);
    if (existing) {
      throw new Error('Customer with this phone number already exists');
    }

    // Handle referral code if provided
    let referred_by_id: string | null = null;
    if (request.referredBy) {
      const referrer = await this.db
        .select()
        .from(customers)
        .where(eq(customers.referral_code, request.referredBy))
        .then(r => r[0]);

      if (referrer) {
        referred_by_id = referrer.id;
      }
    }

    // Add id to address
    const addressWithId: Address = {
      ...request.address,
      id: randomUUID(),
    };

    // Create DB customer object (snake_case)
    const dbCustomer = {
      id: randomUUID(),
      phone: request.phone,
      name: request.name,
      addresses: [addressWithId],
      wallet_balance: 0,
      fibertime_account_id: null,
      referral_code: this.generateReferralCode(),
      referred_by: referred_by_id,
      segment: 'new',
      language_preference: request.languagePreference || 'en',
      status: 'active',
      created_at: new Date(),
    };

    // Insert into database
    await this.db.insert(customers).values(dbCustomer);

    // Return mapped customer
    return mapCustomer(dbCustomer);
  }

  /**
   * Get customer by ID
   */
  async getCustomer(id: string): Promise<Customer | null> {
    const dbCustomer = await this.db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .then(r => r[0]);

    return dbCustomer ? mapCustomer(dbCustomer) : null;
  }

  /**
   * Get customer by phone number
   */
  async getCustomerByPhone(phone: string): Promise<Customer | null> {
    const dbCustomer = await this.db
      .select()
      .from(customers)
      .where(eq(customers.phone, phone))
      .then(r => r[0]);

    return dbCustomer ? mapCustomer(dbCustomer) : null;
  }

  /**
   * Update customer profile
   */
  async updateCustomer(
    id: string,
    updates: UpdateCustomerRequest
  ): Promise<Customer> {
    const customer = await this.getCustomer(id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    await this.db.update(customers).set(updates).where(eq(customers.id, id));

    return this.getCustomer(id) as Promise<Customer>;
  }

  /**
   * Update customer segment
   */
  async updateCustomerSegment(
    id: string,
    segment: CustomerSegment
  ): Promise<Customer> {
    return this.updateCustomer(id, { segment });
  }

  /**
   * Get customer wallet balance
   */
  async getWalletBalance(customerId: string): Promise<number> {
    const customer = await this.getCustomer(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer.walletBalance;
  }

  /**
   * Top up customer wallet - ATOMIC OPERATION
   *
   * FIXED: Uses SQL-level atomic increment to prevent race conditions.
   * The database guarantees atomicity - no two concurrent updates can interfere.
   *
   * Previous implementation had a race condition:
   * 1. Thread A reads balance = 100
   * 2. Thread B reads balance = 100
   * 3. Thread A calculates newBalance = 100 + 50 = 150
   * 4. Thread B calculates newBalance = 100 + 30 = 130
   * 5. Thread A writes 150
   * 6. Thread B writes 130 (overwrites A's update, losing R50!)
   *
   * New implementation: UPDATE ... SET wallet_balance = wallet_balance + amount
   * This is executed atomically by PostgreSQL, preventing lost updates.
   */
  async topUpWallet(customerId: string, amount: number): Promise<void> {
    if (amount <= 0) {
      throw new Error('Top-up amount must be positive');
    }

    // Use atomic SQL increment - no read-modify-write race condition
    const result = await this.db
      .update(customers)
      .set({
        wallet_balance: sql`${customers.wallet_balance} + ${amount}`,
      })
      .where(eq(customers.id, customerId))
      .returning({ id: customers.id });

    // Check if customer exists by verifying update affected a row
    if (!result || result.length === 0) {
      throw new Error('Customer not found');
    }
  }

  /**
   * Debit customer wallet - ATOMIC OPERATION WITH BALANCE CHECK
   *
   * FIXED: Uses SQL-level atomic decrement with conditional update.
   * Prevents race conditions and ensures balance never goes negative.
   *
   * Previous implementation race condition:
   * 1. Thread A reads balance = 100
   * 2. Thread B reads balance = 100
   * 3. Thread A checks 100 >= 80 (pass), calculates newBalance = 20
   * 4. Thread B checks 100 >= 70 (pass), calculates newBalance = 30
   * 5. Thread A writes 20
   * 6. Thread B writes 30 (overwrites, loses R80 debit!)
   *
   * New implementation: UPDATE ... SET balance = balance - amount WHERE balance >= amount
   * PostgreSQL executes this atomically and only if sufficient balance exists.
   */
  async debitWallet(customerId: string, amount: number): Promise<void> {
    if (amount <= 0) {
      throw new Error('Debit amount must be positive');
    }

    // Use atomic SQL decrement with balance check
    // This prevents race conditions AND ensures balance never goes negative
    const result = await this.db
      .update(customers)
      .set({
        wallet_balance: sql`${customers.wallet_balance} - ${amount}`,
      })
      .where(
        sql`${customers.id} = ${customerId} AND ${customers.wallet_balance} >= ${amount}`
      )
      .returning({
        id: customers.id,
        wallet_balance: customers.wallet_balance
      });

    // Check if update succeeded
    if (!result || result.length === 0) {
      // Need to determine if customer doesn't exist or has insufficient balance
      const customer = await this.getCustomer(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }
      throw new Error('Insufficient wallet balance');
    }
  }

  /**
   * Generate unique referral code
   */
  private generateReferralCode(): string {
    return `REF-${randomUUID().slice(0, 8).toUpperCase()}`;
  }
}
