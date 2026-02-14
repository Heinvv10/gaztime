// ============================================================================
// OrderProduct Component Tests
// Tests product selection, cart, checkout flow
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { OrderProduct } from '../OrderProduct';
import { useStore } from '@/store/useStore';
import { api } from '@gaztime/shared';

vi.mock('@/store/useStore');
vi.mock('@gaztime/shared', () => ({
  api: {
    products: {
      list: vi.fn(),
    },
    orders: {
      create: vi.fn(),
    },
    customers: {
      debitWallet: vi.fn(),
    },
  },
}));

const mockUser = {
  id: 'user-123',
  name: 'Test User',
  phone: '+27781234567',
  walletBalance: 1000,
  addresses: [
    { text: '123 Main St', isDefault: true, location: { lat: -26, lng: 28 } },
  ],
};

const mockProducts = [
  {
    id: 'prod-1',
    name: '9kg Gas Cylinder',
    sku: 'GAS-9KG',
    sizeKg: 9,
    price: 350,
    type: 'cylinder_full',
    active: true,
  },
  {
    id: 'prod-2',
    name: '4.5kg Gas Cylinder',
    sku: 'GAS-4.5KG',
    sizeKg: 4.5,
    price: 175,
    type: 'cylinder_full',
    active: true,
  },
];

