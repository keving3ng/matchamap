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

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    error: null,
    loading: false,
    permission: null,
  })

  const { 
    enableHighAccuracy = false, // Start with false for better mobile compatibility
    timeout = 15000, // Longer timeout for mobile
    maximumAge = 300000 // 5 minutes cache
  } = options

  // Request location permission and get current position
  const requestLocation = useCallback(async () => {
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

    // iOS Safari requires user interaction to be recent
    // First try with low accuracy for faster response
    const tryGeolocation = (highAccuracy: boolean) => {
      return new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: highAccuracy,
            timeout: highAccuracy ? timeout : 10000,
            maximumAge: highAccuracy ? maximumAge : 60000,
          }
        )
      })
    }

    try {
      // Check permission status if available (mainly for desktop)
      if ('permissions' in navigator && navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' })
          setState(prev => ({ ...prev, permission: permission.state }))
        } catch {
          // Permissions API not fully supported on mobile, continue without it
        }
      }

      let position: GeolocationPosition

      try {
        // First attempt: Quick location with lower accuracy
        position = await tryGeolocation(false)
      } catch (error) {
        // If first attempt fails, try with high accuracy
        if (enableHighAccuracy) {
          position = await tryGeolocation(true)
        } else {
          throw error
        }
      }

      setState(prev => ({
        ...prev,
        coordinates: position.coords,
        loading: false,
        error: null,
      }))

      // If we got a low-accuracy position and want high accuracy, try to improve it
      if (!enableHighAccuracy && position.coords.accuracy > 100) {
        setTimeout(() => {
          tryGeolocation(true)
            .then(betterPosition => {
              setState(prev => ({
                ...prev,
                coordinates: betterPosition.coords,
              }))
            })
            .catch(() => {
              // Ignore errors for improvement attempt
            })
        }, 100)
      }

    } catch (error) {
      const geolocationError = error as GeolocationPositionError
      setState(prev => ({
        ...prev,
        error: geolocationError,
        loading: false,
      }))
    }
  }, [enableHighAccuracy, timeout, maximumAge])

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