// Device detection utilities for better mobile geolocation handling

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
}

export const isIOSSafari = (): boolean => {
  return isIOS() && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent)
}

export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent)
}

export const isMobile = (): boolean => {
  return isIOS() || isAndroid() || /Mobile|Tablet/.test(navigator.userAgent)
}

export const isStandalone = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

export const isSecureContext = (): boolean => {
  return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost'
}

export const getLocationRequestAdvice = (): string => {
  if (!isSecureContext()) {
    return '⚠️ Location requires HTTPS. This site needs to be accessed via https:// for location services to work on mobile devices.'
  }
  
  if (isIOSSafari()) {
    return 'iPhone/Safari: Go to Settings → Privacy & Security → Location Services → Safari → Allow Location Access. Make sure to tap "Allow" when prompted.'
  }
  if (isIOS()) {
    return 'iPhone: Enable Location Services in Settings → Privacy & Security → Location Services, then allow location access for your browser app when prompted.'
  }
  if (isAndroid()) {
    return 'Android: Allow location permission when prompted, or enable it manually in Settings → Apps → [Your Browser] → Permissions → Location.'
  }
  return 'Click "Allow" when your browser asks for location permission. Make sure location services are enabled in your device settings.'
}

export const getOptimalGeolocationOptions = () => {
  const isMobileDevice = isMobile()

  return {
    enableHighAccuracy: !isMobileDevice, // Start with false on mobile for faster response
    timeout: isMobileDevice ? 20000 : 15000, // Longer timeout on mobile
    maximumAge: isMobileDevice ? 600000 : 300000, // Longer cache on mobile to avoid repeated requests
  }
}