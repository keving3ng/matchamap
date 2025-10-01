/**
 * Utility functions for generating maps URLs based on device platform
 */

/**
 * Detects if the user is on an iOS device
 */
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

/**
 * Generates the appropriate maps URL based on device platform
 * - iOS devices: Use http://maps.apple.com which triggers the native iOS action sheet
 *   allowing users to choose between Apple Maps, Google Maps, or other installed map apps
 * - Other devices: Use Google Maps
 * - If a custom googleMapsUrl is provided, it will be used on non-iOS devices
 *
 * @param address - The destination address
 * @param googleMapsUrl - Optional custom Google Maps URL
 * @returns The appropriate maps URL for the device
 */
export const getMapsUrl = (address: string, googleMapsUrl?: string): string => {
  if (isIOS()) {
    // Using http://maps.apple.com on iOS triggers the native action sheet
    // which lets users choose between Apple Maps, Google Maps (if installed), and other map apps
    // This is better UX than forcing Apple Maps with maps:// URL scheme
    return `http://maps.apple.com/?daddr=${encodeURIComponent(address)}`
  }

  // Use custom Google Maps URL if provided, otherwise generate one
  return googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
}

/**
 * Gets user-friendly text for the maps provider being used
 */
export const getMapsProviderName = (): string => {
  return isIOS() ? 'Maps' : 'Google Maps'
}
