import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import { useAuth, AuthProvider } from '../../client/src/hooks/use-auth';

// Mock the queryClient module
vi.mock('../../client/src/lib/queryClient', () => {
  return {
    apiRequest: vi.fn(),
    queryClient: {
      setQueryData: vi.fn(),
      invalidateQueries: vi.fn()
    }
  };
});

// Mock the analytics module
vi.mock('../../client/src/lib/analytics', () => {
  return {
    trackEvent: vi.fn(),
    identifyUser: vi.fn(),
    resetIdentity: vi.fn(),
    AnalyticsEvent: {
      USER_LOGIN: 'user_login',
      USER_REGISTER: 'user_register',
      USER_LOGOUT: 'user_logout'
    }
  };
});

// Mock the toast functions
vi.mock('../../client/src/hooks/use-toast', () => {
  return {
    useToast: () => ({
      toast: vi.fn()
    })
  };
});

describe('useAuth Hook', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: PropsWithChildren) => JSX.Element;
  
  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
    
    vi.clearAllMocks();
  });
  
  it('should provide authentication context', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Check that all expected properties are present
    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('loginMutation');
    expect(result.current).toHaveProperty('logoutMutation');
    expect(result.current).toHaveProperty('registerMutation');
  });
  
  it('should handle login correctly', async () => {
    // Mock successful API response
    const mockUser = { id: 1, username: 'testuser', isAdmin: false };
    const { apiRequest } = require('../../client/src/lib/queryClient');
    apiRequest.mockResolvedValueOnce({
      json: () => Promise.resolve(mockUser)
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Attempt login
    act(() => {
      result.current.loginMutation.mutate({ username: 'testuser', password: 'password123' });
    });
    
    // Wait for mutation to complete
    await vi.waitFor(() => {
      expect(result.current.loginMutation.isPending).toBe(false);
    });
    
    // Check that API was called correctly
    expect(apiRequest).toHaveBeenCalledWith('POST', '/api/login', {
      username: 'testuser',
      password: 'password123'
    });
    
    // Check that user data was set
    const { queryClient } = require('../../client/src/lib/queryClient');
    expect(queryClient.setQueryData).toHaveBeenCalledWith(['/api/user'], mockUser);
    
    // Check analytics event was tracked
    const { trackEvent, identifyUser } = require('../../client/src/lib/analytics');
    expect(trackEvent).toHaveBeenCalled();
    expect(identifyUser).toHaveBeenCalledWith(1);
  });
  
  it('should handle logout correctly', async () => {
    // Mock successful API response
    const { apiRequest } = require('../../client/src/lib/queryClient');
    apiRequest.mockResolvedValueOnce({});
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Attempt logout
    act(() => {
      result.current.logoutMutation.mutate();
    });
    
    // Wait for mutation to complete
    await vi.waitFor(() => {
      expect(result.current.logoutMutation.isPending).toBe(false);
    });
    
    // Check that API was called correctly
    expect(apiRequest).toHaveBeenCalledWith('POST', '/api/logout');
    
    // Check that user data was cleared
    const { queryClient } = require('../../client/src/lib/queryClient');
    expect(queryClient.setQueryData).toHaveBeenCalledWith(['/api/user'], null);
    
    // Check analytics event was tracked
    const { trackEvent, resetIdentity } = require('../../client/src/lib/analytics');
    expect(trackEvent).toHaveBeenCalled();
    expect(resetIdentity).toHaveBeenCalled();
  });
  
  it('should handle registration correctly', async () => {
    // Mock successful API response
    const mockUser = { id: 2, username: 'newuser', isAdmin: false };
    const { apiRequest } = require('../../client/src/lib/queryClient');
    apiRequest.mockResolvedValueOnce({
      json: () => Promise.resolve(mockUser)
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Attempt registration
    act(() => {
      result.current.registerMutation.mutate({ 
        username: 'newuser', 
        password: 'securePass456' 
      });
    });
    
    // Wait for mutation to complete
    await vi.waitFor(() => {
      expect(result.current.registerMutation.isPending).toBe(false);
    });
    
    // Check that API was called correctly
    expect(apiRequest).toHaveBeenCalledWith('POST', '/api/register', {
      username: 'newuser',
      password: 'securePass456'
    });
    
    // Check that user data was set
    const { queryClient } = require('../../client/src/lib/queryClient');
    expect(queryClient.setQueryData).toHaveBeenCalledWith(['/api/user'], mockUser);
    
    // Check analytics event was tracked
    const { trackEvent, identifyUser } = require('../../client/src/lib/analytics');
    expect(trackEvent).toHaveBeenCalled();
    expect(identifyUser).toHaveBeenCalledWith(2);
  });
});