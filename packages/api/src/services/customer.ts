// ============================================================================
// Customer Service
// Handles customer registration, profile management, and wallet operations
// ============================================================================

import { randomUUID } from 'crypto';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
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
   * Top up customer wallet
   */
  async topUpWallet(customerId: string, amount: number): Promise<void> {
    const customer = await this.getCustomer(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const newBalance = customer.walletBalance + amount;

    await this.db
      .update(customers)
      .set({ wallet_balance: newBalance })
      .where(eq(customers.id, customerId));
  }

  /**
   * Debit customer wallet
   */
  async debitWallet(customerId: string, amount: number): Promise<void> {
    const customer = await this.getCustomer(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    if (customer.walletBalance < amount) {
      throw new Error('Insufficient wallet balance');
    }

    const newBalance = customer.walletBalance - amount;

    await this.db
      .update(customers)
      .set({ wallet_balance: newBalance })
      .where(eq(customers.id, customerId));
  }

  /**
   * Generate unique referral code
   */
  private generateReferralCode(): string {
    return `REF-${randomUUID().slice(0, 8).toUpperCase()}`;
  }
}
