import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute, AdminRoute } from '../../client/src/lib/protected-route';

// Mock the authentication hook
vi.mock('../../client/src/hooks/use-auth', () => {
  return {
    useAuth: vi.fn()
  };
});

// Mock the router hooks
vi.mock('wouter', () => {
  return {
    useLocation: vi.fn(() => ['/test']),
    Redirect: ({ to }: { to: string }) => <div data-testid="redirect" data-to={to}>Redirecting...</div>
  };
});

describe('Protected Routes', () => {
  let queryClient: QueryClient;
  const TestComponent = () => <div>Protected Content</div>;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    });
    
    vi.clearAllMocks();
  });
  
  describe('ProtectedRoute', () => {
    it('should render the component when user is authenticated', () => {
      // Mock authenticated user
      const { useAuth } = require('../../client/src/hooks/use-auth');
      useAuth.mockReturnValue({
        user: { id: 1, username: 'testuser' },
        isLoading: false
      });
      
      render(
        <QueryClientProvider client={queryClient}>
          <ProtectedRoute component={TestComponent} />
        </QueryClientProvider>
      );
      
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByTestId('redirect')).not.toBeInTheDocument();
    });
    
    it('should redirect to login when user is not authenticated', () => {
      // Mock unauthenticated user
      const { useAuth } = require('../../client/src/hooks/use-auth');
      useAuth.mockReturnValue({
        user: null,
        isLoading: false
      });
      
      render(
        <QueryClientProvider client={queryClient}>
          <ProtectedRoute component={TestComponent} />
        </QueryClientProvider>
      );
      
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByTestId('redirect')).toBeInTheDocument();
      expect(screen.getByTestId('redirect').getAttribute('data-to')).toBe('/login');
    });
    
    it('should not render anything while authentication is loading', () => {
      // Mock loading state
      const { useAuth } = require('../../client/src/hooks/use-auth');
      useAuth.mockReturnValue({
        user: null,
        isLoading: true
      });
      
      render(
        <QueryClientProvider client={queryClient}>
          <ProtectedRoute component={TestComponent} />
        </QueryClientProvider>
      );
      
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('redirect')).not.toBeInTheDocument();
    });
  });
  
  describe('AdminRoute', () => {
    it('should render the component when user is an admin', () => {
      // Mock admin user
      const { useAuth } = require('../../client/src/hooks/use-auth');
      useAuth.mockReturnValue({
        user: { id: 1, username: 'admin', isAdmin: true },
        isLoading: false
      });
      
      render(
        <QueryClientProvider client={queryClient}>
          <AdminRoute component={TestComponent} />
        </QueryClientProvider>
      );
      
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByTestId('redirect')).not.toBeInTheDocument();
    });
    
    it('should redirect to home when user is not an admin', () => {
      // Mock non-admin user
      const { useAuth } = require('../../client/src/hooks/use-auth');
      useAuth.mockReturnValue({
        user: { id: 2, username: 'user', isAdmin: false },
        isLoading: false
      });
      
      render(
        <QueryClientProvider client={queryClient}>
          <AdminRoute component={TestComponent} />
        </QueryClientProvider>
      );
      
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByTestId('redirect')).toBeInTheDocument();
      expect(screen.getByTestId('redirect').getAttribute('data-to')).toBe('/');
    });
    
    it('should redirect to login when no user is authenticated', () => {
      // Mock unauthenticated user
      const { useAuth } = require('../../client/src/hooks/use-auth');
      useAuth.mockReturnValue({
        user: null,
        isLoading: false
      });
      
      render(
        <QueryClientProvider client={queryClient}>
          <AdminRoute component={TestComponent} />
        </QueryClientProvider>
      );
      
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByTestId('redirect')).toBeInTheDocument();
      expect(screen.getByTestId('redirect').getAttribute('data-to')).toBe('/login');
    });
  });
});