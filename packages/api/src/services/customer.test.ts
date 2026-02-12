// ============================================================================
// Customer Service Tests
// TDD: Write tests first, then implement
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { CustomerService } from './customer.js';
import { db } from '../db/index.js';
import { createTestCustomer } from '../test/factories.js';
import { customers } from '../db/schema.js';

describe('CustomerService', () => {
  let customerService: CustomerService;

  beforeEach(() => {
    customerService = new CustomerService(db);
  });

  describe('registerCustomer', () => {
    it('should register a new customer with generated referral code', async () => {
      const customer = await customerService.registerCustomer({
        phone: '+27781234567',
        name: 'John Doe',
        address: {
          text: '123 Main Street',
          lat: -24.6792,
          lng: 30.3247,
          isDefault: true,
        },
      });

      expect(customer.id).toBeDefined();
      expect(customer.phone).toBe('+27781234567');
      expect(customer.name).toBe('John Doe');
      expect(customer.referralCode).toMatch(/^REF-/);
      expect(customer.addresses).toHaveLength(1);
      expect(customer.walletBalance).toBe(0);
      expect(customer.segment).toBe('new');
      expect(customer.status).toBe('active');
    });

    it('should throw error if phone number already exists', async () => {
      await customerService.registerCustomer({
        phone: '+27781234567',
        name: 'John Doe',
        address: { text: '123 Main Street', isDefault: true },
      });

      await expect(
        customerService.registerCustomer({
          phone: '+27781234567',
          name: 'Jane Doe',
          address: { text: '456 Oak Street', isDefault: true },
        })
      ).rejects.toThrow('Customer with this phone number already exists');
    });

    it('should handle referral codes when registering', async () => {
      const referrer = await customerService.registerCustomer({
        phone: '+27781111111',
        name: 'Referrer',
        address: { text: '123 Main Street', isDefault: true },
      });

      const referred = await customerService.registerCustomer({
        phone: '+27782222222',
        name: 'Referred',
        address: { text: '456 Oak Street', isDefault: true },
        referredBy: referrer.referralCode,
      });

      expect(referred.referredBy).toBe(referrer.id);
    });
  });

  describe('getCustomer', () => {
    it('should get customer by id', async () => {
      const created = await customerService.registerCustomer({
        phone: '+27781234567',
        name: 'John Doe',
        address: { text: '123 Main Street', isDefault: true },
      });

      const retrieved = await customerService.getCustomer(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.name).toBe(created.name);
    });

    it('should return null for non-existent customer', async () => {
      const retrieved = await customerService.getCustomer('non-existent');

      expect(retrieved).toBeNull();
    });
  });

  describe('getCustomerByPhone', () => {
    it('should get customer by phone number', async () => {
      const created = await customerService.registerCustomer({
        phone: '+27781234567',
        name: 'John Doe',
        address: { text: '123 Main Street', isDefault: true },
      });

      const retrieved = await customerService.getCustomerByPhone('+27781234567');

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.phone).toBe('+27781234567');
    });

    it('should return null for non-existent phone', async () => {
      const retrieved = await customerService.getCustomerByPhone('+27789999999');

      expect(retrieved).toBeNull();
    });
  });

  describe('updateCustomer', () => {
    it('should update customer name', async () => {
      const customer = await customerService.registerCustomer({
        phone: '+27781234567',
        name: 'John Doe',
        address: { text: '123 Main Street', isDefault: true },
      });

      const updated = await customerService.updateCustomer(customer.id, {
        name: 'Jane Doe',
      });

      expect(updated.name).toBe('Jane Doe');
    });

    it('should update customer addresses', async () => {
      const customer = await customerService.registerCustomer({
        phone: '+27781234567',
        name: 'John Doe',
        address: { text: '123 Main Street', isDefault: true },
      });

      const updated = await customerService.updateCustomer(customer.id, {
        addresses: [
          { text: '123 Main Street', isDefault: false },
          { text: '456 Oak Street', isDefault: true },
        ],
      });

      expect(updated.addresses).toHaveLength(2);
      expect(updated.addresses[1].text).toBe('456 Oak Street');
    });

    it('should throw error if customer does not exist', async () => {
      await expect(
        customerService.updateCustomer('non-existent', { name: 'New Name' })
      ).rejects.toThrow('Customer not found');
    });
  });

  describe('updateCustomerSegment', () => {
    it('should update customer segment', async () => {
      const customer = await customerService.registerCustomer({
        phone: '+27781234567',
        name: 'John Doe',
        address: { text: '123 Main Street', isDefault: true },
      });

      const updated = await customerService.updateCustomerSegment(customer.id, 'active');

      expect(updated.segment).toBe('active');
    });
  });

  describe('getWalletBalance', () => {
    it('should return customer wallet balance', async () => {
      const customer = await customerService.registerCustomer({
        phone: '+27781234567',
        name: 'John Doe',
        address: { text: '123 Main Street', isDefault: true },
      });

      const balance = await customerService.getWalletBalance(customer.id);

      expect(balance).toBe(0);
    });
  });

  describe('topUpWallet', () => {
    it('should add funds to customer wallet', async () => {
      const customer = await customerService.registerCustomer({
        phone: '+27781234567',
        name: 'John Doe',
        address: { text: '123 Main Street', isDefault: true },
      });

      await customerService.topUpWallet(customer.id, 100);

      const balance = await customerService.getWalletBalance(customer.id);
      expect(balance).toBe(100);
    });

    it('should handle multiple top-ups', async () => {
      const customer = await customerService.registerCustomer({
        phone: '+27781234567',
        name: 'John Doe',
        address: { text: '123 Main Street', isDefault: true },
      });

      await customerService.topUpWallet(customer.id, 100);
      await customerService.topUpWallet(customer.id, 50);

      const balance = await customerService.getWalletBalance(customer.id);
      expect(balance).toBe(150);
    });
  });

  describe('debitWallet', () => {
    it('should deduct funds from customer wallet', async () => {
      const customer = await customerService.registerCustomer({
        phone: '+27781234567',
        name: 'John Doe',
        address: { text: '123 Main Street', isDefault: true },
      });

      await customerService.topUpWallet(customer.id, 100);
      await customerService.debitWallet(customer.id, 30);

      const balance = await customerService.getWalletBalance(customer.id);
      expect(balance).toBe(70);
    });

    it('should throw error if insufficient balance', async () => {
      const customer = await customerService.registerCustomer({
        phone: '+27781234567',
        name: 'John Doe',
        address: { text: '123 Main Street', isDefault: true },
      });

      await expect(customerService.debitWallet(customer.id, 100)).rejects.toThrow(
        'Insufficient wallet balance'
      );
    });
  });
});
