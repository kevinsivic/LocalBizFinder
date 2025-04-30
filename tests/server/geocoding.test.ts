import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { geocodeAddress, geocodeAddressWithRetry, geocodeAddressWithFallback, delay } from '../../server/geocoding-server';

// Mock node-fetch
vi.mock('node-fetch', () => {
  return {
    default: vi.fn()
  };
});

describe('Geocoding Service', () => {
  const mockSuccessResponse = {
    features: [
      {
        geometry: {
          coordinates: [-122.4194, 37.7749]
        }
      }
    ]
  };
  
  const mockEmptyResponse = {
    features: []
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('geocodeAddress', () => {
    it('should return coordinates for a valid address', async () => {
      // Mock fetch implementation
      const fetch = require('node-fetch').default;
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      });
      
      const result = await geocodeAddress('San Francisco, CA');
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ lat: 37.7749, lon: -122.4194 });
    });
    
    it('should return null for an invalid address', async () => {
      // Mock fetch implementation
      const fetch = require('node-fetch').default;
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmptyResponse)
      });
      
      const result = await geocodeAddress('NonexistentPlace, XYZ');
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock fetch implementation to simulate an error
      const fetch = require('node-fetch').default;
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await geocodeAddress('Portland, OR');
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });
  
  describe('geocodeAddressWithRetry', () => {
    it('should retry failed geocoding attempts', async () => {
      // Mock delay to speed up tests
      vi.spyOn(global, 'setTimeout').mockImplementation((cb) => {
        cb();
        return 1 as any; // Return dummy timeout ID
      });
      
      // Mock fetch implementation to fail twice then succeed
      const fetch = require('node-fetch').default;
      fetch.mockRejectedValueOnce(new Error('Network error'))
           .mockRejectedValueOnce(new Error('Network error'))
           .mockResolvedValueOnce({
             ok: true,
             json: () => Promise.resolve(mockSuccessResponse)
           });
      
      const result = await geocodeAddressWithRetry('Chicago, IL', 3, 100);
      
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ lat: 37.7749, lon: -122.4194 });
    });
    
    it('should give up after max retries', async () => {
      // Mock delay to speed up tests
      vi.spyOn(global, 'setTimeout').mockImplementation((cb) => {
        cb();
        return 1 as any; // Return dummy timeout ID
      });
      
      // Mock fetch implementation to always fail
      const fetch = require('node-fetch').default;
      fetch.mockRejectedValue(new Error('Network error'));
      
      const result = await geocodeAddressWithRetry('Boston, MA', 3, 100);
      
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(result).toBeNull();
    });
  });
  
  describe('geocodeAddressWithFallback', () => {
    it('should use fallback coordinates when geocoding fails', async () => {
      // Mock geocodeAddress to fail
      vi.spyOn(await import('../../server/geocoding-server'), 'geocodeAddress')
         .mockResolvedValueOnce(null);
      
      const fallbackCoords = { lat: 45.5202, lon: -122.6742 };
      const result = await geocodeAddressWithFallback('Invalid Address', fallbackCoords);
      
      expect(result).toEqual(fallbackCoords);
    });
    
    it('should use real coordinates when geocoding succeeds', async () => {
      // Mock geocodeAddress to succeed
      const realCoords = { lat: 37.7749, lon: -122.4194 };
      vi.spyOn(await import('../../server/geocoding-server'), 'geocodeAddress')
         .mockResolvedValueOnce(realCoords);
      
      const fallbackCoords = { lat: 45.5202, lon: -122.6742 };
      const result = await geocodeAddressWithFallback('San Francisco, CA', fallbackCoords);
      
      expect(result).toEqual(realCoords);
    });
  });
  
  describe('delay', () => {
    it('should delay for the specified time', async () => {
      vi.useFakeTimers();
      
      const delayPromise = delay(1000);
      vi.advanceTimersByTime(1000);
      await delayPromise;
      
      // If we get here, the test passes
      expect(true).toBe(true);
      
      vi.useRealTimers();
    });
  });
});