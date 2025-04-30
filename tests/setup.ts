import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Extends Vitest's expect method with methods from react-testing-library
expect.extend({});

// Runs a cleanup after each test case
afterEach(() => {
  cleanup();
});