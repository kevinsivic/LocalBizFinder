import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  trackEvent, 
  trackPageView, 
  identifyUser, 
  resetIdentity, 
  startPageLoadTracking, 
  AnalyticsEvent 
} from '../../client/src/lib/analytics';

describe('Analytics Module', () => {
  // Mock the Swetrix global API
  beforeEach(() => {
    // Create mock Swetrix global object
    window.swetrix = {
      track: vi.fn(),
      trackViews: vi.fn(),
      identify: vi.fn(),
      reset: vi.fn(),
      init: vi.fn()
    };
  });
  
  afterEach(() => {
    vi.resetAllMocks();
    // Clean up the mock
    delete window.swetrix;
  });
  
  describe('trackEvent', () => {
    it('should call swetrix.track with correct parameters', () => {
      // Test event tracking
      trackEvent(AnalyticsEvent.BUSINESS_VIEW, { businessId: '123' });
      
      expect(window.swetrix.track).toHaveBeenCalledWith(
        AnalyticsEvent.BUSINESS_VIEW, 
        { businessId: '123' }
      );
    });
    
    it('should handle tracking with no parameters', () => {
      trackEvent(AnalyticsEvent.USER_LOGOUT);
      
      expect(window.swetrix.track).toHaveBeenCalledWith(
        AnalyticsEvent.USER_LOGOUT, 
        {}
      );
    });
    
    it('should gracefully handle errors', () => {
      // Make the track function throw an error
      window.swetrix.track = vi.fn().mockImplementation(() => {
        throw new Error('Tracking error');
      });
      
      // This should not throw
      trackEvent(AnalyticsEvent.BUSINESS_SEARCH);
      
      expect(window.swetrix.track).toHaveBeenCalled();
    });
  });
  
  describe('trackPageView', () => {
    it('should call swetrix.trackViews with the correct path', () => {
      trackPageView('/businesses');
      
      expect(window.swetrix.trackViews).toHaveBeenCalledWith({
        path: '/businesses' 
      });
    });
    
    it('should gracefully handle errors', () => {
      // Make the trackViews function throw an error
      window.swetrix.trackViews = vi.fn().mockImplementation(() => {
        throw new Error('Tracking error');
      });
      
      // This should not throw
      trackPageView('/login');
      
      expect(window.swetrix.trackViews).toHaveBeenCalled();
    });
  });
  
  describe('identifyUser', () => {
    it('should call swetrix.identify with the correct userId', () => {
      identifyUser(123);
      
      expect(window.swetrix.identify).toHaveBeenCalledWith(123);
    });
    
    it('should gracefully handle errors', () => {
      // Make the identify function throw an error
      window.swetrix.identify = vi.fn().mockImplementation(() => {
        throw new Error('Identify error');
      });
      
      // This should not throw
      identifyUser(456);
      
      expect(window.swetrix.identify).toHaveBeenCalled();
    });
  });
  
  describe('resetIdentity', () => {
    it('should call swetrix.reset', () => {
      resetIdentity();
      
      expect(window.swetrix.reset).toHaveBeenCalled();
    });
    
    it('should gracefully handle errors', () => {
      // Make the reset function throw an error
      window.swetrix.reset = vi.fn().mockImplementation(() => {
        throw new Error('Reset error');
      });
      
      // This should not throw
      resetIdentity();
      
      expect(window.swetrix.reset).toHaveBeenCalled();
    });
  });
  
  describe('startPageLoadTracking', () => {
    it('should initialize performance tracking', () => {
      // Mock performance metrics
      window.performance = {
        timing: {
          domContentLoadedEventEnd: 1000,
          navigationStart: 500
        }
      } as any;
      
      startPageLoadTracking();
      
      // Should have at least tried to track the page load time
      expect(window.swetrix.track).toHaveBeenCalled();
      
      // Restore original performance object
      delete window.performance;
    });
    
    it('should handle missing performance API', () => {
      // Simulate browser without performance API
      const originalPerformance = window.performance;
      delete window.performance;
      
      // This should not throw
      startPageLoadTracking();
      
      // Should not track anything if performance API is missing
      expect(window.swetrix.track).not.toHaveBeenCalled();
      
      // Restore original performance object if it existed
      if (originalPerformance) {
        window.performance = originalPerformance;
      }
    });
  });
});