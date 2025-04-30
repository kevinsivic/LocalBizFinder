import { describe, it, expect } from 'vitest';
import { cn } from '../../client/src/lib/utils';

describe('Utility Functions', () => {
  describe('cn (classNames utility)', () => {
    it('should merge class names correctly', () => {
      // Simple string inputs
      expect(cn('class1', 'class2')).toBe('class1 class2');
      
      // Mix of strings and arrays
      expect(cn('class1', ['class2', 'class3'])).toBe('class1 class2 class3');
      
      // Conditional classes
      expect(cn('class1', { 'class2': true, 'class3': false })).toBe('class1 class2');
      
      // Complex nested example
      expect(cn(
        'base-class',
        ['array-class1', 'array-class2'],
        { 'conditional-true': true, 'conditional-false': false },
        undefined,
        null,
        'explicit-class'
      )).toBe('base-class array-class1 array-class2 conditional-true explicit-class');
    });
    
    it('should handle falsy values', () => {
      // Should skip falsy values
      expect(cn('class1', false, null, undefined, 0, '', 'class2')).toBe('class1 class2');
    });
    
    it('should handle objects with multiple keys', () => {
      const result = cn('base', {
        'enabled': true,
        'disabled': false,
        'active': true,
        'inactive': false
      });
      
      expect(result).toBe('base enabled active');
    });
    
    it('should handle nested arrays', () => {
      const result = cn(
        'base',
        ['level1', ['level2', ['level3']]]
      );
      
      expect(result).toBe('base level1 level2 level3');
    });
    
    it('should maintain the correct order of classes', () => {
      const result = cn(
        'first',
        'second',
        { 'third': true, 'skipped': false },
        'fourth'
      );
      
      // Order should be preserved
      expect(result).toBe('first second third fourth');
    });
    
    it('should handle empty inputs', () => {
      // Empty call should return empty string
      expect(cn()).toBe('');
      
      // Only falsy values should return empty string
      expect(cn(false, null, undefined)).toBe('');
    });
  });
});