import { create } from 'zustand'
import cafeData from '../data/cafes.json'
import type { CafeData } from '../types'

interface DataStore {
  allCafes: CafeData['cafes']
  feedItems: CafeData['feed']
  eventItems: CafeData['events']
}

/**
 * Store for static data loaded from JSON
 * Replaces DataContext - no provider needed, just import and use
 */
export const useDataStore = create<DataStore>(() => {
  const { cafes: allCafes, feed: feedItems, events: eventItems } = cafeData as CafeData

  return {
    allCafes,
    feedItems,
    eventItems,
  }
})
