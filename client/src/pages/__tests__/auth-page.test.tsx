
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthPage from '../auth-page';
import { useAuth } from '@/hooks/use-auth';

// Mock the useAuth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: null,
    loginMutation: { mutate: vi.fn(), isPending: false },
    registerMutation: { mutate: vi.fn(), isPending: false }
  })
}));

// Mock the useLocation hook
vi.mock('wouter', () => ({
  useLocation: () => ['/auth', vi.fn()]
}));

describe('AuthPage Register Form', () => {
  it('allows users to enter data in all register form fields', async () => {
    render(<AuthPage />);
    
    // Click the register tab
    const registerTab = screen.getByRole('tab', { name: /register/i });
    fireEvent.click(registerTab);

    // Get form fields
    const usernameInput = screen.getByPlaceholderText('Choose a username');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const confirmPasswordInput = screen.getAllByPlaceholderText('••••••••')[1];
    const termsCheckbox = screen.getByRole('checkbox');

    // Test username input
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    expect(usernameInput).toHaveValue('testuser');

    // Test password input
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput).toHaveValue('password123');

    // Test confirm password input
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    expect(confirmPasswordInput).toHaveValue('password123');

    // Test terms checkbox
    fireEvent.click(termsCheckbox);
    expect(termsCheckbox).toBeChecked();
  });
});
