import { defineConfig } from '@playwright/test'

// Dedicated built-app origin: no existing dev/global setup, D1 or remote mutations.
export default defineConfig({
  testDir: './tests/pwa',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  reporter: [['list'], ['json', { outputFile: '/private/tmp/map5-evidence/browser-results.json' }]],
  outputDir: '/private/tmp/map5-evidence/browser-artifacts',
  use: {
    baseURL: 'http://localhost:4175',
    viewport: { width: 320, height: 740 },
    browserName: 'chromium',
    channel: 'chrome',
    trace: 'on',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node tests/pwa/build-harness.mjs && node tests/pwa/preview-server.mjs',
    url: 'http://localhost:4175',
    reuseExistingServer: false,
  },
})
