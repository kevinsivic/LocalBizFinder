import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '../../client/src/hooks/use-mobile';

describe('useIsMobile Hook', () => {
  // Store original window.innerWidth
  const originalInnerWidth = window.innerWidth;
  
  // Mock add/remove event listener
  beforeEach(() => {
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');
  });
  
  // Restore original window properties after each test
  afterEach(() => {
    // Restore original window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: originalInnerWidth
    });
    
    vi.restoreAllMocks();
  });
  
  it('should return true when screen width is below mobile breakpoint', () => {
    // Set window width to mobile size (below 768px)
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 500
    });
    
    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(true);
  });
  
  it('should return false when screen width is above mobile breakpoint', () => {
    // Set window width to desktop size (above 768px)
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1024
    });
    
    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(false);
  });
  
  it('should update value when window is resized', () => {
    // Start with desktop size
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1024
    });
    
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
    
    // Simulate resize to mobile size
    act(() => {
      // Change innerWidth
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: 480
      });
      
      // Dispatch resize event
      window.dispatchEvent(new Event('resize'));
    });
    
    expect(result.current).toBe(true);
  });
  
  it('should add and remove event listeners correctly', () => {
    const { unmount } = renderHook(() => useIsMobile());
    
    // Check that listener was added
    expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    
    // Unmount the component
    unmount();
    
    // Check that listener was removed
    expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});