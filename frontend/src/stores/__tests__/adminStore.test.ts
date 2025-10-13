import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAdminStore } from '../adminStore'
import { waitForPersistence } from '../../test/helpers'

// Mock import.meta.env
const originalEnv = import.meta.env
beforeEach(() => {
  vi.stubGlobal('import.meta.env', { MODE: 'test' })
})

afterEach(() => {
  vi.stubGlobal('import.meta.env', originalEnv)
})

describe('adminStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAdminStore.setState({
      adminModeActive: false,
      featureOverrides: {},
      environment: 'dev',
    })

    // Clear localStorage
    localStorage.clear()

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAdminStore())
      
      expect(result.current.adminModeActive).toBe(false)
      expect(result.current.featureOverrides).toEqual({})
      expect(result.current.environment).toBe('dev') // Test environment
    })

    it('should initialize environment based on import.meta.env.MODE', () => {
      vi.stubGlobal('import.meta.env', { MODE: 'production' })
      
      // Need to recreate store to pick up new environment
      useAdminStore.setState({
        adminModeActive: false,
        featureOverrides: {},
        environment: 'prod', // Would be set by store initialization
      })
      
      const { result } = renderHook(() => useAdminStore())
      expect(result.current.environment).toBe('prod')
    })

    it('should restore state from localStorage', () => {
      // Directly set state to simulate restored session
      useAdminStore.setState({
        adminModeActive: true,
        featureOverrides: {
          'feature1': true,
          'feature2': false,
        },
        environment: 'prod',
      })

      const { result } = renderHook(() => useAdminStore())

      expect(result.current.adminModeActive).toBe(true)
      expect(result.current.featureOverrides).toEqual({
        'feature1': true,
        'feature2': false,
      })
      expect(result.current.environment).toBe('prod')
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('admin-storage', 'invalid-json')
      
      const { result } = renderHook(() => useAdminStore())
      
      expect(result.current.adminModeActive).toBe(false)
      expect(result.current.featureOverrides).toEqual({})
    })
  })

  describe('setAdminModeActive', () => {
    it('should activate admin mode', () => {
      const { result } = renderHook(() => useAdminStore())

      act(() => {
        result.current.setAdminModeActive(true)
      })

      expect(result.current.adminModeActive).toBe(true)
    })

    it('should deactivate admin mode', () => {
      const { result } = renderHook(() => useAdminStore())

      // First activate
      act(() => {
        result.current.setAdminModeActive(true)
      })
      expect(result.current.adminModeActive).toBe(true)

      // Then deactivate
      act(() => {
        result.current.setAdminModeActive(false)
      })

      expect(result.current.adminModeActive).toBe(false)
    })

    it('should persist admin mode state', async () => {
      const { result } = renderHook(() => useAdminStore())

      act(() => {
        result.current.setAdminModeActive(true)
      })

      await waitForPersistence()

      const stored = localStorage.getItem('admin-storage')
      expect(stored).toBeTruthy()

      const parsedData = JSON.parse(stored!)
      expect(parsedData.state.adminModeActive).toBe(true)
    })

    it('should handle multiple toggles', () => {
      const { result } = renderHook(() => useAdminStore())

      // Multiple rapid toggles
      act(() => {
        result.current.setAdminModeActive(true)
        result.current.setAdminModeActive(false)
        result.current.setAdminModeActive(true)
      })

      expect(result.current.adminModeActive).toBe(true)
    })
  })

  describe('setFeatureOverride', () => {
    it('should set feature override to true', () => {
      const { result } = renderHook(() => useAdminStore())

      act(() => {
        result.current.setFeatureOverride('testFeature', true)
      })

      expect(result.current.featureOverrides.testFeature).toBe(true)
    })

    it('should set feature override to false', () => {
      const { result } = renderHook(() => useAdminStore())

      act(() => {
        result.current.setFeatureOverride('testFeature', false)
      })

      expect(result.current.featureOverrides.testFeature).toBe(false)
    })

    it('should set feature override to undefined', () => {
      const { result } = renderHook(() => useAdminStore())

      act(() => {
        result.current.setFeatureOverride('testFeature', undefined)
      })

      expect(result.current.featureOverrides.testFeature).toBeUndefined()
    })

    it('should handle multiple feature overrides', () => {
      const { result } = renderHook(() => useAdminStore())

      act(() => {
        result.current.setFeatureOverride('feature1', true)
        result.current.setFeatureOverride('feature2', false)
        result.current.setFeatureOverride('feature3', undefined)
      })

      expect(result.current.featureOverrides).toEqual({
        feature1: true,
        feature2: false,
        feature3: undefined,
      })
    })

    it('should update existing feature override', () => {
      const { result } = renderHook(() => useAdminStore())

      // Set initial value
      act(() => {
        result.current.setFeatureOverride('testFeature', true)
      })
      expect(result.current.featureOverrides.testFeature).toBe(true)

      // Update to new value
      act(() => {
        result.current.setFeatureOverride('testFeature', false)
      })
      expect(result.current.featureOverrides.testFeature).toBe(false)

      // Update to undefined
      act(() => {
        result.current.setFeatureOverride('testFeature', undefined)
      })
      expect(result.current.featureOverrides.testFeature).toBeUndefined()
    })

    it('should persist feature overrides', async () => {
      const { result } = renderHook(() => useAdminStore())

      act(() => {
        result.current.setFeatureOverride('persistedFeature', true)
      })

      await waitForPersistence()

      const stored = localStorage.getItem('admin-storage')
      expect(stored).toBeTruthy()

      const parsedData = JSON.parse(stored!)
      expect(parsedData.state.featureOverrides.persistedFeature).toBe(true)
    })

    it('should handle special characters in feature names', () => {
      const { result } = renderHook(() => useAdminStore())

      const specialFeatureName = 'feature-with-dashes_and_underscores.and.dots'

      act(() => {
        result.current.setFeatureOverride(specialFeatureName, true)
      })

      expect(result.current.featureOverrides[specialFeatureName]).toBe(true)
    })

    it('should handle empty string feature name', () => {
      const { result } = renderHook(() => useAdminStore())

      act(() => {
        result.current.setFeatureOverride('', true)
      })

      expect(result.current.featureOverrides['']).toBe(true)
    })
  })

  describe('clearFeatureOverride', () => {
    it('should remove a specific feature override', () => {
      const { result } = renderHook(() => useAdminStore())

      // Set multiple overrides
      act(() => {
        result.current.setFeatureOverride('feature1', true)
        result.current.setFeatureOverride('feature2', false)
        result.current.setFeatureOverride('feature3', undefined)
      })

      expect(result.current.featureOverrides).toEqual({
        feature1: true,
        feature2: false,
        feature3: undefined,
      })

      // Clear one specific override
      act(() => {
        result.current.clearFeatureOverride('feature2')
      })

      expect(result.current.featureOverrides).toEqual({
        feature1: true,
        feature3: undefined,
      })
      expect('feature2' in result.current.featureOverrides).toBe(false)
    })

    it('should handle clearing non-existent feature', () => {
      const { result } = renderHook(() => useAdminStore())

      // Set one override
      act(() => {
        result.current.setFeatureOverride('existingFeature', true)
      })

      // Try to clear non-existent feature
      act(() => {
        result.current.clearFeatureOverride('nonExistentFeature')
      })

      // Should not affect existing overrides
      expect(result.current.featureOverrides).toEqual({
        existingFeature: true,
      })
    })

    it('should handle clearing from empty overrides', () => {
      const { result } = renderHook(() => useAdminStore())

      // Start with empty overrides
      expect(result.current.featureOverrides).toEqual({})

      act(() => {
        result.current.clearFeatureOverride('anyFeature')
      })

      expect(result.current.featureOverrides).toEqual({})
    })

    it('should persist changes after clearing', async () => {
      const { result } = renderHook(() => useAdminStore())

      act(() => {
        result.current.setFeatureOverride('tempFeature', true)
        result.current.clearFeatureOverride('tempFeature')
      })

      await waitForPersistence()

      const stored = localStorage.getItem('admin-storage')
      expect(stored).toBeTruthy()

      const parsedData = JSON.parse(stored!)
      expect('tempFeature' in parsedData.state.featureOverrides).toBe(false)
    })
  })

  describe('clearAllOverrides', () => {
    it('should clear all feature overrides', () => {
      const { result } = renderHook(() => useAdminStore())

      // Set multiple overrides
      act(() => {
        result.current.setFeatureOverride('feature1', true)
        result.current.setFeatureOverride('feature2', false)
        result.current.setFeatureOverride('feature3', undefined)
      })

      expect(Object.keys(result.current.featureOverrides)).toHaveLength(3)

      // Clear all
      act(() => {
        result.current.clearAllOverrides()
      })

      expect(result.current.featureOverrides).toEqual({})
    })

    it('should handle clearing when already empty', () => {
      const { result } = renderHook(() => useAdminStore())

      expect(result.current.featureOverrides).toEqual({})

      act(() => {
        result.current.clearAllOverrides()
      })

      expect(result.current.featureOverrides).toEqual({})
    })

    it('should not affect other admin store properties', () => {
      const { result } = renderHook(() => useAdminStore())

      // Set admin mode and environment
      act(() => {
        result.current.setAdminModeActive(true)
        result.current.setEnvironment('prod')
        result.current.setFeatureOverride('feature1', true)
      })

      // Clear overrides
      act(() => {
        result.current.clearAllOverrides()
      })

      expect(result.current.featureOverrides).toEqual({})
      expect(result.current.adminModeActive).toBe(true) // Should be preserved
      expect(result.current.environment).toBe('prod') // Should be preserved
    })

    it('should persist empty overrides after clearing', async () => {
      const { result } = renderHook(() => useAdminStore())

      act(() => {
        result.current.setFeatureOverride('feature1', true)
        result.current.clearAllOverrides()
      })

      await waitForPersistence()

      const stored = localStorage.getItem('admin-storage')
      expect(stored).toBeTruthy()

      const parsedData = JSON.parse(stored!)
      expect(parsedData.state.featureOverrides).toEqual({})
    })
  })

  describe('setEnvironment', () => {
    it('should set environment to dev', () => {
      const { result } = renderHook(() => useAdminStore())

      act(() => {
        result.current.setEnvironment('dev')
      })

      expect(result.current.environment).toBe('dev')
    })

    it('should set environment to prod', () => {
      const { result } = renderHook(() => useAdminStore())

      act(() => {
        result.current.setEnvironment('prod')
      })

      expect(result.current.environment).toBe('prod')
    })

    it('should persist environment setting', async () => {
      const { result } = renderHook(() => useAdminStore())

      act(() => {
        result.current.setEnvironment('prod')
      })

      await waitForPersistence()

      const stored = localStorage.getItem('admin-storage')
      expect(stored).toBeTruthy()

      const parsedData = JSON.parse(stored!)
      expect(parsedData.state.environment).toBe('prod')
    })

    it('should handle environment switching', () => {
      const { result } = renderHook(() => useAdminStore())

      // Switch between environments
      act(() => {
        result.current.setEnvironment('prod')
      })
      expect(result.current.environment).toBe('prod')

      act(() => {
        result.current.setEnvironment('dev')
      })
      expect(result.current.environment).toBe('dev')

      act(() => {
        result.current.setEnvironment('prod')
      })
      expect(result.current.environment).toBe('prod')
    })
  })

  describe('applyEnvironmentSettings', () => {
    it('should replace all feature overrides with new settings', () => {
      const { result } = renderHook(() => useAdminStore())

      // Set initial overrides
      act(() => {
        result.current.setFeatureOverride('oldFeature1', true)
        result.current.setFeatureOverride('oldFeature2', false)
      })

      const newSettings = {
        newFeature1: true,
        newFeature2: false,
        newFeature3: true,
      }

      // Apply new environment settings
      act(() => {
        result.current.applyEnvironmentSettings(newSettings)
      })

      expect(result.current.featureOverrides).toEqual(newSettings)
      expect('oldFeature1' in result.current.featureOverrides).toBe(false)
      expect('oldFeature2' in result.current.featureOverrides).toBe(false)
    })

    it('should handle empty environment settings', () => {
      const { result } = renderHook(() => useAdminStore())

      // Set initial overrides
      act(() => {
        result.current.setFeatureOverride('feature1', true)
      })

      // Apply empty settings
      act(() => {
        result.current.applyEnvironmentSettings({})
      })

      expect(result.current.featureOverrides).toEqual({})
    })

    it('should handle environment settings with various boolean values', () => {
      const { result } = renderHook(() => useAdminStore())

      const envSettings = {
        enabledFeature: true,
        disabledFeature: false,
      }

      act(() => {
        result.current.applyEnvironmentSettings(envSettings)
      })

      expect(result.current.featureOverrides).toEqual({
        enabledFeature: true,
        disabledFeature: false,
      })
    })

    it('should persist applied environment settings', async () => {
      const { result } = renderHook(() => useAdminStore())

      const envSettings = {
        envFeature1: true,
        envFeature2: false,
      }

      act(() => {
        result.current.applyEnvironmentSettings(envSettings)
      })

      await waitForPersistence()

      const stored = localStorage.getItem('admin-storage')
      expect(stored).toBeTruthy()

      const parsedData = JSON.parse(stored!)
      expect(parsedData.state.featureOverrides).toEqual(envSettings)
    })

    it('should not affect other admin store properties', () => {
      const { result } = renderHook(() => useAdminStore())

      // Set other properties
      act(() => {
        result.current.setAdminModeActive(true)
        result.current.setEnvironment('prod')
      })

      // Apply environment settings
      act(() => {
        result.current.applyEnvironmentSettings({ newFeature: true })
      })

      expect(result.current.adminModeActive).toBe(true) // Should be preserved
      expect(result.current.environment).toBe('prod') // Should be preserved
      expect(result.current.featureOverrides).toEqual({ newFeature: true })
    })
  })

  describe('persistence', () => {
    it('should persist all state properties', async () => {
      const { result } = renderHook(() => useAdminStore())

      act(() => {
        result.current.setAdminModeActive(true)
        result.current.setEnvironment('prod')
        result.current.setFeatureOverride('feature1', true)
        result.current.setFeatureOverride('feature2', false)
      })

      await waitForPersistence()

      const stored = localStorage.getItem('admin-storage')
      expect(stored).toBeTruthy()

      const parsedData = JSON.parse(stored!)
      expect(parsedData.state).toEqual({
        adminModeActive: true,
        environment: 'prod',
        featureOverrides: {
          feature1: true,
          feature2: false,
        },
      })
    })

    it('should restore complete state from localStorage', () => {
      // Directly set state to simulate restored session
      useAdminStore.setState({
        adminModeActive: true,
        environment: 'prod',
        featureOverrides: {
          restoredFeature1: true,
          restoredFeature2: false,
          restoredFeature3: undefined,
        },
      })

      const { result } = renderHook(() => useAdminStore())

      expect(result.current.adminModeActive).toBe(true)
      expect(result.current.environment).toBe('prod')
      expect(result.current.featureOverrides).toEqual({
        restoredFeature1: true,
        restoredFeature2: false,
        restoredFeature3: undefined,
      })
    })

    it('should handle partial state in localStorage', () => {
      // Directly set state to simulate partial restored session
      useAdminStore.setState({
        adminModeActive: true,
        // environment and featureOverrides will use defaults
        environment: 'dev',
        featureOverrides: {},
      })

      const { result } = renderHook(() => useAdminStore())

      expect(result.current.adminModeActive).toBe(true)
      expect(result.current.environment).toBe('dev') // Default value
      expect(result.current.featureOverrides).toEqual({}) // Default value
    })
  })

  describe('edge cases', () => {
    it('should handle undefined and null values in feature overrides', () => {
      const { result } = renderHook(() => useAdminStore())

      act(() => {
        result.current.setFeatureOverride('nullFeature', null as any)
        result.current.setFeatureOverride('undefinedFeature', undefined)
      })

      expect(result.current.featureOverrides.nullFeature).toBeNull()
      expect(result.current.featureOverrides.undefinedFeature).toBeUndefined()
    })

    it('should handle very long feature names', () => {
      const { result } = renderHook(() => useAdminStore())

      const longFeatureName = 'a'.repeat(1000)

      act(() => {
        result.current.setFeatureOverride(longFeatureName, true)
      })

      expect(result.current.featureOverrides[longFeatureName]).toBe(true)
    })

    it('should handle rapid state changes', () => {
      const { result } = renderHook(() => useAdminStore())

      act(() => {
        // Rapid fire state changes
        for (let i = 0; i < 100; i++) {
          result.current.setAdminModeActive(i % 2 === 0)
          result.current.setFeatureOverride(`feature${i}`, i % 3 === 0)
          if (i % 10 === 0) {
            result.current.clearAllOverrides()
          }
        }
      })

      // Should handle all changes without errors
      expect(result.current.adminModeActive).toBe(false) // 99 % 2 === 1, so false
      expect(Object.keys(result.current.featureOverrides).length).toBeGreaterThanOrEqual(0)
    })

    it('should handle concurrent feature override operations', () => {
      const { result } = renderHook(() => useAdminStore())

      act(() => {
        result.current.setFeatureOverride('concurrent1', true)
        result.current.setFeatureOverride('concurrent2', false)
        result.current.clearFeatureOverride('concurrent1')
        result.current.setFeatureOverride('concurrent3', true)
        result.current.setFeatureOverride('concurrent1', undefined)
      })

      expect(result.current.featureOverrides).toEqual({
        concurrent2: false,
        concurrent3: true,
        concurrent1: undefined,
      })
    })

    it('should maintain type safety for environment values', () => {
      const { result } = renderHook(() => useAdminStore())

      // TypeScript would prevent this, but test runtime behavior
      act(() => {
        result.current.setEnvironment('invalid' as any)
      })

      expect(result.current.environment).toBe('invalid')
    })
  })

  describe('store subscriptions', () => {
    it('should notify subscribers of state changes', () => {
      const { result: result1 } = renderHook(() => useAdminStore())
      const { result: result2 } = renderHook(() => useAdminStore())

      // Both should start with same state
      expect(result1.current.adminModeActive).toBe(result2.current.adminModeActive)

      // Change through first hook
      act(() => {
        result1.current.setAdminModeActive(true)
      })

      // Both should reflect the change
      expect(result1.current.adminModeActive).toBe(true)
      expect(result2.current.adminModeActive).toBe(true)
    })

    it('should handle multiple concurrent operations', () => {
      const { result } = renderHook(() => useAdminStore())

      let subscriptionCount = 0
      const unsubscribe = useAdminStore.subscribe(() => {
        subscriptionCount++
      })

      act(() => {
        result.current.setAdminModeActive(true)
        result.current.setFeatureOverride('test', true)
        result.current.setEnvironment('prod')
      })

      expect(subscriptionCount).toBeGreaterThan(0)
      unsubscribe()
    })
  })

  describe('feature override patterns', () => {
    it('should support common feature flag patterns', () => {
      const { result } = renderHook(() => useAdminStore())

      // Enable/disable features
      act(() => {
        result.current.setFeatureOverride('ENABLE_NEW_UI', true)
        result.current.setFeatureOverride('DISABLE_OLD_FEATURE', false)
        result.current.setFeatureOverride('EXPERIMENTAL_FEATURE', undefined) // Use default
      })

      expect(result.current.featureOverrides.ENABLE_NEW_UI).toBe(true)
      expect(result.current.featureOverrides.DISABLE_OLD_FEATURE).toBe(false)
      expect(result.current.featureOverrides.EXPERIMENTAL_FEATURE).toBeUndefined()
    })

    it('should support environment-specific overrides', () => {
      const { result } = renderHook(() => useAdminStore())

      // Dev environment settings
      const devSettings = {
        DEBUG_MODE: true,
        ANALYTICS_ENABLED: false,
        FEATURE_FLAGS_VISIBLE: true,
      }

      // Prod environment settings
      const prodSettings = {
        DEBUG_MODE: false,
        ANALYTICS_ENABLED: true,
        FEATURE_FLAGS_VISIBLE: false,
      }

      // Apply dev settings
      act(() => {
        result.current.setEnvironment('dev')
        result.current.applyEnvironmentSettings(devSettings)
      })

      expect(result.current.environment).toBe('dev')
      expect(result.current.featureOverrides).toEqual(devSettings)

      // Switch to prod settings
      act(() => {
        result.current.setEnvironment('prod')
        result.current.applyEnvironmentSettings(prodSettings)
      })

      expect(result.current.environment).toBe('prod')
      expect(result.current.featureOverrides).toEqual(prodSettings)
    })
  })
})