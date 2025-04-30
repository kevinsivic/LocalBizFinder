import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startCsvWatcher } from '../../server/csv-watcher';
import path from 'path';

// Mock the required dependencies
vi.mock('chokidar', () => {
  const mockWatcher = {
    on: vi.fn().mockReturnThis(),
    add: vi.fn()
  };
  
  return {
    watch: vi.fn().mockReturnValue(mockWatcher)
  };
});

vi.mock('csv-parser', () => {
  return {
    default: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      end: vi.fn()
    }))
  };
});

vi.mock('fs', () => {
  return {
    createReadStream: vi.fn(() => ({
      pipe: vi.fn(() => ({
        on: vi.fn()
      }))
    })),
    unlinkSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(true)
  };
});

vi.mock('../../server/storage', () => {
  return {
    storage: {
      createBusiness: vi.fn().mockResolvedValue({ id: 1, name: 'Imported Business' })
    }
  };
});

vi.mock('../../server/geocoding-server', () => {
  return {
    geocodeAddressWithFallback: vi.fn().mockResolvedValue({ lat: 37.7749, lon: -122.4194 })
  };
});

// Mock console logging
vi.mock('../../server/vite', () => {
  return {
    log: vi.fn()
  };
});

describe('CSV Watcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should create a watcher for the specified directory', () => {
    // Start the watcher
    const watcher = startCsvWatcher();
    
    // Verify that chokidar.watch was called with the expected path
    const chokidar = require('chokidar');
    expect(chokidar.watch).toHaveBeenCalled();
    expect(chokidar.watch.mock.calls[0][0]).toContain('csv');
    
    // Verify that event handlers were registered
    const mockWatcher = chokidar.watch.mock.results[0].value;
    expect(mockWatcher.on).toHaveBeenCalledWith('add', expect.any(Function));
    
    // Return the watcher
    expect(watcher).toBeDefined();
  });
  
  it('should handle CSV file processing when a file is added', async () => {
    // Get the mocked chokidar watcher
    const chokidar = require('chokidar');
    const watcher = startCsvWatcher();
    const mockWatcher = chokidar.watch.mock.results[0].value;
    
    // Get the 'add' event handler
    const onAddHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')[1];
    
    // Simulate file added by calling the handler
    const testFilePath = path.join('data', 'csv', 'test.csv');
    await onAddHandler(testFilePath);
    
    // Verify that the file processing attempted to read the file
    const fs = require('fs');
    expect(fs.createReadStream).toHaveBeenCalledWith(testFilePath);
    
    // Verify that the geocoding service was attempted to be used
    const geocoding = require('../../server/geocoding-server');
    expect(geocoding.geocodeAddressWithFallback).toHaveBeenCalled();
    
    // Verify logging occurred
    const { log } = require('../../server/vite');
    expect(log).toHaveBeenCalled();
  });
  
  // Test error handling
  it('should handle errors during CSV processing', async () => {
    // Mock an error in createReadStream
    const fs = require('fs');
    fs.createReadStream.mockImplementationOnce(() => {
      throw new Error('File read error');
    });
    
    // Get the mocked chokidar watcher
    const chokidar = require('chokidar');
    const watcher = startCsvWatcher();
    const mockWatcher = chokidar.watch.mock.results[0].value;
    
    // Get the 'add' event handler
    const onAddHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'add')[1];
    
    // Simulate file added by calling the handler
    const testFilePath = path.join('data', 'csv', 'test.csv');
    await onAddHandler(testFilePath);
    
    // Verify error was logged
    const { log } = require('../../server/vite');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Error'), 'csv-watcher');
  });
});