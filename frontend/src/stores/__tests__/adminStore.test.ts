import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAdminStore } from '../adminStore'
import { waitForPersistence } from '../../test/helpers'

const originalEnv = import.meta.env

beforeEach(() => {
  vi.stubGlobal('import.meta.env', { MODE: 'test' })
})

afterEach(() => {
  vi.stubGlobal('import.meta.env', originalEnv)
})

describe('adminStore', () => {
  beforeEach(() => {
    useAdminStore.setState({
      adminModeActive: false,
      featureOverrides: {},
      environment: 'dev',
    })
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('defaults and restores overridden state', () => {
    const { result } = renderHook(() => useAdminStore())
    expect(result.current.adminModeActive).toBe(false)
    expect(result.current.featureOverrides).toEqual({})

    act(() => {
      useAdminStore.setState({
        adminModeActive: true,
        featureOverrides: { a: true },
        environment: 'prod',
      })
    })
    const { result: r2 } = renderHook(() => useAdminStore())
    expect(r2.current.adminModeActive).toBe(true)
    expect(r2.current.featureOverrides.a).toBe(true)
  })

  it('setAdminModeActive toggles and persists', async () => {
    const { result } = renderHook(() => useAdminStore())
    act(() => result.current.setAdminModeActive(true))
    expect(result.current.adminModeActive).toBe(true)
    await waitForPersistence()
    expect(JSON.parse(localStorage.getItem('admin-storage')!).state.adminModeActive).toBe(true)
  })

  it('setFeatureOverride, clearFeatureOverride, clearAllOverrides', () => {
    const { result } = renderHook(() => useAdminStore())
    act(() => {
      result.current.setFeatureOverride('x', true)
      result.current.setFeatureOverride('y', false)
      result.current.setFeatureOverride('z', undefined)
    })
    expect(result.current.featureOverrides).toEqual({ x: true, y: false, z: undefined })

    act(() => result.current.clearFeatureOverride('y'))
    expect(result.current.featureOverrides.y).toBeUndefined()

    act(() => {
      result.current.setAdminModeActive(true)
      result.current.clearAllOverrides()
    })
    expect(result.current.featureOverrides).toEqual({})
    expect(result.current.adminModeActive).toBe(true)
  })

  it('setEnvironment and applyEnvironmentSettings replace overrides', () => {
    const { result } = renderHook(() => useAdminStore())
    act(() => {
      result.current.setFeatureOverride('old', true)
      result.current.applyEnvironmentSettings({ a: true, b: false })
    })
    expect(result.current.featureOverrides).toEqual({ a: true, b: false })

    act(() => {
      result.current.setEnvironment('prod')
      result.current.applyEnvironmentSettings({})
    })
    expect(result.current.environment).toBe('prod')
    expect(result.current.featureOverrides).toEqual({})
  })

  it('persists combined state', async () => {
    const { result } = renderHook(() => useAdminStore())
    act(() => {
      result.current.setAdminModeActive(true)
      result.current.setEnvironment('prod')
      result.current.setFeatureOverride('f', true)
    })
    await waitForPersistence()
    const parsed = JSON.parse(localStorage.getItem('admin-storage')!)
    expect(parsed.state.environment).toBe('prod')
    expect(parsed.state.featureOverrides.f).toBe(true)
  })

  it('two hooks see the same store', () => {
    const { result: a } = renderHook(() => useAdminStore())
    const { result: b } = renderHook(() => useAdminStore())
    act(() => a.current.setAdminModeActive(true))
    expect(b.current.adminModeActive).toBe(true)
  })
})
