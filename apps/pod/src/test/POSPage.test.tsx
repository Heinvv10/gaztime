import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import POSPage from '../pages/POSPage';
import { usePodStore } from '../store/usePodStore';
import { MOCK_OPERATOR, MOCK_PRODUCTS } from '../lib/mockData';

function renderWithRouter(component: React.ReactElement) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe('POSPage', () => {
  beforeEach(() => {
    usePodStore.setState({
      isAuthenticated: true,
      operator: MOCK_OPERATOR,
      cart: [],
      selectedCustomer: null,
      paymentMethod: null,
    });
  });

  it('renders POS page with operator info', () => {
    renderWithRouter(<POSPage />);
    expect(screen.getByText(/Nomsa Mabasa/i)).toBeInTheDocument();
  });

  it('displays all product quick-sell buttons', () => {
    renderWithRouter(<POSPage />);
    MOCK_PRODUCTS.forEach((product) => {
      expect(screen.getByTestId(`product-${product.id}`)).toBeInTheDocument();
    });
  });

  it('adds product to cart when clicked', () => {
    renderWithRouter(<POSPage />);
    const product = screen.getByTestId('product-p1');
    
    fireEvent.click(product);
    
    const { cart } = usePodStore.getState();
    expect(cart.length).toBeGreaterThan(0);
  });

  it('displays cart items', () => {
    usePodStore.setState({
      cart: [{ product: MOCK_PRODUCTS[0], quantity: 1 }],
    });
    
    renderWithRouter(<POSPage />);
    expect(screen.getByText(/9kg LPG Cylinder/i)).toBeInTheDocument();
  });

  it('allows selecting payment method', () => {
    usePodStore.setState({
      cart: [{ product: MOCK_PRODUCTS[0], quantity: 1 }],
    });
    
    renderWithRouter(<POSPage />);
    const cashButton = screen.getByTestId('payment-cash');
    
    fireEvent.click(cashButton);
    
    const { paymentMethod } = usePodStore.getState();
    expect(paymentMethod).toBe('cash');
  });

  it('disables checkout when no payment method selected', () => {
    usePodStore.setState({
      cart: [{ product: MOCK_PRODUCTS[0], quantity: 1 }],
      paymentMethod: null,
    });
    
    renderWithRouter(<POSPage />);
    const checkoutBtn = screen.getByTestId('checkout-btn');
    
    expect(checkoutBtn).toBeDisabled();
  });

  it('enables checkout when payment method selected', () => {
    usePodStore.setState({
      cart: [{ product: MOCK_PRODUCTS[0], quantity: 1 }],
      paymentMethod: 'cash',
    });
    
    renderWithRouter(<POSPage />);
    const checkoutBtn = screen.getByTestId('checkout-btn');
    
    expect(checkoutBtn).not.toBeDisabled();
  });

  it('allows customer search by phone', () => {
    renderWithRouter(<POSPage />);
    const phoneInput = screen.getByTestId('customer-phone-input');
    const searchBtn = screen.getByTestId('customer-search-btn');
    
    fireEvent.change(phoneInput, { target: { value: '0823456789' } });
    fireEvent.click(searchBtn);
    
    // Customer should be selected
    const { selectedCustomer } = usePodStore.getState();
    expect(selectedCustomer).toBeTruthy();
  });
});
