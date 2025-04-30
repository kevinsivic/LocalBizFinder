import { describe, it, expect } from 'vitest';
import { calculateDistance, formatDistance } from '../../client/src/lib/geo-utils';

describe('Geo Utilities', () => {
  describe('calculateDistance', () => {
    it('should calculate the distance between two points correctly', () => {
      // San Francisco to Los Angeles (about 381 miles)
      const sf = { lat: 37.7749, lon: -122.4194 };
      const la = { lat: 34.0522, lon: -118.2437 };
      
      const distance = calculateDistance(sf.lat, sf.lon, la.lat, la.lon);
      expect(distance).toBeCloseTo(380, -1); // Approximate within 10 miles
    });
    
    it('should return 0 for identical points', () => {
      const nyc = { lat: 40.7128, lon: -74.0060 };
      const distance = calculateDistance(nyc.lat, nyc.lon, nyc.lat, nyc.lon);
      expect(distance).toBe(0);
    });
    
    it('should handle negative coordinates correctly', () => {
      // Sydney to Buenos Aires (about 7000+ miles)
      const sydney = { lat: -33.8688, lon: 151.2093 };
      const buenosAires = { lat: -34.6037, lon: -58.3816 };
      
      const distance = calculateDistance(sydney.lat, sydney.lon, buenosAires.lat, buenosAires.lon);
      expect(distance).toBeGreaterThan(6000); // Just checking it's reasonably large
    });
  });
  
  describe('formatDistance', () => {
    it('should format distance with correct singular/plural form', () => {
      expect(formatDistance(1)).toBe('1.0 mile');
      expect(formatDistance(2.5)).toBe('2.5 miles');
    });
    
    it('should format to one decimal place', () => {
      expect(formatDistance(10.12345)).toBe('10.1 miles');
      expect(formatDistance(0.58)).toBe('0.6 mile');
    });
    
    it('should handle null/undefined values', () => {
      expect(formatDistance(null)).toBe('Distance unknown');
      expect(formatDistance(undefined)).toBe('Distance unknown');
    });
    
    it('should handle zero distance', () => {
      expect(formatDistance(0)).toBe('0.0 miles');
    });
  });
});