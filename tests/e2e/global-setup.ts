import { chromium, type FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...')
  
  // Launch browser for setup tasks
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Wait for frontend to be available
    console.log('⏳ Waiting for frontend to be ready...')
    await page.goto(config.webServer?.[0]?.url || 'http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 60000
    })
    
    // Wait for backend to be available
    console.log('⏳ Waiting for backend to be ready...')
    await page.goto(`${config.webServer?.[1]?.url || 'http://localhost:8787'}/api/health`, {
      waitUntil: 'networkidle',
      timeout: 60000
    })
    
    // Verify basic functionality
    await page.goto(config.webServer?.[0]?.url || 'http://localhost:5173')
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 30000 })
    
    console.log('✅ Global setup complete - services are ready')
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup