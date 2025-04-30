import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['./tests/**/*.test.ts', './tests/**/*.test.tsx'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['server/**/*.ts', 'client/src/**/*.tsx', 'client/src/**/*.ts', 'shared/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx', 'node_modules', 'dist']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
      '@server': path.resolve(__dirname, 'server'),
      '@tests': path.resolve(__dirname, 'tests')
    }
  }
});