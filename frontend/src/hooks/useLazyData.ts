import { useEffect } from 'react'

/**
 * Hook for lazy loading data on component mount with cache checking
 *
 * Implements the pattern:
 * - Check if data has been fetched (via flag)
 * - If not, call the fetch function
 * - Subsequent mounts skip fetching (data cached in store)
 *
 * @param fetchFunction - Async function to fetch data (from Zustand store)
 * @param isFetched - Boolean flag indicating if data is already fetched
 *
 * @example
 * ```tsx
 * const { fetchFeed, feedFetched } = useDataStore()
 * useLazyData(fetchFeed, feedFetched)
 * ```
 */
export function useLazyData(
  fetchFunction: () => void | Promise<void>,
  isFetched: boolean
): void {
  useEffect(() => {
    if (!isFetched) {
      try {
        const result = fetchFunction()
        // Handle promise rejections to prevent unhandled errors
        if (result && typeof result.then === 'function') {
          result.catch((error) => {
            console.error('Error in lazy data fetch:', error)
          })
        }
      } catch (error) {
        // Handle synchronous errors
        console.error('Error in lazy data fetch:', error)
      }
    }
  }, [isFetched, fetchFunction])
}
