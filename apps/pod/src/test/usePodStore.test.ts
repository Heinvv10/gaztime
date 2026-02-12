import { describe, it, expect, beforeEach } from 'vitest';
import { usePodStore } from '../store/usePodStore';
import { MOCK_PRODUCTS } from '../lib/mockData';

describe('usePodStore', () => {
  beforeEach(() => {
    usePodStore.setState({
      isAuthenticated: false,
      operator: null,
      cart: [],
      selectedCustomer: null,
      paymentMethod: null,
    });
  });

  it('authenticates with correct PIN', () => {
    const { login } = usePodStore.getState();
    const result = login('1234');
    
    expect(result).toBe(true);
    expect(usePodStore.getState().isAuthenticated).toBe(true);
    expect(usePodStore.getState().operator?.name).toBe('Nomsa Mabasa');
  });

  it('rejects incorrect PIN', () => {
    const { login } = usePodStore.getState();
    const result = login('9999');
    
    expect(result).toBe(false);
    expect(usePodStore.getState().isAuthenticated).toBe(false);
  });

  it('adds product to cart', () => {
    const { addToCart } = usePodStore.getState();
    addToCart(MOCK_PRODUCTS[0]);
    
    const { cart } = usePodStore.getState();
    expect(cart.length).toBe(1);
    expect(cart[0].product.id).toBe(MOCK_PRODUCTS[0].id);
    expect(cart[0].quantity).toBe(1);
  });

  it('increments quantity for existing cart item', () => {
    const { addToCart } = usePodStore.getState();
    addToCart(MOCK_PRODUCTS[0]);
    addToCart(MOCK_PRODUCTS[0]);
    
    const { cart } = usePodStore.getState();
    expect(cart.length).toBe(1);
    expect(cart[0].quantity).toBe(2);
  });

  it('removes product from cart', () => {
    const { addToCart, removeFromCart } = usePodStore.getState();
    addToCart(MOCK_PRODUCTS[0]);
    removeFromCart(MOCK_PRODUCTS[0].id);
    
    const { cart } = usePodStore.getState();
    expect(cart.length).toBe(0);
  });

  it('completes sale and creates order', () => {
    const { addToCart, setPaymentMethod, completeSale } = usePodStore.getState();
    
    addToCart(MOCK_PRODUCTS[0], 2);
    setPaymentMethod('cash');
    const order = completeSale();
    
    expect(order).toBeTruthy();
    expect(order.items.length).toBe(1);
    expect(order.totalAmount).toBe(MOCK_PRODUCTS[0].price * 2);
    expect(order.paymentMethod).toBe('cash');
    
    // Cart should be cleared
    const { cart } = usePodStore.getState();
    expect(cart.length).toBe(0);
  });

  it('updates stock after sale', () => {
    const { addToCart, setPaymentMethod, completeSale, stock } = usePodStore.getState();
    const initialStock = stock.find(s => s.productId === MOCK_PRODUCTS[0].id)?.quantity || 0;
    
    addToCart(MOCK_PRODUCTS[0], 2);
    setPaymentMethod('cash');
    completeSale();
    
    const newStock = usePodStore.getState().stock.find(s => s.productId === MOCK_PRODUCTS[0].id)?.quantity || 0;
    expect(newStock).toBe(initialStock - 2);
  });

  it('finds customer by phone', () => {
    const { findCustomerByPhone } = usePodStore.getState();
    const customer = findCustomerByPhone('0823456789');
    
    expect(customer).toBeTruthy();
    expect(customer?.name).toBe('Thabo Malema');
  });

  it('adds new customer', () => {
    const { addCustomer, customers } = usePodStore.getState();
    const initialCount = customers.length;
    
    addCustomer({
      phone: '0999999999',
      name: 'Test Customer',
      addresses: [
        {
          id: 'test',
          label: 'Home',
          text: 'Test Address',
          isDefault: true,
        },
      ],
      walletBalance: 0,
      segment: 'new',
      languagePreference: 'en',
      status: 'active',
    });
    
    const { customers: updatedCustomers } = usePodStore.getState();
    expect(updatedCustomers.length).toBe(initialCount + 1);
  });
});
