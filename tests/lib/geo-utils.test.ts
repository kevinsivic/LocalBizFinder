import { describe, it, expect } from 'vitest';
import { calculateDistance, formatDistance } from '../../client/src/lib/geo-utils';

describe('Geo Utility Functions', () => {
  describe('calculateDistance', () => {
    it('should calculate correct distance between two points', () => {
      // San Francisco to Los Angeles: ~383 miles
      const distance = calculateDistance(37.7749, -122.4194, 34.0522, -118.2437);
      expect(distance).toBeCloseTo(383, 0); // Within 1 mile accuracy
    });
    
    it('should return 0 for identical points', () => {
      const distance = calculateDistance(37.7749, -122.4194, 37.7749, -122.4194);
      expect(distance).toBe(0);
    });
    
    it('should handle international distances', () => {
      // New York to London: ~3470 miles
      const distance = calculateDistance(40.7128, -74.0060, 51.5074, -0.1278);
      expect(distance).toBeCloseTo(3470, 0); // Within 1 mile accuracy
    });
    
    it('should handle the antipodes (opposite points on Earth)', () => {
      // Example: Point in Spain to point in New Zealand (approximately antipodal)
      const distance = calculateDistance(40.4168, -3.7038, -41.2865, 174.7762);
      expect(distance).toBeGreaterThan(12000); // Should be close to half of Earth's circumference
    });
  });
  
  describe('formatDistance', () => {
    it('should format distance as miles', () => {
      expect(formatDistance(1)).toBe('1.0 miles');
      expect(formatDistance(2.5)).toBe('2.5 miles');
      expect(formatDistance(10)).toBe('10.0 miles');
    });
    
    it('should format distance with single decimal place', () => {
      expect(formatDistance(1.23)).toBe('1.2 miles');
      expect(formatDistance(5.67)).toBe('5.7 miles');
      expect(formatDistance(9.99)).toBe('10.0 miles');
    });
    
    it('should handle null input', () => {
      expect(formatDistance(null)).toBe('Unknown distance');
    });
    
    it('should format small distances correctly', () => {
      expect(formatDistance(0)).toBe('0.0 miles');
      expect(formatDistance(0.1)).toBe('0.1 miles');
      expect(formatDistance(0.01)).toBe('0.0 miles');
    });
    
    it('should format large distances correctly', () => {
      expect(formatDistance(1000)).toBe('1000.0 miles');
      expect(formatDistance(1234.5678)).toBe('1234.6 miles');
    });
  });
});