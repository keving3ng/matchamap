/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
    },
  },
  test: {
    name: 'integration',
    globals: true,
    environment: 'node', // Node environment for API testing
    testTimeout: 30000, // Longer timeout for integration tests
    hookTimeout: 10000,
    setupFiles: ['./tests/integration/setup.ts'],
    include: ['tests/integration/**/*.spec.ts'],
    // Output JUnit XML for CI
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: {
      junit: './test-results/integration-junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['tests/integration/**/*'],
      exclude: [
        'node_modules/',
        'tests/integration/setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
})