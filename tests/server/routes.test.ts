import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse, createMockNext, createMockStorage } from '../utils/test-utils';
import express from 'express';
import type { Express, Request, Response } from 'express';

// Mock Express
vi.mock('express', () => {
  const app = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    use: vi.fn()
  };
  return {
    default: vi.fn(() => app),
    json: vi.fn(),
    urlencoded: vi.fn()
  };
});

// Mock storage
vi.mock('../../server/storage', () => {
  return {
    storage: createMockStorage()
  };
});

// Mock auth setup
vi.mock('../../server/auth', () => {
  return {
    setupAuth: vi.fn()
  };
});

// Import after mocking
import { registerRoutes, requireAuth, requireAdmin } from '../../server/routes';
import { storage } from '../../server/storage';

describe('API Routes', () => {
  let app: Express;
  
  beforeEach(() => {
    app = express();
    vi.clearAllMocks();
  });
  
  describe('Authentication Middleware', () => {
    it('requireAuth should pass authenticated requests', () => {
      const req = createMockRequest({ isAuthenticated: () => true });
      const res = createMockResponse();
      const next = createMockNext();
      
      requireAuth(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('requireAuth should reject unauthenticated requests', () => {
      const req = createMockRequest({ isAuthenticated: () => false });
      const res = createMockResponse();
      const next = createMockNext();
      
      requireAuth(req as Request, res as Response, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
    });
    
    it('requireAdmin should pass admin requests', () => {
      const req = createMockRequest({ 
        isAuthenticated: () => true,
        user: { id: 1, username: 'admin', isAdmin: true }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      requireAdmin(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('requireAdmin should reject non-admin requests', () => {
      const req = createMockRequest({ 
        isAuthenticated: () => true,
        user: { id: 2, username: 'user', isAdmin: false }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      requireAdmin(req as Request, res as Response, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
    });
  });
  
  describe('Route Registration', () => {
    it('should register all routes correctly', async () => {
      await registerRoutes(app);
      
      // Verify auth routes are set up
      const { setupAuth } = require('../../server/auth');
      expect(setupAuth).toHaveBeenCalledWith(app);
      
      // Check that essential routes are registered
      expect(app.get).toHaveBeenCalledWith('/api/businesses', expect.any(Function));
      expect(app.get).toHaveBeenCalledWith('/api/businesses/:id', expect.any(Function));
      expect(app.post).toHaveBeenCalledWith('/api/businesses', expect.any(Function), expect.any(Function));
    });
  });
  
  describe('Business Routes', () => {
    it('GET /api/businesses should return all businesses', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      
      // Mock storage implementation for this test
      const mockBusinesses = [
        { id: 1, name: 'Test Business 1', category: 'Food' },
        { id: 2, name: 'Test Business 2', category: 'Retail' }
      ];
      vi.mocked(storage.getAllBusinesses).mockResolvedValueOnce(mockBusinesses);
      
      // Get the route handler
      await registerRoutes(app);
      const getBusinessesHandler = vi.mocked(app.get).mock.calls.find(
        call => call[0] === '/api/businesses'
      )?.[1];
      
      // Execute handler if found
      if (getBusinessesHandler) {
        await getBusinessesHandler(req as Request, res as Response);
        
        expect(storage.getAllBusinesses).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(mockBusinesses);
      } else {
        throw new Error('Get businesses route handler not found');
      }
    });
    
    it('GET /api/businesses should filter by bounds if provided', async () => {
      const req = createMockRequest({
        query: { bounds: '37.7,-122.5,37.8,-122.3' }
      });
      const res = createMockResponse();
      
      // Mock storage implementation for this test
      const mockBusinesses = [{ id: 1, name: 'Test Business In Bounds' }];
      vi.mocked(storage.getBusinessesInBounds).mockResolvedValueOnce(mockBusinesses);
      
      // Get the route handler
      await registerRoutes(app);
      const getBusinessesHandler = vi.mocked(app.get).mock.calls.find(
        call => call[0] === '/api/businesses'
      )?.[1];
      
      // Execute handler if found
      if (getBusinessesHandler) {
        await getBusinessesHandler(req as Request, res as Response);
        
        expect(storage.getBusinessesInBounds).toHaveBeenCalledWith(37.7, -122.5, 37.8, -122.3);
        expect(res.json).toHaveBeenCalledWith(mockBusinesses);
      } else {
        throw new Error('Get businesses route handler not found');
      }
    });
  });
});