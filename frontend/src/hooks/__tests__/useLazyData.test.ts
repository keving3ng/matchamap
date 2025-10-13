import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLazyData } from '../useLazyData'

describe('useLazyData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call fetchFunction when data is not fetched', () => {
    const mockFetchFunction = vi.fn()
    const isFetched = false

    renderHook(() => useLazyData(mockFetchFunction, isFetched))

    expect(mockFetchFunction).toHaveBeenCalledTimes(1)
  })

  it('should not call fetchFunction when data is already fetched', () => {
    const mockFetchFunction = vi.fn()
    const isFetched = true

    renderHook(() => useLazyData(mockFetchFunction, isFetched))

    expect(mockFetchFunction).not.toHaveBeenCalled()
  })

  it('should call fetchFunction again when isFetched changes to false', () => {
    const mockFetchFunction = vi.fn()

    const { rerender } = renderHook(
      ({ isFetched }) => useLazyData(mockFetchFunction, isFetched),
      { initialProps: { isFetched: true } }
    )

    expect(mockFetchFunction).not.toHaveBeenCalled()

    // Change isFetched to false
    rerender({ isFetched: false })

    expect(mockFetchFunction).toHaveBeenCalledTimes(1)
  })

  it('should not call fetchFunction again when isFetched changes to true', () => {
    const mockFetchFunction = vi.fn()

    const { rerender } = renderHook(
      ({ isFetched }) => useLazyData(mockFetchFunction, isFetched),
      { initialProps: { isFetched: false } }
    )

    expect(mockFetchFunction).toHaveBeenCalledTimes(1)

    // Change isFetched to true
    rerender({ isFetched: true })

    // Should not call again
    expect(mockFetchFunction).toHaveBeenCalledTimes(1)
  })

  it('should call fetchFunction when fetchFunction reference changes', () => {
    const mockFetchFunction1 = vi.fn()
    const mockFetchFunction2 = vi.fn()
    const isFetched = false

    const { rerender } = renderHook(
      ({ fetchFunction }) => useLazyData(fetchFunction, isFetched),
      { initialProps: { fetchFunction: mockFetchFunction1 } }
    )

    expect(mockFetchFunction1).toHaveBeenCalledTimes(1)
    expect(mockFetchFunction2).not.toHaveBeenCalled()

    // Change fetchFunction reference
    rerender({ fetchFunction: mockFetchFunction2 })

    expect(mockFetchFunction1).toHaveBeenCalledTimes(1)
    expect(mockFetchFunction2).toHaveBeenCalledTimes(1)
  })

  it('should not call fetchFunction when fetchFunction reference changes but data is fetched', () => {
    const mockFetchFunction1 = vi.fn()
    const mockFetchFunction2 = vi.fn()
    const isFetched = true

    const { rerender } = renderHook(
      ({ fetchFunction }) => useLazyData(fetchFunction, isFetched),
      { initialProps: { fetchFunction: mockFetchFunction1 } }
    )

    expect(mockFetchFunction1).not.toHaveBeenCalled()

    // Change fetchFunction reference
    rerender({ fetchFunction: mockFetchFunction2 })

    expect(mockFetchFunction1).not.toHaveBeenCalled()
    expect(mockFetchFunction2).not.toHaveBeenCalled()
  })

  it('should handle async fetchFunction', async () => {
    const mockAsyncFetchFunction = vi.fn().mockResolvedValue(undefined)
    const isFetched = false

    renderHook(() => useLazyData(mockAsyncFetchFunction, isFetched))

    expect(mockAsyncFetchFunction).toHaveBeenCalledTimes(1)
    
    // Wait for async function to complete
    await vi.waitFor(() => {
      expect(mockAsyncFetchFunction).toHaveBeenCalledTimes(1)
    })
  })

  it('should handle fetchFunction that throws an error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const mockFetchFunction = vi.fn().mockImplementation(() => {
      throw new Error('Fetch failed')
    })
    const isFetched = false

    // Should not throw error, just call the function and log error
    expect(() => {
      renderHook(() => useLazyData(mockFetchFunction, isFetched))
    }).not.toThrow()

    expect(mockFetchFunction).toHaveBeenCalledTimes(1)
    expect(consoleSpy).toHaveBeenCalledWith('Error in lazy data fetch:', expect.any(Error))

    consoleSpy.mockRestore()
  })

  it('should handle async fetchFunction that rejects', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const mockAsyncFetchFunction = vi.fn().mockRejectedValue(new Error('Async fetch failed'))
    const isFetched = false

    expect(() => {
      renderHook(() => useLazyData(mockAsyncFetchFunction, isFetched))
    }).not.toThrow()

    expect(mockAsyncFetchFunction).toHaveBeenCalledTimes(1)

    // Wait for promise to reject and be caught
    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error in lazy data fetch:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('should work with multiple instances of the hook', () => {
    const mockFetchFunction1 = vi.fn()
    const mockFetchFunction2 = vi.fn()

    renderHook(() => useLazyData(mockFetchFunction1, false))
    renderHook(() => useLazyData(mockFetchFunction2, true))

    expect(mockFetchFunction1).toHaveBeenCalledTimes(1)
    expect(mockFetchFunction2).not.toHaveBeenCalled()
  })

  it('should handle boolean values correctly', () => {
    const mockFetchFunction = vi.fn()

    // Test with explicit true
    const { rerender } = renderHook(
      ({ isFetched }) => useLazyData(mockFetchFunction, isFetched),
      { initialProps: { isFetched: true } }
    )
    expect(mockFetchFunction).not.toHaveBeenCalled()

    // Test with explicit false
    rerender({ isFetched: false })
    expect(mockFetchFunction).toHaveBeenCalledTimes(1)

    // Test with truthy value (should be treated as true)
    mockFetchFunction.mockClear()
    rerender({ isFetched: 'truthy' as any })
    expect(mockFetchFunction).not.toHaveBeenCalled()

    // Test with falsy value (should be treated as false)
    rerender({ isFetched: 0 as any })
    expect(mockFetchFunction).toHaveBeenCalledTimes(1)
  })

  it('should handle stable fetchFunction reference correctly', () => {
    const mockFetchFunction = vi.fn()
    const isFetched = false

    const { rerender } = renderHook(() => useLazyData(mockFetchFunction, isFetched))

    expect(mockFetchFunction).toHaveBeenCalledTimes(1)

    // Rerender with same function reference and same isFetched
    rerender()

    // Should not call again since neither dependency changed
    expect(mockFetchFunction).toHaveBeenCalledTimes(1)
  })

  it('should work with void and Promise<void> return types', () => {
    const voidFetchFunction = vi.fn(() => {}) // returns void
    const promiseVoidFetchFunction = vi.fn(() => Promise.resolve()) // returns Promise<void>

    renderHook(() => useLazyData(voidFetchFunction, false))
    renderHook(() => useLazyData(promiseVoidFetchFunction, false))

    expect(voidFetchFunction).toHaveBeenCalledTimes(1)
    expect(promiseVoidFetchFunction).toHaveBeenCalledTimes(1)
  })
})