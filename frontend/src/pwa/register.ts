/** Production builds and `vite preview` only; normal development never registers. */
let updateAvailable = false
const listeners = new Set<() => void>()
export const hasShellUpdate = () => updateAvailable
export const subscribeShellUpdate = (listener: () => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
function announceWaiting(registration: ServiceWorkerRegistration) {
  if (!registration.waiting || updateAvailable) return
  updateAvailable = true
  listeners.forEach(listener => listener())
}
export async function registerShellWorker(production: boolean): Promise<ServiceWorkerRegistration | undefined> {
  if (!production || !window.isSecureContext || !('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
  announceWaiting(registration)
  const observeInstalling = () => {
    const worker = registration.installing
    worker?.addEventListener('statechange', () => announceWaiting(registration))
  }
  registration.addEventListener('updatefound', observeInstalling)
  observeInstalling()
  return registration
}
