import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import { useStore } from '../store/useStore';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Screen', () => {
  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  it('should render login form', () => {
    renderLogin();
    
    expect(screen.getByText('Gaz Time Driver')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0765432109')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show error for invalid credentials', async () => {
    renderLogin();
    
    const phoneInput = screen.getByPlaceholderText('0765432109');
    const pinInput = screen.getByPlaceholderText('••••');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(phoneInput, { target: { value: '0000000000' } });
    fireEvent.change(pinInput, { target: { value: '0000' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid phone number or pin/i)).toBeInTheDocument();
    });
  });

  it('should navigate to dashboard on successful login', async () => {
    renderLogin();
    
    const phoneInput = screen.getByPlaceholderText('0765432109');
    const pinInput = screen.getByPlaceholderText('••••');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(phoneInput, { target: { value: '0765432109' } });
    fireEvent.change(pinInput, { target: { value: '1234' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('should have biometric login button', () => {
    renderLogin();
    
    const biometricButton = screen.getByRole('button', { name: /use biometric/i });
    expect(biometricButton).toBeInTheDocument();
  });
});
