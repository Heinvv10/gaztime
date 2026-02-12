import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('should render without crashing', () => {
    render(<App />);
    // Should redirect to login when not authenticated
    expect(screen.getByText('Gaz Time Driver')).toBeInTheDocument();
  });

  it('should show login screen when not authenticated', () => {
    render(<App />);
    expect(screen.getByText('Sign in to start your shift')).toBeInTheDocument();
  });
});
