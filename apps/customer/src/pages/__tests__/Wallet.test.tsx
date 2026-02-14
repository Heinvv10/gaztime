// ============================================================================
// Wallet Component Tests
// Tests wallet display, top-up flow, transaction history
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Wallet } from '../Wallet';
import { useStore } from '@/store/useStore';
import { api } from '@gaztime/shared';

// Mock dependencies
vi.mock('@/store/useStore');
vi.mock('@gaztime/shared', () => ({
  api: {
    customers: {
      creditWallet: vi.fn(),
    },
    orders: {
      list: vi.fn(),
    },
  },
}));

const mockUser = {
  id: 'user-123',
  name: 'Test User',
  phone: '+27781234567',
  walletBalance: 500,
  referralCode: 'REF-TEST',
  addresses: [],
};

const mockOrders = [
  {
    id: 'order-1',
    reference: 'ORD-001',
    totalAmount: 350,
    status: 'delivered',
    createdAt: new Date().toISOString(),
    items: [{ product: { name: '9kg Gas' } }],
  },
  {
    id: 'order-2',
    reference: 'ORD-002',
    totalAmount: 175,
    status: 'delivered',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    items: [{ product: { name: '4.5kg Gas' } }],
  },
];

describe('Wallet Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as any).mockReturnValue({
      user: mockUser,
      updateUser: vi.fn(),
    });
    (api.orders.list as any).mockResolvedValue(mockOrders);
  });

  const renderWallet = () => {
    return render(
      <BrowserRouter>
        <Wallet />
      </BrowserRouter>
    );
  };

  it('should display wallet balance', () => {
    renderWallet();
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });

  it('should load and display transaction history', async () => {
    renderWallet();

    await waitFor(() => {
      expect(api.orders.list).toHaveBeenCalledWith({ customerId: 'user-123' });
    });

    await waitFor(() => {
      expect(screen.getByText(/ORD-001/)).toBeInTheDocument();
      expect(screen.getByText(/ORD-002/)).toBeInTheDocument();
    });
  });

  it('should show top-up methods when top-up button clicked', () => {
    renderWallet();

    const topupButton = screen.getByText(/top up/i);
    fireEvent.click(topupButton);

    expect(screen.getByText(/Bank Transfer/)).toBeInTheDocument();
    expect(screen.getByText(/Voucher/)).toBeInTheDocument();
    expect(screen.getByText(/SnapScan/)).toBeInTheDocument();
  });

  it('should handle top-up with valid amount', async () => {
    const mockCreditWallet = vi.fn().mockResolvedValue({
      id: 'user-123',
      walletBalance: 1000,
    });
    (api.customers.creditWallet as any).mockImplementation(mockCreditWallet);

    renderWallet();

    // Open top-up modal
    const topupButton = screen.getByText(/top up/i);
    fireEvent.click(topupButton);

    // Select method
    const eftMethod = screen.getByText(/Bank Transfer/);
    fireEvent.click(eftMethod);

    // Enter amount
    const amountInput = screen.getByPlaceholderText(/enter amount/i);
    fireEvent.change(amountInput, { target: { value: '500' } });

    // Submit
    const submitButton = screen.getByText(/confirm/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreditWallet).toHaveBeenCalledWith(
        'user-123',
        500,
        expect.stringContaining('eft')
      );
    });
  });

  it('should reject invalid top-up amount', async () => {
    renderWallet();

    // Open top-up modal
    const topupButton = screen.getByText(/top up/i);
    fireEvent.click(topupButton);

    // Select method
    const eftMethod = screen.getByText(/Bank Transfer/);
    fireEvent.click(eftMethod);

    // Enter negative amount
    const amountInput = screen.getByPlaceholderText(/enter amount/i);
    fireEvent.change(amountInput, { target: { value: '-100' } });

    // Submit
    const submitButton = screen.getByText(/confirm/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/valid amount/i)).toBeInTheDocument();
    });

    expect(api.customers.creditWallet).not.toHaveBeenCalled();
  });

  it('should display error on top-up failure', async () => {
    (api.customers.creditWallet as any).mockRejectedValue(
      new Error('Payment failed')
    );

    renderWallet();

    // Open top-up modal
    const topupButton = screen.getByText(/top up/i);
    fireEvent.click(topupButton);

    // Select method and enter amount
    const eftMethod = screen.getByText(/Bank Transfer/);
    fireEvent.click(eftMethod);

    const amountInput = screen.getByPlaceholderText(/enter amount/i);
    fireEvent.change(amountInput, { target: { value: '500' } });

    // Submit
    const submitButton = screen.getByText(/confirm/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no transactions', () => {
    (api.orders.list as any).mockResolvedValue([]);

    renderWallet();

    expect(screen.getByText(/no transactions/i)).toBeInTheDocument();
  });

  it('should format transaction amounts correctly', async () => {
    renderWallet();

    await waitFor(() => {
      // Debits should show as negative
      expect(screen.getByText(/-350/)).toBeInTheDocument();
      expect(screen.getByText(/-175/)).toBeInTheDocument();
    });
  });
});
