import { vi } from 'vitest';
import { IStorage } from '../../server/storage';

/**
 * Creates a mock storage implementation for testing
 */
export function createMockStorage(): IStorage {
  const storage: Partial<IStorage> = {
    getUser: vi.fn(),
    getUserByUsername: vi.fn(),
    createUser: vi.fn(),
    getAllBusinesses: vi.fn(),
    getBusinessById: vi.fn(),
    getBusinessesInBounds: vi.fn(),
    createBusiness: vi.fn(),
    updateBusiness: vi.fn(),
    deleteBusiness: vi.fn(),
    getBusinessHours: vi.fn(),
    setBusinessHours: vi.fn(),
    createIssueReport: vi.fn(),
    getIssueReportById: vi.fn(),
    getIssueReportsByBusiness: vi.fn(),
    getIssueReportsByUser: vi.fn(),
    getAllIssueReports: vi.fn(),
    updateIssueReport: vi.fn(),
    createRating: vi.fn(),
    getRatingById: vi.fn(),
    getRatingsByBusiness: vi.fn(),
    getRatingsByUser: vi.fn(),
    getUserRatingForBusiness: vi.fn(),
    getAverageRatingForBusiness: vi.fn(),
    updateRating: vi.fn(),
    deleteRating: vi.fn(),
    sessionStore: {},
  };

  return storage as IStorage;
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
    isAuthenticated: () => Boolean(overrides.user),
    ...overrides
  };
}

/**
 * Creates a mock response object for Express testing
 */
export function createMockResponse() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  return res;
}

/**
 * Creates a mock next function for Express testing
 */
export function createMockNext() {
  return vi.fn();
}