import type { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Running global E2E test teardown...')
  
  // Clean up any global resources
  // Note: Local dev servers will be stopped automatically by Playwright
  
  console.log('✅ Global teardown complete')
}

export default globalTeardown