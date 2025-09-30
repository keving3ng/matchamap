import { create } from 'zustand'
import { persist, StorageValue } from 'zustand/middleware'

// Serializable version of GeolocationCoordinates for storage
interface SerializableCoordinates {
  latitude: number
  longitude: number
  accuracy: number
  altitude: number | null
  altitudeAccuracy: number | null
  heading: number | null
  speed: number | null
}

interface LocationState {
  coordinates: GeolocationCoordinates | null
  error: GeolocationPositionError | null
  loading: boolean
  permission: PermissionState | null
  setCoordinates: (coords: GeolocationCoordinates | null) => void
  setError: (error: GeolocationPositionError | null) => void
  setLoading: (loading: boolean) => void
  setPermission: (permission: PermissionState | null) => void
  clearLocation: () => void
}

interface PersistedLocationState {
  coordinates: SerializableCoordinates | null
}

interface StoredData {
  state: PersistedLocationState
  version?: number
  timestamp: number
}

const LOCATION_MAX_AGE = 60 * 60 * 1000 // 1 hour in milliseconds

// Convert GeolocationCoordinates to serializable object
const toSerializable = (coords: GeolocationCoordinates | null): SerializableCoordinates | null => {
  if (!coords) return null
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
    altitude: coords.altitude,
    altitudeAccuracy: coords.altitudeAccuracy,
    heading: coords.heading,
    speed: coords.speed,
  }
}

// Convert serializable object back to GeolocationCoordinates-like object
const fromSerializable = (coords: SerializableCoordinates | null): GeolocationCoordinates | null => {
  if (!coords) return null
  return coords as unknown as GeolocationCoordinates
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      coordinates: null,
      error: null,
      loading: false,
      permission: null,
      setCoordinates: (coords) => set({ coordinates: coords, error: null, loading: false }),
      setError: (error) => set({ error, loading: false }),
      setLoading: (loading) => set({ loading }),
      setPermission: (permission) => set({ permission }),
      clearLocation: () => set({ coordinates: null, error: null, loading: false }),
    }),
    {
      name: 'matchamap_user_location',
      partialize: (state) => ({
        coordinates: toSerializable(state.coordinates),
      }),
      storage: {
        getItem: (name): StorageValue<PersistedLocationState> | null => {
          try {
            const stored = localStorage.getItem(name)
            if (!stored) return null

            const data: StoredData = JSON.parse(stored)

            // Check if we have stored location data with timestamp
            if (data.state?.coordinates && data.timestamp) {
              const age = Date.now() - data.timestamp

              // Return null if location is too old
              if (age >= LOCATION_MAX_AGE) {
                localStorage.removeItem(name)
                return null
              }
            }

            return data as StorageValue<PersistedLocationState>
          } catch {
            return null
          }
        },
        setItem: (name, value: StorageValue<PersistedLocationState>) => {
          try {
            // Add timestamp to stored data
            const storedData: StoredData = {
              ...(value as StoredData),
              timestamp: Date.now(),
            }
            localStorage.setItem(name, JSON.stringify(storedData))
          } catch {
            // Ignore localStorage errors
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name)
          } catch {
            // Ignore localStorage errors
          }
        },
      },
      merge: (persistedState, currentState) => {
        // Convert stored serializable coordinates back to GeolocationCoordinates
        const persisted = persistedState as PersistedLocationState
        return {
          ...currentState,
          coordinates: fromSerializable(persisted.coordinates),
        }
      },
    }
  )
)
