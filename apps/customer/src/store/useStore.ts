import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Order, Product } from '@/types';
import { api } from '@gaztime/shared';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  user: User | null;
  authToken: string | null;
  
  // Onboarding
  hasSeenOnboarding: boolean;
  
  // Cart
  cart: {
    productId: string;
    quantity: number;
  }[];
  selectedAddress: string | null;
  selectedPaymentMethod: string | null;
  
  // Data
  products: Product[];
  orders: Order[];
  
  // UI State
  isOnline: boolean;
  isLoading: boolean;
  
  // Actions
  setAuthenticated: (isAuth: boolean, user?: User | null, token?: string | null) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  updateUser: (user: Partial<User>) => void;
  addToCart: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setSelectedAddress: (addressId: string | null) => void;
  setSelectedPaymentMethod: (method: string | null) => void;
  setProducts: (products: Product[]) => void;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  setOnline: (online: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  
  // API actions
  login: (phone: string) => Promise<boolean>;
  register: (phone: string, name: string, address: any) => Promise<boolean>;
  loadProducts: () => Promise<void>;
  loadOrders: () => Promise<void>;
  placeOrder: (items: any[], address: any, paymentMethod: string) => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      authToken: null,
      hasSeenOnboarding: false,
      cart: [],
      selectedAddress: null,
      selectedPaymentMethod: null,
      products: [],
      orders: [],
      isOnline: navigator.onLine,
      isLoading: false,
      
      // Actions
      setAuthenticated: (isAuth, user = null, token = null) =>
        set({ isAuthenticated: isAuth, user, authToken: token }),
      
      setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),
      
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      
      addToCart: (productId, quantity) =>
        set((state) => {
          const existing = state.cart.find((item) => item.productId === productId);
          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.productId === productId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { cart: [...state.cart, { productId, quantity }] };
        }),
      
      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.productId !== productId),
        })),
      
      clearCart: () => set({ cart: [], selectedAddress: null, selectedPaymentMethod: null }),
      
      setSelectedAddress: (addressId) => set({ selectedAddress: addressId }),
      
      setSelectedPaymentMethod: (method) => set({ selectedPaymentMethod: method }),
      
      setProducts: (products) => set({ products }),
      
      setOrders: (orders) => set({ orders }),
      
      addOrder: (order) =>
        set((state) => ({ orders: [order, ...state.orders] })),
      
      updateOrder: (orderId, updates) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, ...updates } : order
          ),
        })),
      
      setOnline: (online) => set({ isOnline: online }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
          authToken: null,
          cart: [],
          orders: [],
        }),
      
      // API actions
      login: async (phone: string) => {
        try {
          set({ isLoading: true });
          const customer = await api.customers.getByPhone(phone);
          
          // Map API customer to local User type
          const user: User = {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: (customer as any).email || '',
            addresses: customer.addresses || [],
            walletBalance: customer.walletBalance || 0,
            language: ((customer as any).languagePreference || 'en') as any,
            referralCode: customer.referralCode,
            createdAt: customer.createdAt,
          };
          
          set({ 
            isAuthenticated: true, 
            user,
            authToken: `token-${customer.id}`,
            selectedAddress: user.addresses[0]?.id || null,
          });
          
          // Load products and orders
          await Promise.all([
            (set as any).getState().loadProducts(),
            (set as any).getState().loadOrders(),
          ]);
          
          set({ isLoading: false });
          return true;
        } catch (error) {
          console.error('Login failed:', error);
          set({ isLoading: false });
          return false;
        }
      },
      
      register: async (phone: string, name: string, address: any) => {
        try {
          set({ isLoading: true });
          const result = await api.customers.create({
            phone,
            name,
            addresses: [address],
          });
          
          // The API might return {customer: {...}, otp_sent: true}
          const customer = (result as any).customer || result;
          
          // Map to local User type
          const user: User = {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: (customer as any).email || '',
            addresses: customer.addresses || [],
            walletBalance: customer.walletBalance || 0,
            language: ((customer as any).languagePreference || 'en') as any,
            referralCode: customer.referralCode,
            createdAt: customer.createdAt,
          };
          
          set({ 
            isAuthenticated: true, 
            user,
            authToken: `token-${customer.id}`,
            selectedAddress: user.addresses[0]?.id || null,
          });
          
          // Load products
          await (set as any).getState().loadProducts();
          
          set({ isLoading: false });
          return true;
        } catch (error) {
          console.error('Register failed:', error);
          set({ isLoading: false });
          return false;
        }
      },
      
      loadProducts: async () => {
        try {
          const products = await api.products.list();
          
          // Map to local Product type
          const mappedProducts: Product[] = products.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: p.price, // Already extracted from prices array by API client
            sizeKg: p.sizeKg || p.size_kg,
            type: (p.category === 'cylinder' ? 'cylinder_full' : 'refill') as any,
            imageUrl: p.imageUrl || '',
            inStock: true,
          }));
          
          set({ products: mappedProducts });
        } catch (error) {
          console.error('Failed to load products:', error);
        }
      },
      
      loadOrders: async () => {
        const { user } = (set as any).getState();
        if (!user) return;
        
        try {
          const orders = await api.orders.list({ customerId: user.id });
          
          // Map to local Order type
          const mappedOrders: Order[] = orders.map((o: any) => ({
            id: o.id,
            reference: o.reference,
            status: o.status,
            items: o.items.map((item: any) => ({
              productId: item.productId,
              productName: item.product?.name || 'Unknown',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.unitPrice * item.quantity,
            })),
            totalAmount: o.totalAmount,
            deliveryAddress: o.deliveryAddress,
            deliveryFee: o.deliveryFee || 0,
            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            createdAt: o.createdAt,
            deliveredAt: o.deliveredAt,
            estimatedDeliveryTime: o.estimatedDeliveryAt,
          }));
          
          set({ orders: mappedOrders });
        } catch (error) {
          console.error('Failed to load orders:', error);
        }
      },
      
      placeOrder: async (items: any[], address: any, paymentMethod: string) => {
        const { user, addOrder } = (set as any).getState();
        if (!user) throw new Error('User not authenticated');
        
        try {
          set({ isLoading: true });
          
          const order = await api.orders.create({
            customerId: user.id,
            channel: 'app',
            items: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice || item.price,
            })),
            deliveryAddressId: address.id,
            deliveryAddress: address,
            paymentMethod: paymentMethod as any,
          });
          
          // Map to local Order type
          const mappedOrder: any = {
            id: order.id,
            reference: order.reference,
            status: order.status,
            items: order.items.map((item: any) => ({
              productId: item.productId,
              productName: item.product?.name || 'Unknown',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.unitPrice * item.quantity,
            })),
            totalAmount: order.totalAmount,
            deliveryAddress: order.deliveryAddress,
            deliveryFee: order.deliveryFee || 0,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt,
            deliveredAt: (order as any).deliveredAt,
            estimatedDeliveryTime: (order as any).estimatedDeliveryAt,
          };
          
          addOrder(mappedOrder);
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to place order:', error);
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'gaztime-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        authToken: state.authToken,
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
    }
  )
);

// Setup online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useStore.getState().setOnline(true));
  window.addEventListener('offline', () => useStore.getState().setOnline(false));
}
