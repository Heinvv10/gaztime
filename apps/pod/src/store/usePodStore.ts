import { create } from 'zustand';
import type { Product, Customer, Order, PodStock, PaymentMethod } from '@gaztime/shared';
import { api } from '@gaztime/shared';
import { MOCK_OPERATOR, MOCK_POD } from '../lib/mockData';

interface CartItem {
  product: Product;
  quantity: number;
}

interface PodState {
  // Auth
  isAuthenticated: boolean;
  operator: typeof MOCK_OPERATOR | null;
  
  // Pod info
  pod: typeof MOCK_POD;
  
  // Products & Stock
  products: Product[];
  stock: PodStock[];
  
  // Customers
  customers: Customer[];
  selectedCustomer: Customer | null;
  
  // Orders
  orders: Order[];
  
  // Cart
  cart: CartItem[];
  paymentMethod: PaymentMethod | null;
  
  // Shift
  shiftStartTime: string | null;
  
  // Actions
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  
  // Cart actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  
  // Customer actions
  selectCustomer: (customer: Customer | null) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'referralCode'>) => Promise<void>;
  findCustomerByPhone: (phone: string) => Promise<Customer | undefined>;
  
  // Order actions
  completeSale: () => Promise<Order>;
  
  // Stock actions
  updateStock: (productId: string, quantity: number) => void;
  receiveStock: (productId: string, quantity: number) => void;
  
  // Shift actions
  startShift: () => void;
  endShift: () => void;
}

export const usePodStore = create<PodState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  operator: null,
  pod: MOCK_POD,
  products: [],
  stock: [],
  customers: [],
  selectedCustomer: null,
  orders: [],
  cart: [],
  paymentMethod: null,
  shiftStartTime: null,
  
  // Auth
  login: async (pin: string) => {
    if (pin === MOCK_OPERATOR.pin) {
      set({ isAuthenticated: true, operator: MOCK_OPERATOR });
      
      // Load real data from API after login
      try {
        const [products, customers, orders] = await Promise.all([
          api.products.list(),
          api.customers.list(),
          api.orders.list(),
        ]);
        
        // Map products to local type
        const mappedProducts: Product[] = products.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          sku: p.sku || p.id,
          price: p.price,
          sizeKg: p.sizeKg || p.size_kg,
          type: (p.type || 'gas') as any,
          icon: p.imageUrl || '',
          active: p.active !== false,
        }));
        
        set({ 
          products: mappedProducts,
          customers: customers as Customer[],
          orders: orders as Order[],
        });
        
        // Load stock levels for this pod
        try {
          const stockLevels = await api.inventory.getStockLevels(MOCK_POD.id);
          const mappedStock: PodStock[] = stockLevels.map((sl: any) => ({
            productId: sl.productId,
            quantity: sl.quantity,
            lastRestocked: sl.updatedAt,
          }));
          set({ stock: mappedStock });
        } catch (e) {
          console.warn('Could not load stock levels:', e);
        }
      } catch (error) {
        console.error('Failed to load data after login:', error);
      }
      
      return true;
    }
    return false;
  },
  
  logout: () => {
    set({ 
      isAuthenticated: false, 
      operator: null, 
      cart: [], 
      selectedCustomer: null,
      paymentMethod: null,
    });
  },
  
  // Cart
  addToCart: (product: Product, quantity = 1) => {
    const { cart } = get();
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      set({
        cart: cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
      });
    } else {
      set({ cart: [...cart, { product, quantity }] });
    }
  },
  
  removeFromCart: (productId: string) => {
    set({ cart: get().cart.filter(item => item.product.id !== productId) });
  },
  
  clearCart: () => {
    set({ cart: [], selectedCustomer: null, paymentMethod: null });
  },
  
  setPaymentMethod: (method: PaymentMethod) => {
    set({ paymentMethod: method });
  },
  
  // Customers
  selectCustomer: (customer: Customer | null) => {
    set({ selectedCustomer: customer });
  },
  
  addCustomer: async (customerData) => {
    try {
      const newCustomer = await api.customers.create({
        phone: customerData.phone,
        name: customerData.name,
        addresses: customerData.addresses || [],
      });
      set({ customers: [...get().customers, newCustomer as Customer] });
    } catch (error) {
      console.error('Failed to add customer:', error);
      throw error;
    }
  },
  
  findCustomerByPhone: async (phone: string) => {
    try {
      const customer = await api.customers.getByPhone(phone);
      return customer as Customer;
    } catch (error) {
      // Not found, try local list
      return get().customers.find(c => c.phone === phone);
    }
  },
  
  // Orders
  completeSale: async () => {
    const { cart, paymentMethod, selectedCustomer, pod } = get();
    
    if (cart.length === 0 || !paymentMethod) {
      throw new Error('Cart is empty or payment method not selected');
    }
    
    try {
      const orderItems = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price,
      }));
      
      // Default address for walk-in customers
      const defaultAddress = {
        id: 'walk-in',
        label: 'Walk-in',
        text: pod.name,
        isDefault: true,
      };
      
      const orderData = {
        customerId: selectedCustomer?.id || 'walk-in',
        channel: 'pod' as any,
        items: orderItems,
        deliveryAddressId: selectedCustomer?.addresses?.[0]?.id || 'walk-in',
        deliveryAddress: selectedCustomer?.addresses?.[0] || defaultAddress,
        deliveryFee: 0,
        paymentMethod: paymentMethod,
      };
      
      const newOrder = await api.orders.create(orderData);
      
      // Update local orders list
      set({ 
        orders: [...get().orders, newOrder as Order],
        cart: [],
        selectedCustomer: null,
        paymentMethod: null,
      });
      
      // Update stock
      cart.forEach(item => {
        get().updateStock(item.product.id, -item.quantity);
      });
      
      return newOrder as Order;
    } catch (error) {
      console.error('Failed to complete sale:', error);
      throw error;
    }
  },
  
  // Stock
  updateStock: (productId: string, quantityChange: number) => {
    set({
      stock: get().stock.map(item =>
        item.productId === productId
          ? { ...item, quantity: Math.max(0, item.quantity + quantityChange) }
          : item
      ),
    });
  },
  
  receiveStock: (productId: string, quantity: number) => {
    get().updateStock(productId, quantity);
  },
  
  // Shift
  startShift: () => {
    set({ shiftStartTime: new Date().toISOString() });
  },
  
  endShift: () => {
    set({ shiftStartTime: null });
  },
}));
