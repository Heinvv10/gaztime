import { create } from 'zustand';
import type { Driver, Order, DriverStatus, VehicleStock } from '@shared/types';
import { mockDriver, mockVehicleStock } from '../data/mockData';
import { api } from '@gaztime/shared';

interface DriverStore {
  // Auth
  isAuthenticated: boolean;
  driver: Driver | null;
  login: (phone: string, pin: string) => Promise<boolean>;
  logout: () => void;

  // Driver status
  status: DriverStatus;
  setStatus: (status: DriverStatus) => Promise<void>;

  // Orders
  orders: Order[];
  activeOrder: Order | null;
  loadOrders: () => Promise<void>;
  acceptOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string) => Promise<void>;
  startDelivery: (orderId: string) => Promise<void>;
  completeDelivery: (orderId: string, proof: any) => Promise<void>;

  // Location
  updateLocation: (lat: number, lng: number) => Promise<void>;

  // Stock
  vehicleStock: VehicleStock[];
  loadStock: (cylinders: VehicleStock[]) => void;
  returnEmpty: (cylinderId: string) => void;

  // Safety
  dailyChecklistCompleted: boolean;
  completeDailyChecklist: () => void;

  // Sync status
  isOnline: boolean;
  lastSync: Date | null;
  toggleOnline: () => Promise<void>;
}

export const useStore = create<DriverStore>((set, get) => ({
  // Auth
  isAuthenticated: false,
  driver: null,
  
  login: async (phone: string, pin: string) => {
    try {
      // Validate PIN (in production, this would be server-side)
      if (pin !== '1234') return false;
      
      // Try to find driver by phone via API
      try {
        const driver = await api.drivers.getByPhone(phone);
        set({ 
          isAuthenticated: true, 
          driver,
          vehicleStock: mockVehicleStock,
        });
        await get().loadOrders();
        return true;
      } catch (error) {
        // Fallback: try finding in drivers list
        try {
          const allDrivers = await api.drivers.list();
          const found = allDrivers.find((d: any) => 
            d.phone?.replace(/\D/g, '') === phone.replace(/\D/g, '') ||
            d.phone?.endsWith(phone.replace(/^0/, '')) ||
            phone.endsWith(d.phone?.replace(/^\+27/, '') || '')
          );
          if (found) {
            set({ 
              isAuthenticated: true, 
              driver: found,
              vehicleStock: mockVehicleStock,
            });
            await get().loadOrders();
            return true;
          }
        } catch (e) {
          // All API attempts failed
        }
        
        // Final fallback for demo
        if (phone === '0765432109') {
          set({ 
            isAuthenticated: true, 
            driver: { ...mockDriver, phone },
            vehicleStock: mockVehicleStock,
          });
          await get().loadOrders();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  },

  logout: () => {
    set({ 
      isAuthenticated: false, 
      driver: null,
      status: 'offline',
      orders: [],
      activeOrder: null,
    });
  },

  // Driver status
  status: 'offline',
  setStatus: async (status) => {
    const { driver } = get();
    if (driver) {
      try {
        await api.drivers.updateStatus(driver.id, status);
        set({ status });
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    } else {
      set({ status });
    }
  },

  // Orders
  orders: [],
  activeOrder: null,

  loadOrders: async () => {
    const { driver } = get();
    if (!driver) return;

    try {
      // Load orders assigned to this driver
      const allOrders = await api.orders.list({ driverId: driver.id });
      const assignedOrders = allOrders.filter(
        o => ['assigned', 'in_transit'].includes(o.status)
      );
      set({ orders: assignedOrders });
      
      // Set active order if in transit
      const inTransit = assignedOrders.find(o => o.status === 'in_transit');
      if (inTransit) {
        set({ activeOrder: inTransit, status: 'on_delivery' });
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  },

  acceptOrder: async (orderId) => {
    const { driver, orders } = get();
    if (!driver) return;

    try {
      const updatedOrder = await api.orders.updateStatus(orderId, 'in_transit');
      
      set({ 
        activeOrder: updatedOrder,
        status: 'on_delivery',
        orders: orders.map(o => o.id === orderId ? updatedOrder : o),
      });
    } catch (error) {
      console.error('Failed to accept order:', error);
    }
  },

  rejectOrder: async (orderId) => {
    const { orders } = get();
    try {
      // In a real app, you'd call an API to unassign the driver
      // For now, just remove from local state
      set({ orders: orders.filter(o => o.id !== orderId) });
    } catch (error) {
      console.error('Failed to reject order:', error);
    }
  },

  startDelivery: async (orderId) => {
    const { orders } = get();
    try {
      const updatedOrder = await api.orders.updateStatus(orderId, 'in_transit');
      
      set({ 
        activeOrder: updatedOrder,
        status: 'on_delivery',
        orders: orders.map(o => o.id === orderId ? updatedOrder : o),
      });
    } catch (error) {
      console.error('Failed to start delivery:', error);
    }
  },

  completeDelivery: async (orderId, proof) => {
    const { driver, orders } = get();
    if (!driver) return;

    try {
      await api.drivers.completeDelivery(driver.id, orderId, proof);
      
      // Reload orders to get updated list
      await get().loadOrders();
      
      set({ 
        activeOrder: null,
        status: 'online',
      });
    } catch (error) {
      console.error('Failed to complete delivery:', error);
    }
  },

  // Location
  updateLocation: async (lat: number, lng: number) => {
    const { driver } = get();
    if (!driver) return;

    try {
      await api.drivers.updateLocation(driver.id, { lat, lng });
      set({
        driver: {
          ...driver,
          currentLocation: { lat, lng },
          locationUpdatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  },

  // Stock
  vehicleStock: [],

  loadStock: (cylinders) => {
    set({ vehicleStock: cylinders });
  },

  returnEmpty: (cylinderId) => {
    const { vehicleStock } = get();
    set({ 
      vehicleStock: vehicleStock.filter(s => s.cylinderId !== cylinderId),
    });
  },

  // Safety
  dailyChecklistCompleted: false,
  completeDailyChecklist: () => set({ dailyChecklistCompleted: true }),

  // Sync status
  isOnline: false,
  lastSync: null,
  toggleOnline: async () => {
    const { isOnline, setStatus } = get();
    const newStatus = !isOnline ? 'online' : 'offline';
    
    await setStatus(newStatus);
    
    set({ 
      isOnline: !isOnline,
      lastSync: new Date(),
    });

    // Load orders when going online
    if (!isOnline) {
      await get().loadOrders();
    }
  },
}));
