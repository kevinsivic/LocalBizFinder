import * as Swetrix from 'swetrix';

// Events we want to track
export enum AnalyticsEvent {
  // Business-related events
  BUSINESS_VIEW = 'business_view',
  BUSINESS_SEARCH = 'business_search',
  BUSINESS_FILTER = 'business_filter',
  BUSINESS_CREATE = 'business_create',
  BUSINESS_EDIT = 'business_edit',
  BUSINESS_DELETE = 'business_delete',
  
  // Authentication events
  USER_LOGIN = 'user_login',
  USER_REGISTER = 'user_register',
  USER_LOGOUT = 'user_logout',
  
  // Rating events
  RATING_SUBMIT = 'rating_submit',
  RATING_UPDATE = 'rating_update',
  RATING_DELETE = 'rating_delete',
  
  // Issue reporting events
  ISSUE_REPORT = 'issue_report',
  ISSUE_RESOLVE = 'issue_resolve',
  
  // Map interaction events
  MAP_VIEW = 'map_view',
  MAP_ZOOM = 'map_zoom',
  MAP_DRAG = 'map_drag',
  
  // User interaction events
  GET_DIRECTIONS = 'get_directions',
  SHARE_BUSINESS = 'share_business',
  SAVE_FAVORITE = 'save_favorite',
  
  // User identity events
  USER_IDENTIFY = 'user_identify',
  USER_RESET = 'user_reset'
}

// Initialize Swetrix with project ID from environment variables
let projectId = import.meta.env.VITE_SWETRIX_PROJECT_ID as string;
const customServerUrl = 'https://track.jemsoftware.co/';

// Fetch configuration from the server if needed
const initializeAnalytics = async () => {
  try {
    // If we don't have a project ID from Vite env, try to fetch from server
    if (!projectId) {
      console.debug('[Analytics] No project ID in client environment, fetching from server...');
      const response = await fetch('/api/config');
      const config = await response.json();
      projectId = config.SWETRIX_PROJECT_ID;
      console.debug('[Analytics] Fetched project ID from server:', projectId || '(not set)');
    }

    // Only initialize if project ID exists
    const shouldInitialize = !!projectId;

    if (shouldInitialize) {
      // Initialize with custom server URL
      Swetrix.init(projectId, {
        apiURL: customServerUrl
        // Note: debug mode removed as it's not in LibOptions type
      });
      console.debug(`[Analytics] Initialized with project ID: ${projectId}, custom server: ${customServerUrl}`);
      Swetrix.trackViews();
    } else {
      console.warn('[Analytics] Skipping initialization - no project ID available');
    }
  } catch (error) {
    console.error('[Analytics] Error initializing:', error);
  }
};

// Start initialization
initializeAnalytics();

// Helper function to check if analytics is initialized
const isInitialized = () => {
  return !!projectId;
};

// Track a custom event
export const trackEvent = (
  event: AnalyticsEvent, 
  metadata?: Record<string, string>
) => {
  if (!isInitialized()) return;
  
  try {
    Swetrix.track({ 
      ev: event, 
      meta: metadata 
    });
    
    console.debug(`[Analytics] Tracked event: ${event}`, metadata);
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error);
  }
};

// Track a page view
export const trackPageView = (path: string) => {
  if (!isInitialized() || !path) return;
  
  try {
    // Use the path for tracking with the custom server
    Swetrix.trackPageview(path);
    console.debug(`[Analytics] Tracked page view: ${path}`);
  } catch (error) {
    console.error('[Analytics] Error tracking page view:', error);
  }
};

// Set custom user ID for better tracking - Track as a custom event with user ID metadata
export const identifyUser = (userId: number) => {
  if (!isInitialized()) return;
  
  try {
    // Track user identity as an event with metadata
    trackEvent(AnalyticsEvent.USER_IDENTIFY, { userId: userId.toString() });
    console.debug(`[Analytics] Identified user: ${userId}`);
  } catch (error) {
    console.error('[Analytics] Error identifying user:', error);
  }
};

// Reset user identity (e.g., on logout)
export const resetIdentity = () => {
  if (!isInitialized()) return;
  
  try {
    // Track user reset as an event
    trackEvent(AnalyticsEvent.USER_RESET);
    console.debug('[Analytics] Reset user identity');
  } catch (error) {
    console.error('[Analytics] Error resetting identity:', error);
  }
};

// Start page load time tracking
export const startPageLoadTracking = () => {
  // This function now just ensures the analytics module is loaded
  // The actual initialization happens asynchronously
  console.debug('[Analytics] Analytics module loaded');
};