describe('OrderProduct Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as any).mockReturnValue({
      user: mockUser,
      updateUser: vi.fn(),
    });
    (api.products.list as any).mockResolvedValue(mockProducts);
  });

  const renderOrderProduct = () => {
    return render(
      <BrowserRouter>
        <OrderProduct />
      </BrowserRouter>
    );
  };

  it('should display available products', async () => {
    renderOrderProduct();

    await waitFor(() => {
      expect(screen.getByText('9kg Gas Cylinder')).toBeInTheDocument();
      expect(screen.getByText('4.5kg Gas Cylinder')).toBeInTheDocument();
    });
  });

  it('should add product to cart', async () => {
    renderOrderProduct();

    await waitFor(() => {
      expect(screen.getByText('9kg Gas Cylinder')).toBeInTheDocument();
    });

    const addButton = screen.getAllByText(/add to cart|select/i)[0];
    fireEvent.click(addButton);

    expect(screen.getByText(/1.*item/i)).toBeInTheDocument();
  });

  it('should update quantity in cart', async () => {
    renderOrderProduct();

    await waitFor(() => {
      expect(screen.getByText('9kg Gas Cylinder')).toBeInTheDocument();
    });

    // Add product
    const addButton = screen.getAllByText(/add|select/i)[0];
    fireEvent.click(addButton);

    // Increase quantity
    const increaseBtn = screen.getByLabelText(/increase quantity/i);
    fireEvent.click(increaseBtn);

    expect(screen.getByText(/2.*items/i)).toBeInTheDocument();
  });

  it('should calculate total correctly', async () => {
    renderOrderProduct();

    await waitFor(() => {
      expect(screen.getByText('9kg Gas Cylinder')).toBeInTheDocument();
    });

    // Add 2x 9kg (350 each = 700)
    const addButton = screen.getAllByText(/add|select/i)[0];
    fireEvent.click(addButton);

    const increaseBtn = screen.getByLabelText(/increase/i);
    fireEvent.click(increaseBtn);

    expect(screen.getByText(/R?700/)).toBeInTheDocument();
  });

  it('should create order with wallet payment', async () => {
    const mockCreateOrder = vi.fn().mockResolvedValue({
      id: 'order-123',
      status: 'pending',
      reference: 'ORD-123',
    });
    (api.orders.create as any).mockImplementation(mockCreateOrder);

    renderOrderProduct();

    await waitFor(() => {
      expect(screen.getByText('9kg Gas Cylinder')).toBeInTheDocument();
    });

    // Add product
    const addButton = screen.getAllByText(/add|select/i)[0];
    fireEvent.click(addButton);

    // Select wallet payment
    const walletOption = screen.getByText(/wallet/i);
    fireEvent.click(walletOption);

    // Checkout
    const checkoutBtn = screen.getByText(/checkout|place order/i);
    fireEvent.click(checkoutBtn);

    await waitFor(() => {
      expect(mockCreateOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'user-123',
          paymentMethod: 'wallet',
          items: expect.arrayContaining([
            expect.objectContaining({
              productId: 'prod-1',
              quantity: 1,
            }),
          ]),
        })
      );
    });
  });

  it('should create order with cash payment', async () => {
    const mockCreateOrder = vi.fn().mockResolvedValue({
      id: 'order-124',
      status: 'pending',
    });
    (api.orders.create as any).mockImplementation(mockCreateOrder);

    renderOrderProduct();

    await waitFor(() => {
      expect(screen.getByText('9kg Gas Cylinder')).toBeInTheDocument();
    });

    // Add product
    const addButton = screen.getAllByText(/add|select/i)[0];
    fireEvent.click(addButton);

    // Select cash payment
    const cashOption = screen.getByText(/cash on delivery/i);
    fireEvent.click(cashOption);

    // Checkout
    const checkoutBtn = screen.getByText(/checkout|place order/i);
    fireEvent.click(checkoutBtn);

    await waitFor(() => {
      expect(mockCreateOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: 'cash',
        })
      );
    });
  });

  it('should prevent checkout with insufficient wallet balance', async () => {
    (useStore as any).mockReturnValue({
      user: { ...mockUser, walletBalance: 100 }, // Less than product price
      updateUser: vi.fn(),
    });

    renderOrderProduct();

    await waitFor(() => {
      expect(screen.getByText('9kg Gas Cylinder')).toBeInTheDocument();
    });

    // Add product (350)
    const addButton = screen.getAllByText(/add|select/i)[0];
    fireEvent.click(addButton);

    // Select wallet payment
    const walletOption = screen.getByText(/wallet/i);
    fireEvent.click(walletOption);

    // Checkout should show error
    const checkoutBtn = screen.getByText(/checkout|place order/i);
    fireEvent.click(checkoutBtn);

    await waitFor(() => {
      expect(screen.getByText(/insufficient.*balance/i)).toBeInTheDocument();
    });

    expect(api.orders.create).not.toHaveBeenCalled();
  });

  it('should show delivery address selection', async () => {
    renderOrderProduct();

    await waitFor(() => {
      expect(screen.getByText('9kg Gas Cylinder')).toBeInTheDocument();
    });

    // Add product
    const addButton = screen.getAllByText(/add|select/i)[0];
    fireEvent.click(addButton);

    // Should show default address
    expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
  });

  it('should handle order creation failure', async () => {
    (api.orders.create as any).mockRejectedValue(
      new Error('Order creation failed')
    );

    renderOrderProduct();

    await waitFor(() => {
      expect(screen.getByText('9kg Gas Cylinder')).toBeInTheDocument();
    });

    // Add product and checkout
    const addButton = screen.getAllByText(/add|select/i)[0];
    fireEvent.click(addButton);

    const cashOption = screen.getByText(/cash/i);
    fireEvent.click(cashOption);

    const checkoutBtn = screen.getByText(/checkout|place order/i);
    fireEvent.click(checkoutBtn);

    await waitFor(() => {
      expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
    });
  });

  it('should remove item from cart', async () => {
    renderOrderProduct();

    await waitFor(() => {
      expect(screen.getByText('9kg Gas Cylinder')).toBeInTheDocument();
    });

    // Add product
    const addButton = screen.getAllByText(/add|select/i)[0];
    fireEvent.click(addButton);

    expect(screen.getByText(/1.*item/i)).toBeInTheDocument();

    // Remove product
    const removeBtn = screen.getByLabelText(/remove|delete/i);
    fireEvent.click(removeBtn);

    expect(screen.queryByText(/1.*item/i)).not.toBeInTheDocument();
  });
});
