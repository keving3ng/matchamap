import { beforeAll, afterAll } from 'vitest'

// Global setup for integration tests
beforeAll(async () => {
  console.log('🚀 Setting up integration test environment...')
  
  // Check if backend is running
  const backendUrl = process.env.VITE_API_URL || 'http://localhost:8787'
  
  try {
    const response = await fetch(`${backendUrl}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    })
    
    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`)
    }
    
    console.log('✅ Backend is ready for integration tests')
  } catch (error) {
    console.error('❌ Backend is not available:', error)
    console.error('Make sure to run "npm run dev:backend" before integration tests')
    throw new Error('Backend required for integration tests')
  }
})

afterAll(async () => {
  console.log('🧹 Cleaning up integration test environment...')
  
  // Add any global cleanup here
  // For example, cleanup test data, close connections, etc.
  
  console.log('✅ Integration test cleanup complete')
})

// Set longer timeouts for integration tests
// This is handled in vitest.integration.config.ts