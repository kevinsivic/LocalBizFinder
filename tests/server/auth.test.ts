import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse, createMockNext } from '../utils/test-utils';

// Mock the crypto module for password hashing tests
vi.mock('crypto', () => ({
  randomBytes: vi.fn(() => Buffer.from('randomBytes')),
  pbkdf2Sync: vi.fn(() => Buffer.from('hashedPassword')),
  timingSafeEqual: vi.fn((a, b) => true)
}));

// Import after mocking dependencies
import { hashPassword, comparePasswords } from '../../server/auth';

describe('Authentication Module', () => {
  describe('Password Utilities', () => {
    it('should hash a password correctly', async () => {
      const password = 'securePassword123';
      const hashedPassword = await hashPassword(password);
      
      // Check that the hash is not the original password
      expect(hashedPassword).not.toBe(password);
      // Check that we get a string
      expect(typeof hashedPassword).toBe('string');
      // Check that hash includes salt and iterations
      expect(hashedPassword).toContain(':');
    });
    
    it('should verify a correct password', async () => {
      const password = 'securePassword123';
      const hashedPassword = await hashPassword(password);
      
      // Should return true for the correct password
      const isValid = await comparePasswords(password, hashedPassword);
      expect(isValid).toBe(true);
    });
    
    it('should reject an incorrect password', async () => {
      const password = 'securePassword123';
      const wrongPassword = 'wrongPassword456';
      const hashedPassword = await hashPassword(password);
      
      // Mock timingSafeEqual to return false for this specific test
      const cryptoModule = await import('crypto');
      vi.mocked(cryptoModule.timingSafeEqual).mockImplementationOnce(() => false);
      
      // Should return false for the wrong password
      const isValid = await comparePasswords(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });
  });
});

// Mock requireAuth middleware test
describe('Authentication Middleware', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
  });

  it('should call next() if user is authenticated', () => {
    // Mock authenticated request
    req.isAuthenticated = vi.fn().mockReturnValue(true);
    
    // Import requireAuth (function should be exported from auth.ts)
    const { requireAuth } = require('../../server/routes');
    
    // Execute middleware
    requireAuth(req, res, next);
    
    // Assert that next was called
    expect(next).toHaveBeenCalled();
    // Assert that res.status was not called
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 if user is not authenticated', () => {
    // Mock unauthenticated request
    req.isAuthenticated = vi.fn().mockReturnValue(false);
    
    // Import requireAuth
    const { requireAuth } = require('../../server/routes');
    
    // Execute middleware
    requireAuth(req, res, next);
    
    // Assert proper error response
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.any(String)
    }));
    // Assert that next was not called
    expect(next).not.toHaveBeenCalled();
  });
});