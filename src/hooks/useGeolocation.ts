import { useState, useEffect, useCallback } from 'react'

interface GeolocationState {
  coordinates: GeolocationCoordinates | null
  error: GeolocationPositionError | null
  loading: boolean
  permission: PermissionState | null
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  watchPosition?: boolean
}

export const useGeolocation = (_options: UseGeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    error: null,
    loading: false,
    permission: null,
  })

  // Use options for potential future configuration (currently unused but structured for extensibility)

  // Request location permission and get current position
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: {
          code: 0,
          message: 'Geolocation is not supported by this browser',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError,
      }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    // Mobile-optimized geolocation options
    const geoOptions: PositionOptions = {
      enableHighAccuracy: false, // Start with false for speed on mobile
      timeout: 30000, // Longer timeout for mobile (30 seconds)
      maximumAge: 60000, // Cache for 1 minute on mobile
    }

    const onSuccess = (position: GeolocationPosition) => {
      setState(prev => ({
        ...prev,
        coordinates: position.coords,
        loading: false,
        error: null,
      }))

      // If accuracy is poor (>100m), try to get a better position
      if (position.coords.accuracy > 100) {
        const improvedOptions: PositionOptions = {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }

        navigator.geolocation.getCurrentPosition(
          (betterPosition) => {
            setState(prev => ({
              ...prev,
              coordinates: betterPosition.coords,
            }))
          },
          () => {
            // Ignore errors for improvement attempt - keep the original position
          },
          improvedOptions
        )
      }
    }

    const onError = (error: GeolocationPositionError) => {
      setState(prev => ({
        ...prev,
        error: error,
        loading: false,
      }))
    }

    // Make the actual geolocation request
    navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOptions)
  }, [])

  // Clear location data
  const clearLocation = useCallback(() => {
    setState({
      coordinates: null,
      error: null,
      loading: false,
      permission: null,
    })
  }, [])

  // Check permission status on mount
  useEffect(() => {
    if ('permissions' in navigator && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(permission => {
        setState(prev => ({ ...prev, permission: permission.state }))
        
        // Listen for permission changes
        permission.addEventListener('change', () => {
          setState(prev => ({ ...prev, permission: permission.state }))
        })
      }).catch(() => {
        // Permissions API not fully supported, ignore
      })
    }
  }, [])

  return {
    coordinates: state.coordinates,
    error: state.error,
    loading: state.loading,
    permission: state.permission,
    requestLocation,
    clearLocation,
    isSupported: 'geolocation' in navigator,
  }
}