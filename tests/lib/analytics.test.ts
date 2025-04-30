import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  trackEvent, 
  identifyUser, 
  resetIdentity, 
  AnalyticsEvent 
} from '../../client/src/lib/analytics';

// Mock the global window.swetrix object
const mockTrack = vi.fn();
const mockIdentify = vi.fn();
const mockReset = vi.fn();

describe('Analytics Module', () => {
  // Setup mocks before each test
  beforeEach(() => {
    // Create mock of swetrix global
    global.window = {
      ...global.window,
      swetrix: {
        track: mockTrack,
        identify: mockIdentify,
        reset: mockReset
      }
    };
    
    // Clear mock calls between tests
    vi.clearAllMocks();
  });
  
  // Clean up after each test
  afterEach(() => {
    // Restore window object
    vi.restoreAllMocks();
  });
  
  describe('trackEvent', () => {
    it('should call swetrix.track with correct parameters', () => {
      // Test data
      const event = AnalyticsEvent.BUSINESS_VIEW;
      const properties = { businessId: 123 };
      
      // Call function
      trackEvent(event, properties);
      
      // Assert
      expect(mockTrack).toHaveBeenCalledTimes(1);
      expect(mockTrack).toHaveBeenCalledWith(event, properties);
    });
    
    it('should handle calls with missing properties', () => {
      // Call with no props
      trackEvent(AnalyticsEvent.USER_LOGOUT);
      
      // Assert
      expect(mockTrack).toHaveBeenCalledTimes(1);
      expect(mockTrack).toHaveBeenCalledWith(AnalyticsEvent.USER_LOGOUT, undefined);
    });
    
    it('should handle errors gracefully', () => {
      // Make track throw an error
      mockTrack.mockImplementationOnce(() => {
        throw new Error('Tracking failed');
      });
      
      // This shouldn't throw
      expect(() => {
        trackEvent(AnalyticsEvent.MAP_VIEW);
      }).not.toThrow();
      
      expect(mockTrack).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('identifyUser', () => {
    it('should call swetrix.identify with user ID', () => {
      // Call function
      identifyUser(42);
      
      // Assert
      expect(mockIdentify).toHaveBeenCalledTimes(1);
      expect(mockIdentify).toHaveBeenCalledWith('42');
    });
    
    it('should convert user ID to string', () => {
      // Call with numeric ID
      identifyUser(123);
      
      // Assert string conversion
      expect(mockIdentify).toHaveBeenCalledWith('123');
    });
    
    it('should handle errors gracefully', () => {
      // Make identify throw an error
      mockIdentify.mockImplementationOnce(() => {
        throw new Error('Identity tracking failed');
      });
      
      // This shouldn't throw
      expect(() => {
        identifyUser(789);
      }).not.toThrow();
      
      expect(mockIdentify).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('resetIdentity', () => {
    it('should call swetrix.reset', () => {
      // Call function
      resetIdentity();
      
      // Assert
      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(mockReset).toHaveBeenCalled();
    });
    
    it('should handle errors gracefully', () => {
      // Make reset throw an error
      mockReset.mockImplementationOnce(() => {
        throw new Error('Reset failed');
      });
      
      // This shouldn't throw
      expect(() => {
        resetIdentity();
      }).not.toThrow();
      
      expect(mockReset).toHaveBeenCalledTimes(1);
    });
  });
});