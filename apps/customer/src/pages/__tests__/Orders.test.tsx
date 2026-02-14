// ============================================================================
// Orders Page Component Tests
// Tests order history display, filtering, status tracking
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Orders } from '../Orders';
import { useStore } from '@/store/useStore';
import { api } from '@gaztime/shared';

// Mock dependencies
vi.mock('@/store/useStore');
vi.mock('@gaztime/shared', () => ({
  api: {
    orders: {
      list: vi.fn(),
    },
  },
}));

const mockOrders = [
  {
    id: 'order-1',
    reference: 'GT-001',
    status: 'delivered',
    totalAmount: 315,
    items: [
      {
        productId: 'prod-1',
        product: { name: '9kg LPG Cylinder' },
        quantity: 1,
        unitPrice: 315,
      },
    ],
    deliveryAddress: { text: '123 Test St' },
    createdAt: new Date().toISOString(),
    deliveredAt: new Date().toISOString(),
  },
  {
    id: 'order-2',
    reference: 'GT-002',
    status: 'in_transit',
    totalAmount: 99,
    items: [
      {
        productId: 'prod-2',
        product: { name: '3kg LPG Cylinder' },
        quantity: 1,
        unitPrice: 99,
      },
    ],
    deliveryAddress: { text: '456 Main St' },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'order-3',
    reference: 'GT-003',
    status: 'pending',
    totalAmount: 315,
    items: [
      {
        productId: 'prod-1',
        product: { name: '9kg LPG Cylinder' },
        quantity: 1,
        unitPrice: 315,
      },
    ],
    deliveryAddress: { text: '789 Oak Ave' },
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

const mockUser = {
  id: 'user-123',
  name: 'Test User',
  phone: '+27781234567',
  walletBalance: 500,
};

describe('Orders Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as any).mockReturnValue({
      user: mockUser,
    });
    (api.orders.list as any).mockResolvedValue(mockOrders);
  });

  const renderOrders = () => {
    return render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );
  };

  it('should render without crashing', () => {
    renderOrders();
    expect(screen.getByText(/orders/i)).toBeInTheDocument();
  });

  it('should load and display orders', async () => {
    renderOrders();

    await waitFor(() => {
      expect(api.orders.list).toHaveBeenCalledWith({ customerId: 'user-123' });
    });

    await waitFor(() => {
      expect(screen.getByText(/GT-001/)).toBeInTheDocument();
      expect(screen.getByText(/GT-002/)).toBeInTheDocument();
      expect(screen.getByText(/GT-003/)).toBeInTheDocument();
    });
  });

  it('should display order statuses', async () => {
    renderOrders();

    await waitFor(() => {
      expect(screen.getByText(/delivered/i)).toBeInTheDocument();
      expect(screen.getByText(/in transit/i)).toBeInTheDocument();
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });
  });

  it('should display order amounts', async () => {
    renderOrders();

    await waitFor(() => {
      expect(screen.getByText(/R315/)).toBeInTheDocument();
      expect(screen.getByText(/R99/)).toBeInTheDocument();
    });
  });

  it('should show empty state when no orders', async () => {
    (api.orders.list as any).mockResolvedValue([]);

    renderOrders();

    await waitFor(() => {
      expect(screen.getByText(/no orders/i)).toBeInTheDocument();
    });
  });

  it('should handle loading error gracefully', async () => {
    (api.orders.list as any).mockRejectedValue(new Error('Network error'));

    renderOrders();

    await waitFor(() => {
      expect(api.orders.list).toHaveBeenCalled();
    });

    // Should show error message or fallback
    await waitFor(() => {
      expect(screen.queryByText(/GT-001/)).not.toBeInTheDocument();
    });
  });

  it('should display product names in orders', async () => {
    renderOrders();

    await waitFor(() => {
      expect(screen.getByText(/9kg LPG Cylinder/)).toBeInTheDocument();
      expect(screen.getByText(/3kg LPG Cylinder/)).toBeInTheDocument();
    });
  });
});
