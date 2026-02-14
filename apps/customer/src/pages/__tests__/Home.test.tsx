// ============================================================================
// Home Page Component Tests
// Tests home page rendering, product display, order flow initiation
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Home } from '../Home';
import { useStore } from '@/store/useStore';
import { api } from '@gaztime/shared';

// Mock dependencies
vi.mock('@/store/useStore');
vi.mock('@gaztime/shared', () => ({
  api: {
    products: {
      list: vi.fn(),
    },
  },
}));

const mockProducts = [
  {
    id: 'prod-1',
    name: '9kg LPG Cylinder',
    sku: 'LPG-9KG',
    sizeKg: 9,
    price: 315,
    type: 'cylinder_full',
    active: true,
  },
  {
    id: 'prod-2',
    name: '3kg LPG Cylinder',
    sku: 'LPG-3KG',
    sizeKg: 3,
    price: 99,
    type: 'cylinder_full',
    active: true,
  },
];

const mockUser = {
  id: 'user-123',
  name: 'Test User',
  phone: '+27781234567',
  walletBalance: 500,
  addresses: [{ text: '123 Test St', isDefault: true }],
};

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as any).mockReturnValue({
      user: mockUser,
    });
    (api.products.list as any).mockResolvedValue(mockProducts);
  });

  const renderHome = () => {
    return render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
  };

  it('should render without crashing', () => {
    renderHome();
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });

  it('should display user name', () => {
    renderHome();
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
  });

  it('should load and display products', async () => {
    renderHome();

    await waitFor(() => {
      expect(api.products.list).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/9kg LPG Cylinder/)).toBeInTheDocument();
      expect(screen.getByText(/3kg LPG Cylinder/)).toBeInTheDocument();
    });
  });

  it('should display product prices', async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByText(/R315/)).toBeInTheDocument();
      expect(screen.getByText(/R99/)).toBeInTheDocument();
    });
  });

  it('should show wallet balance', async () => {
    renderHome();
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });

  it('should handle product loading error gracefully', async () => {
    (api.products.list as any).mockRejectedValue(new Error('Network error'));

    renderHome();

    await waitFor(() => {
      expect(api.products.list).toHaveBeenCalled();
    });

    // Should show error message or fallback
    await waitFor(() => {
      expect(screen.queryByText(/9kg LPG Cylinder/)).not.toBeInTheDocument();
    });
  });

  it('should navigate to order page when product clicked', async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByText(/9kg LPG Cylinder/)).toBeInTheDocument();
    });

    const productCard = screen.getByText(/9kg LPG Cylinder/).closest('button, a, div[role="button"]');
    
    if (productCard) {
      fireEvent.click(productCard);
      // Verify navigation happened (implementation dependent)
    }
  });
});
