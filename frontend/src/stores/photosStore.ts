import { create } from 'zustand'
import type { ReviewPhoto } from '../../../shared/types'

interface PhotosCache {
  [cafeId: number]: {
    photos: ReviewPhoto[]
  }
}

interface PhotosStore {
  cache: PhotosCache
  setPhotos: (cafeId: number, photos: ReviewPhoto[]) => void
  getPhotos: (cafeId: number) => ReviewPhoto[] | null
  invalidateCache: (cafeId: number) => void
  isCacheValid: (cafeId: number) => boolean
}

export const usePhotosStore = create<PhotosStore>((set, get) => ({
  cache: {},

  setPhotos: (cafeId, photos) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [cafeId]: {
          photos
        }
      }
    }))
  },

  getPhotos: (cafeId) => {
    const cached = get().cache[cafeId]
    return cached?.photos || null
  },

  invalidateCache: (cafeId) => {
    set((state) => {
      const newCache = { ...state.cache }
      delete newCache[cafeId]
      return { cache: newCache }
    })
  },

  isCacheValid: (cafeId) => {
    const cached = get().cache[cafeId]
    return !!cached
  }
}))
