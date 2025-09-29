// Device detection utilities for better mobile geolocation handling

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
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
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
}

export const getLocationRequestAdvice = (): string => {
  if (isIOSSafari()) {
    return 'iPhone users: Make sure Location Services is enabled in Settings → Privacy & Security → Location Services → Safari.'
  }
  if (isIOS()) {
    return 'iPhone users: Make sure Location Services is enabled in Settings → Privacy & Security → Location Services for your browser.'
  }
  if (isAndroid()) {
    return 'Android users: Make sure Location permission is enabled for your browser in Settings → Apps → [Browser] → Permissions.'
  }
  return 'Make sure location services are enabled for your browser in your device settings.'
}

export const getOptimalGeolocationOptions = () => {
  const isMobileDevice = isMobile()

  return {
    enableHighAccuracy: !isMobileDevice, // Start with false on mobile for faster response
    timeout: isMobileDevice ? 20000 : 15000, // Longer timeout on mobile
    maximumAge: isMobileDevice ? 600000 : 300000, // Longer cache on mobile to avoid repeated requests
  }
}