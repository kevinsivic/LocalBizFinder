import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, throwIfResNotOk, getQueryFn, queryClient } from '../../client/src/lib/queryClient';

// Mock global fetch
global.fetch = vi.fn();

describe('API Request Functions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('throwIfResNotOk', () => {
    it('should not throw for successful responses', async () => {
      const okResponse = {
        ok: true,
        status: 200
      } as Response;
      
      // This should not throw
      await expect(throwIfResNotOk(okResponse)).resolves.toBeUndefined();
    });
    
    it('should throw for unsuccessful responses', async () => {
      const errorResponse = {
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ message: 'Not found' })
      } as unknown as Response;
      
      // This should throw
      await expect(throwIfResNotOk(errorResponse)).rejects.toThrow('Not found');
    });
    
    it('should throw with status code if no message provided', async () => {
      const errorResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({})
      } as unknown as Response;
      
      // This should throw with status
      await expect(throwIfResNotOk(errorResponse)).rejects.toThrow('HTTP error 500');
    });
  });
  
  describe('apiRequest', () => {
    it('should make a GET request correctly', async () => {
      // Mock successful response
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: 'test' })
      } as unknown as Response;
      
      (global.fetch as vi.Mock).mockResolvedValue(mockResponse);
      
      // Make the request
      const result = await apiRequest('GET', '/api/test');
      
      // Verify fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        credentials: 'include'
      });
      
      // Verify the response was returned
      expect(result).toBe(mockResponse);
    });
    
    it('should make a POST request with body', async () => {
      // Mock successful response
      const mockResponse = {
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({ id: 1 })
      } as unknown as Response;
      
      (global.fetch as vi.Mock).mockResolvedValue(mockResponse);
      
      const requestBody = { name: 'Test', value: 123 };
      
      // Make the request
      const result = await apiRequest('POST', '/api/create', requestBody);
      
      // Verify fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith('/api/create', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });
      
      // Verify the response was returned
      expect(result).toBe(mockResponse);
    });
    
    it('should handle the throwIfNotOk parameter correctly', async () => {
      // Set up a failing response
      const errorResponse = {
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ message: 'Unauthorized' })
      } as unknown as Response;
      
      (global.fetch as vi.Mock).mockResolvedValue(errorResponse);
      
      // With throwIfNotOk = false, it should not throw
      const result = await apiRequest('GET', '/api/protected', undefined, false);
      expect(result).toBe(errorResponse);
      
      // With throwIfNotOk = true (default), it should throw
      await expect(apiRequest('GET', '/api/protected')).rejects.toThrow('Unauthorized');
    });
  });
  
  describe('getQueryFn', () => {
    it('should create a query function that returns data', async () => {
      // Mock successful response
      const mockData = { id: 1, name: 'Test' };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockData)
      } as unknown as Response;
      
      (global.fetch as vi.Mock).mockResolvedValue(mockResponse);
      
      // Create a query function
      const queryFn = getQueryFn({ on401: 'throw' });
      
      // Execute the query function
      const result = await queryFn({ queryKey: ['/api/test'] });
      
      // Verify result
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.any(Object));
    });
    
    it('should handle 401 errors according to options', async () => {
      // Mock 401 response
      const mockResponse = {
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ message: 'Unauthorized' })
      } as unknown as Response;
      
      (global.fetch as vi.Mock).mockResolvedValue(mockResponse);
      
      // With on401 = 'returnNull', it should return null
      const nullFn = getQueryFn({ on401: 'returnNull' });
      const nullResult = await nullFn({ queryKey: ['/api/protected'] });
      expect(nullResult).toBeNull();
      
      // With on401 = 'throw', it should throw
      const throwFn = getQueryFn({ on401: 'throw' });
      await expect(throwFn({ queryKey: ['/api/protected'] })).rejects.toThrow('Unauthorized');
    });
  });
  
  describe('queryClient configuration', () => {
    it('should have the expected default options', () => {
      expect(queryClient).toBeDefined();
      
      // Check defaultOptions are set
      const options = (queryClient as any).getDefaultOptions();
      expect(options.queries).toBeDefined();
      expect(options.queries.staleTime).toBeGreaterThan(0);
      expect(options.queries.queryFn).toBeDefined();
    });
  });
});