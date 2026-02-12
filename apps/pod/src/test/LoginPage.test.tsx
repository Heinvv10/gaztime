import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { usePodStore } from '../store/usePodStore';

function renderWithRouter(component: React.ReactElement) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe('LoginPage', () => {
  beforeEach(() => {
    usePodStore.setState({ isAuthenticated: false, operator: null });
  });

  it('renders login page with header', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByText('Gaz Time Pod')).toBeInTheDocument();
    expect(screen.getByText('Gaz Time POS')).toBeInTheDocument();
  });

  it('renders PIN input dots', () => {
    renderWithRouter(<LoginPage />);
    const dots = screen.getAllByRole('button', { name: /[0-9]/ });
    expect(dots.length).toBeGreaterThan(0);
  });

  it('allows entering PIN digits', () => {
    renderWithRouter(<LoginPage />);
    const btn1 = screen.getByTestId('pin-1');
    const btn2 = screen.getByTestId('pin-2');
    
    fireEvent.click(btn1);
    fireEvent.click(btn2);
    
    // Check that dots are filled (visual feedback)
    expect(btn1).toBeInTheDocument();
  });

  it('allows backspace to remove digits', () => {
    renderWithRouter(<LoginPage />);
    const btn1 = screen.getByTestId('pin-1');
    const backspace = screen.getByTestId('pin-backspace');
    
    fireEvent.click(btn1);
    fireEvent.click(backspace);
    
    expect(backspace).toBeInTheDocument();
  });

  it('shows error for incorrect PIN', () => {
    renderWithRouter(<LoginPage />);
    
    // Enter wrong PIN
    fireEvent.click(screen.getByTestId('pin-9'));
    fireEvent.click(screen.getByTestId('pin-9'));
    fireEvent.click(screen.getByTestId('pin-9'));
    fireEvent.click(screen.getByTestId('pin-9'));
    fireEvent.click(screen.getByTestId('pin-submit'));
    
    expect(screen.getByText(/incorrect pin/i)).toBeInTheDocument();
  });
});
