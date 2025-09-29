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
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    error: null,
    loading: false,
    permission: null,
  })

  const { enableHighAccuracy = true, timeout = 10000, maximumAge = 60000 } = options

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

    try {
      // Check permission status if available
      if ('permissions' in navigator && navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' })
          setState(prev => ({ ...prev, permission: permission.state }))
        } catch {
          // Permissions API not fully supported, continue without it
        }
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState(prev => ({
            ...prev,
            coordinates: position.coords,
            loading: false,
            error: null,
          }))
        },
        (error) => {
          setState(prev => ({
            ...prev,
            error,
            loading: false,
          }))
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      )
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: {
          code: 0,
          message: 'Failed to request location permission',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError,
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