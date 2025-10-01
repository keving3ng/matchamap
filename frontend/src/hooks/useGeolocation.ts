import { useEffect, useCallback } from 'react'
import { useLocationStore } from '../stores/locationStore'

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  watchPosition?: boolean
}

export const useGeolocation = (_options: UseGeolocationOptions = {}) => {
  const {
    coordinates,
    error,
    loading,
    permission,
    setCoordinates,
    setError,
    setLoading,
    setPermission,
    clearLocation: clearLocationStore,
  } = useLocationStore()

  // Use options for potential future configuration (currently unused but structured for extensibility)

  // Request location permission and get current position
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError)
      return
    }

    setLoading(true)
    setError(null)

    // Mobile-optimized geolocation options
    const geoOptions: PositionOptions = {
      enableHighAccuracy: false, // Start with false for speed on mobile
      timeout: 30000, // Longer timeout for mobile (30 seconds)
      maximumAge: 60000, // Cache for 1 minute on mobile
    }

    const onSuccess = (position: GeolocationPosition) => {
      // setCoordinates will automatically set loading to false
      setCoordinates(position.coords)

      // If accuracy is poor (>100m), try to get a better position
      if (position.coords.accuracy > 100) {
        const improvedOptions: PositionOptions = {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }

        navigator.geolocation.getCurrentPosition(
          (betterPosition) => {
            setCoordinates(betterPosition.coords)
          },
          () => {
            // Ignore errors for improvement attempt - keep the original position
          },
          improvedOptions
        )
      }
    }

    const onError = (error: GeolocationPositionError) => {
      // setError will automatically set loading to false
      setError(error)
    }

    // Make the actual geolocation request
    navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOptions)
  }, [setCoordinates, setError, setLoading])

  // Clear location data
  const clearLocation = useCallback(() => {
    clearLocationStore()
  }, [clearLocationStore])

  // Check permission status on mount
  useEffect(() => {
    if ('permissions' in navigator && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(permission => {
        setPermission(permission.state)

        // Listen for permission changes
        permission.addEventListener('change', () => {
          setPermission(permission.state)
        })
      }).catch(() => {
        // Permissions API not fully supported, ignore
      })
    }
  }, [setPermission])

  return {
    coordinates,
    error,
    loading,
    permission,
    requestLocation,
    clearLocation,
    isSupported: 'geolocation' in navigator,
  }
}