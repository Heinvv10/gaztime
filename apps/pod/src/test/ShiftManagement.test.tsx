import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ShiftManagementPage from '../pages/ShiftManagementPage';
import { usePodStore } from '../store/usePodStore';
import { MOCK_OPERATOR } from '../lib/mockData';

function renderWithRouter(component: React.ReactElement) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe('ShiftManagementPage', () => {
  beforeEach(() => {
    usePodStore.setState({
      isAuthenticated: true,
      operator: MOCK_OPERATOR,
      shiftStartTime: null,
    });
  });

  it('renders shift management page', () => {
    renderWithRouter(<ShiftManagementPage />);
    expect(screen.getByText('Shift Management')).toBeInTheDocument();
  });

  it('shows clock in button when shift not active', () => {
    renderWithRouter(<ShiftManagementPage />);
    expect(screen.getByTestId('clock-in-btn')).toBeInTheDocument();
  });

  it('starts shift when clock in clicked', () => {
    renderWithRouter(<ShiftManagementPage />);
    const clockInBtn = screen.getByTestId('clock-in-btn');
    
    fireEvent.click(clockInBtn);
    
    const { shiftStartTime } = usePodStore.getState();
    expect(shiftStartTime).toBeTruthy();
  });

  it('shows handover checklist during active shift', () => {
    usePodStore.setState({
      shiftStartTime: new Date().toISOString(),
    });
    
    renderWithRouter(<ShiftManagementPage />);
    expect(screen.getByText(/handover checklist/i)).toBeInTheDocument();
  });

  it('requires checklist completion before clock out', () => {
    usePodStore.setState({
      shiftStartTime: new Date().toISOString(),
    });
    
    renderWithRouter(<ShiftManagementPage />);
    const clockOutBtn = screen.getByTestId('clock-out-btn');
    
    expect(clockOutBtn).toBeDisabled();
  });
});
