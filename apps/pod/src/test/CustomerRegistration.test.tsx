import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CustomerRegistrationPage from '../pages/CustomerRegistrationPage';
import { usePodStore } from '../store/usePodStore';

function renderWithRouter(component: React.ReactElement) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe('CustomerRegistrationPage', () => {
  beforeEach(() => {
    usePodStore.setState({
      isAuthenticated: true,
      customers: [],
    });
  });

  it('renders registration form', () => {
    renderWithRouter(<CustomerRegistrationPage />);
    expect(screen.getByText('Register New Customer')).toBeInTheDocument();
    expect(screen.getByTestId('name-input')).toBeInTheDocument();
    expect(screen.getByTestId('phone-input')).toBeInTheDocument();
    expect(screen.getByTestId('address-input')).toBeInTheDocument();
  });

  it('disables submit when form is incomplete', () => {
    renderWithRouter(<CustomerRegistrationPage />);
    const submitBtn = screen.getByTestId('register-submit');
    
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit when all required fields filled', () => {
    renderWithRouter(<CustomerRegistrationPage />);
    
    fireEvent.change(screen.getByTestId('name-input'), {
      target: { value: 'Test Customer' },
    });
    fireEvent.change(screen.getByTestId('phone-input'), {
      target: { value: '0123456789' },
    });
    fireEvent.change(screen.getByTestId('address-input'), {
      target: { value: 'Test Address' },
    });
    
    const submitBtn = screen.getByTestId('register-submit');
    expect(submitBtn).not.toBeDisabled();
  });
});
