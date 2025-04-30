import { describe, it, expect } from 'vitest';
import { 
  insertUserSchema, 
  insertBusinessSchema, 
  businessHoursSchema,
  issueReportSchema,
  ratingSchema,
  issueStatusEnum
} from '../../shared/schema';

describe('Schema Validation', () => {
  describe('User Schema', () => {
    it('should validate a valid user', () => {
      const validUser = {
        username: 'testuser',
        password: 'securePass123'
      };
      
      const result = insertUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });
    
    it('should reject a user with missing fields', () => {
      const invalidUser = {
        username: 'testuser'
        // Missing password field
      };
      
      const result = insertUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
    
    it('should reject a user with invalid username', () => {
      const invalidUser = {
        username: '',  // Empty username
        password: 'securePass123'
      };
      
      const result = insertUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });
  
  describe('Business Schema', () => {
    it('should validate a valid business', () => {
      const validBusiness = {
        name: 'Test Business',
        description: 'A test business description',
        category: 'Food',
        address: '123 Test Street, Test City',
        latitude: 37.7749,
        longitude: -122.4194,
        createdBy: 1
      };
      
      const result = insertBusinessSchema.safeParse(validBusiness);
      expect(result.success).toBe(true);
    });
    
    it('should validate a business with optional fields', () => {
      const validBusiness = {
        name: 'Test Business',
        description: 'A test business description',
        category: 'Food',
        address: '123 Test Street, Test City',
        latitude: 37.7749,
        longitude: -122.4194,
        createdBy: 1,
        phone: '555-123-4567',
        website: 'https://testbusiness.com',
        imageUrl: 'https://example.com/image.jpg'
      };
      
      const result = insertBusinessSchema.safeParse(validBusiness);
      expect(result.success).toBe(true);
    });
    
    it('should reject a business with missing required fields', () => {
      const invalidBusiness = {
        name: 'Test Business',
        // Missing description
        category: 'Food',
        address: '123 Test Street, Test City',
        latitude: 37.7749,
        longitude: -122.4194,
        createdBy: 1
      };
      
      const result = insertBusinessSchema.safeParse(invalidBusiness);
      expect(result.success).toBe(false);
    });
    
    it('should reject a business with invalid coordinates', () => {
      const invalidBusiness = {
        name: 'Test Business',
        description: 'A test business description',
        category: 'Food',
        address: '123 Test Street, Test City',
        latitude: 'invalid', // Invalid latitude
        longitude: -122.4194,
        createdBy: 1
      };
      
      const result = insertBusinessSchema.safeParse(invalidBusiness);
      expect(result.success).toBe(false);
    });
  });
  
  describe('Business Hours Schema', () => {
    it('should validate valid business hours', () => {
      const validHours = {
        businessId: 1,
        dayOfWeek: 1,
        openTime: '09:00',
        closeTime: '17:00',
        isClosed: false
      };
      
      const result = businessHoursSchema.safeParse(validHours);
      expect(result.success).toBe(true);
    });
    
    it('should validate closed day', () => {
      const closedDay = {
        businessId: 1,
        dayOfWeek: 0, // Sunday
        isClosed: true
      };
      
      const result = businessHoursSchema.safeParse(closedDay);
      expect(result.success).toBe(true);
    });
  });
  
  describe('Issue Report Schema', () => {
    it('should validate a valid issue report', () => {
      const validReport = {
        businessId: 1,
        reportedBy: 2,
        issueType: 'incorrect_info',
        details: 'The business address is incorrect',
        status: 'pending'
      };
      
      const result = issueReportSchema.safeParse(validReport);
      expect(result.success).toBe(true);
    });
    
    it('should validate all status types', () => {
      const statuses = ['pending', 'in_progress', 'resolved', 'rejected'];
      
      statuses.forEach(status => {
        const report = {
          businessId: 1,
          reportedBy: 2,
          issueType: 'incorrect_info',
          details: 'Test details',
          status
        };
        
        const result = issueReportSchema.safeParse(report);
        expect(result.success).toBe(true);
      });
    });
    
    it('should reject invalid status', () => {
      const invalidReport = {
        businessId: 1,
        reportedBy: 2,
        issueType: 'incorrect_info',
        details: 'Test details',
        status: 'invalid_status' // Invalid status
      };
      
      const result = issueReportSchema.safeParse(invalidReport);
      expect(result.success).toBe(false);
    });
  });
  
  describe('Rating Schema', () => {
    it('should validate a valid rating', () => {
      const validRating = {
        businessId: 1,
        userId: 2,
        rating: 4,
        comment: 'Great service!'
      };
      
      const result = ratingSchema.safeParse(validRating);
      expect(result.success).toBe(true);
    });
    
    it('should validate rating without comment', () => {
      const ratingNoComment = {
        businessId: 1,
        userId: 2,
        rating: 5
      };
      
      const result = ratingSchema.safeParse(ratingNoComment);
      expect(result.success).toBe(true);
    });
    
    it('should reject rating outside allowed range', () => {
      // Test too low
      const tooLowRating = {
        businessId: 1,
        userId: 2,
        rating: 0 // Below minimum of 1
      };
      
      const lowResult = ratingSchema.safeParse(tooLowRating);
      expect(lowResult.success).toBe(false);
      
      // Test too high
      const tooHighRating = {
        businessId: 1,
        userId: 2,
        rating: 6 // Above maximum of 5
      };
      
      const highResult = ratingSchema.safeParse(tooHighRating);
      expect(highResult.success).toBe(false);
    });
  });
});