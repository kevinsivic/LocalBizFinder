import { vi } from 'vitest';
import type { IStorage } from '../../server/storage';

/**
 * Creates a mock storage implementation for testing
 */
export function createMockStorage(): IStorage {
  return {
    // User methods
    getUser: vi.fn().mockResolvedValue({
      id: 1,
      username: 'testuser',
      password: 'hashed_password',
      isAdmin: false
    }),
    getUserByUsername: vi.fn().mockResolvedValue({
      id: 1,
      username: 'testuser',
      password: 'hashed_password',
      isAdmin: false
    }),
    createUser: vi.fn().mockResolvedValue({
      id: 1,
      username: 'newuser',
      password: 'hashed_password',
      isAdmin: false
    }),
    
    // Business methods
    getAllBusinesses: vi.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Test Business',
        description: 'A test business',
        category: 'Food',
        address: '123 Test St, Testville',
        latitude: 37.7749,
        longitude: -122.4194,
        createdBy: 1
      }
    ]),
    getBusinessById: vi.fn().mockResolvedValue({
      id: 1,
      name: 'Test Business',
      description: 'A test business',
      category: 'Food',
      address: '123 Test St, Testville',
      latitude: 37.7749,
      longitude: -122.4194,
      createdBy: 1
    }),
    getBusinessesInBounds: vi.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Test Business',
        description: 'A test business',
        category: 'Food',
        address: '123 Test St, Testville',
        latitude: 37.7749,
        longitude: -122.4194,
        createdBy: 1
      }
    ]),
    createBusiness: vi.fn().mockResolvedValue({
      id: 1,
      name: 'New Business',
      description: 'A new business',
      category: 'Retail',
      address: '456 New St, Newville',
      latitude: 40.7128,
      longitude: -74.0060,
      createdBy: 1
    }),
    updateBusiness: vi.fn().mockResolvedValue({
      id: 1,
      name: 'Updated Business',
      description: 'An updated business',
      category: 'Retail',
      address: '456 New St, Newville',
      latitude: 40.7128,
      longitude: -74.0060,
      createdBy: 1
    }),
    deleteBusiness: vi.fn().mockResolvedValue(),
    
    // Business hours methods
    getBusinessHours: vi.fn().mockResolvedValue([
      {
        id: 1,
        businessId: 1,
        dayOfWeek: 1,
        openTime: '09:00',
        closeTime: '17:00',
        isClosed: false
      }
    ]),
    setBusinessHours: vi.fn().mockResolvedValue([
      {
        id: 1,
        businessId: 1,
        dayOfWeek: 1,
        openTime: '09:00',
        closeTime: '17:00',
        isClosed: false
      }
    ]),
    
    // Issue report methods
    createIssueReport: vi.fn().mockResolvedValue({
      id: 1,
      businessId: 1,
      reportedBy: 2,
      issueType: 'incorrect_info',
      details: 'Wrong address',
      status: 'pending',
      createdAt: new Date()
    }),
    getIssueReportById: vi.fn().mockResolvedValue({
      id: 1,
      businessId: 1,
      reportedBy: 2,
      issueType: 'incorrect_info',
      details: 'Wrong address',
      status: 'pending',
      createdAt: new Date()
    }),
    getIssueReportsByBusiness: vi.fn().mockResolvedValue([
      {
        id: 1,
        businessId: 1,
        reportedBy: 2,
        issueType: 'incorrect_info',
        details: 'Wrong address',
        status: 'pending',
        createdAt: new Date()
      }
    ]),
    getIssueReportsByUser: vi.fn().mockResolvedValue([
      {
        id: 1,
        businessId: 1,
        reportedBy: 2,
        issueType: 'incorrect_info',
        details: 'Wrong address',
        status: 'pending',
        createdAt: new Date()
      }
    ]),
    getAllIssueReports: vi.fn().mockResolvedValue([
      {
        id: 1,
        businessId: 1,
        reportedBy: 2,
        issueType: 'incorrect_info',
        details: 'Wrong address',
        status: 'pending',
        createdAt: new Date()
      }
    ]),
    updateIssueReport: vi.fn().mockResolvedValue({
      id: 1,
      businessId: 1,
      reportedBy: 2,
      issueType: 'incorrect_info',
      details: 'Wrong address',
      status: 'resolved',
      createdAt: new Date()
    }),
    
    // Rating methods
    createRating: vi.fn().mockResolvedValue({
      id: 1,
      businessId: 1,
      userId: 2,
      rating: 4,
      comment: 'Great service',
      createdAt: new Date()
    }),
    getRatingById: vi.fn().mockResolvedValue({
      id: 1,
      businessId: 1,
      userId: 2,
      rating: 4,
      comment: 'Great service',
      createdAt: new Date()
    }),
    getRatingsByBusiness: vi.fn().mockResolvedValue([
      {
        id: 1,
        businessId: 1,
        userId: 2,
        rating: 4,
        comment: 'Great service',
        createdAt: new Date()
      }
    ]),
    getRatingsByUser: vi.fn().mockResolvedValue([
      {
        id: 1,
        businessId: 1,
        userId: 2,
        rating: 4,
        comment: 'Great service',
        createdAt: new Date()
      }
    ]),
    getUserRatingForBusiness: vi.fn().mockResolvedValue({
      id: 1,
      businessId: 1,
      userId: 2,
      rating: 4,
      comment: 'Great service',
      createdAt: new Date()
    }),
    getAverageRatingForBusiness: vi.fn().mockResolvedValue(4.2),
    updateRating: vi.fn().mockResolvedValue({
      id: 1,
      businessId: 1,
      userId: 2,
      rating: 5,
      comment: 'Updated comment',
      createdAt: new Date()
    }),
    deleteRating: vi.fn().mockResolvedValue(),
    
    // Mock session store
    sessionStore: {}
  };
}

/**
 * Creates a mock request object for Express testing
 */
export function createMockRequest(overrides: object = {}) {
  return {
    body: {},
    params: {},
    query: {},
    user: null,
    isAuthenticated: () => false,
    ...overrides
  };
}

/**
 * Creates a mock response object for Express testing
 */
export function createMockResponse() {
  const res: any = {};
  
  // Status
  res.status = vi.fn().mockReturnValue(res);
  
  // Send methods
  res.send = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  
  // Headers
  res.set = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  
  // Redirects
  res.redirect = vi.fn().mockReturnValue(res);
  
  // Other methods
  res.cookie = vi.fn().mockReturnValue(res);
  res.clearCookie = vi.fn().mockReturnValue(res);
  res.render = vi.fn().mockReturnValue(res);
  
  return res;
}

/**
 * Creates a mock next function for Express testing
 */
export function createMockNext() {
  return vi.fn();
}