import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';
import { mockOrders, mockDriver } from '../data/mockData';

describe('Driver Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { logout } = useStore.getState();
    logout();
  });

  it('should initialize with unauthenticated state', () => {
    const { isAuthenticated, driver } = useStore.getState();
    expect(isAuthenticated).toBe(false);
    expect(driver).toBeNull();
  });

  it('should login with correct credentials', async () => {
    const { login, isAuthenticated, driver } = useStore.getState();
    const success = await login('0765432109', '1234');
    
    expect(success).toBe(true);
    expect(useStore.getState().isAuthenticated).toBe(true);
    expect(useStore.getState().driver).toBeDefined();
    expect(useStore.getState().driver?.name).toBe('Thabo Mokoena');
  });

  it('should reject login with incorrect credentials', async () => {
    const { login } = useStore.getState();
    const success = await login('0000000000', '0000');
    
    expect(success).toBe(false);
    expect(useStore.getState().isAuthenticated).toBe(false);
  });

  it('should logout and clear state', async () => {
    const { login, logout } = useStore.getState();
    await login('0765432109', '1234');
    
    logout();
    
    expect(useStore.getState().isAuthenticated).toBe(false);
    expect(useStore.getState().driver).toBeNull();
    expect(useStore.getState().status).toBe('offline');
  });

  it('should toggle online status', () => {
    const { toggleOnline, isOnline } = useStore.getState();
    
    expect(isOnline).toBe(false);
    
    toggleOnline();
    expect(useStore.getState().isOnline).toBe(true);
    expect(useStore.getState().status).toBe('online');
    
    toggleOnline();
    expect(useStore.getState().isOnline).toBe(false);
    expect(useStore.getState().status).toBe('offline');
  });

  it('should accept order and update status', async () => {
    const { login, acceptOrder } = useStore.getState();
    await login('0765432109', '1234');
    
    const orderId = useStore.getState().orders[0]?.id;
    if (!orderId) throw new Error('No orders available');
    
    acceptOrder(orderId);
    
    const state = useStore.getState();
    expect(state.activeOrder?.id).toBe(orderId);
    expect(state.status).toBe('on_delivery');
  });

  it('should reject order and remove from queue', async () => {
    const { login, rejectOrder } = useStore.getState();
    await login('0765432109', '1234');
    
    const initialOrderCount = useStore.getState().orders.length;
    const orderId = useStore.getState().orders[0]?.id;
    if (!orderId) throw new Error('No orders available');
    
    rejectOrder(orderId);
    
    const state = useStore.getState();
    expect(state.orders.length).toBe(initialOrderCount - 1);
    expect(state.orders.find(o => o.id === orderId)).toBeUndefined();
  });

  it('should complete delivery and update status', async () => {
    const { login, acceptOrder, completeDelivery } = useStore.getState();
    await login('0765432109', '1234');
    
    const orderId = useStore.getState().orders[0]?.id;
    if (!orderId) throw new Error('No orders available');
    
    acceptOrder(orderId);
    const proof = { type: 'otp', data: '123456' };
    completeDelivery(orderId, proof);
    
    const state = useStore.getState();
    expect(state.activeOrder).toBeNull();
    expect(state.status).toBe('online');
  });

  it('should load vehicle stock', () => {
    const { loadStock, vehicleStock } = useStore.getState();
    
    const newStock = [
      { cylinderId: 'CYL-001', sizeKg: 9 },
      { cylinderId: 'CYL-002', sizeKg: 19 },
    ];
    
    loadStock(newStock);
    
    expect(useStore.getState().vehicleStock).toEqual(newStock);
  });

  it('should return empty cylinder', () => {
    const { loadStock, returnEmpty } = useStore.getState();
    
    loadStock([
      { cylinderId: 'CYL-001', sizeKg: 9 },
      { cylinderId: 'CYL-002', sizeKg: 19 },
    ]);
    
    returnEmpty('CYL-001');
    
    const state = useStore.getState();
    expect(state.vehicleStock.length).toBe(1);
    expect(state.vehicleStock[0].cylinderId).toBe('CYL-002');
  });

  it('should complete daily checklist', () => {
    const { completeDailyChecklist, dailyChecklistCompleted } = useStore.getState();
    
    expect(dailyChecklistCompleted).toBe(false);
    
    completeDailyChecklist();
    
    expect(useStore.getState().dailyChecklistCompleted).toBe(true);
  });
});
