import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { useStore } from '../store/useStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Dashboard Screen', () => {
  beforeEach(async () => {
    const { login } = useStore.getState();
    await login('0765432109', '1234');
  });

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  };

  it('should display driver name', () => {
    renderDashboard();
    expect(screen.getByText('Thabo Mokoena')).toBeInTheDocument();
  });

  it('should display today stats', () => {
    renderDashboard();
    
    const state = useStore.getState();
    expect(screen.getByText(state.driver?.todayDeliveries.toString() || '0')).toBeInTheDocument();
    expect(screen.getByText(`R${state.driver?.todayEarnings || 0}`)).toBeInTheDocument();
  });

  it('should toggle online/offline status', () => {
    renderDashboard();
    
    const toggleButton = screen.getByText(/you're offline/i).closest('button');
    expect(toggleButton).toBeInTheDocument();
    
    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(useStore.getState().isOnline).toBe(true);
    }
  });

  it('should display delivery queue', () => {
    renderDashboard();
    
    const orders = useStore.getState().orders;
    const assignedOrders = orders.filter(o => o.status === 'assigned' || o.status === 'confirmed');
    
    expect(screen.getByText(`${assignedOrders.length} pending`)).toBeInTheDocument();
  });

  it('should navigate to order details when order is clicked', () => {
    renderDashboard();
    
    const orders = useStore.getState().orders;
    const firstOrder = orders[0];
    
    if (firstOrder) {
      const orderCard = screen.getByText(firstOrder.reference).closest('div');
      if (orderCard?.parentElement) {
        fireEvent.click(orderCard.parentElement);
        expect(mockNavigate).toHaveBeenCalledWith(`/order/${firstOrder.id}`);
      }
    }
  });
});
