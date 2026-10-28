import { afterEach, expect, it, vi } from 'vitest'
import { registerShellWorker } from './register'

afterEach(() => vi.unstubAllGlobals())
it('registers only in a secure production context with update cache bypass', async () => {
  const register = vi.fn().mockResolvedValue({ scope: '/', addEventListener: vi.fn() })
  vi.stubGlobal('navigator', { serviceWorker: { register } })
  vi.stubGlobal('isSecureContext', true)
  await registerShellWorker(false)
  expect(register).not.toHaveBeenCalled()
  await registerShellWorker(true)
  expect(register).toHaveBeenCalledWith('/sw.js', { scope: '/', updateViaCache: 'none' })
  register.mockClear()
  vi.stubGlobal('isSecureContext', false)
  await registerShellWorker(true)
  expect(register).not.toHaveBeenCalled()
})
it('leaves unsupported browsers working without registration', async () => {
  vi.stubGlobal('navigator', {})
  vi.stubGlobal('isSecureContext', true)
  expect(await registerShellWorker(true)).toBeUndefined()
})
it('announces existing waiting workers and installed updates without activating or reloading tabs', async () => {
  vi.resetModules()
  const { registerShellWorker, hasShellUpdate, subscribeShellUpdate } = await import('./register')
  const registration = new EventTarget() as EventTarget & { active?: object; waiting?: { postMessage: ReturnType<typeof vi.fn> }; installing?: EventTarget }
  const worker = new EventTarget()
  registration.active = {}
  registration.installing = worker
  vi.stubGlobal('navigator', { serviceWorker: { register: vi.fn().mockResolvedValue(registration) } })
  vi.stubGlobal('isSecureContext', true)
  const listener = vi.fn()
  const unsubscribe = subscribeShellUpdate(listener)
  await registerShellWorker(true)
  expect(hasShellUpdate()).toBe(false)
  // Installing may already exist before register() resolves.
  // Failed installs do not create a waiting worker or an update notice.
  worker.dispatchEvent(new Event('statechange'))
  expect(listener).not.toHaveBeenCalled()
  registration.waiting = { postMessage: vi.fn() }
  worker.dispatchEvent(new Event('statechange'))
  expect(hasShellUpdate()).toBe(true)
  expect(listener).toHaveBeenCalledOnce()
  await registerShellWorker(true) // Another tab/registration may already see waiting.
  expect(listener).toHaveBeenCalledOnce()
  expect(registration.waiting.postMessage).not.toHaveBeenCalled()
  unsubscribe()
})
it('detects a worker already waiting when a tab opens', async () => {
  vi.resetModules()
  const { registerShellWorker, hasShellUpdate } = await import('./register')
  const registration = Object.assign(new EventTarget(), { waiting: {}, active: {} })
  vi.stubGlobal('navigator', { serviceWorker: { register: vi.fn().mockResolvedValue(registration) } })
  vi.stubGlobal('isSecureContext', true)
  await registerShellWorker(true)
  expect(hasShellUpdate()).toBe(true)
})
it('preserves registration failure for callers without announcing a successful update', async () => {
  vi.resetModules()
  const { registerShellWorker, hasShellUpdate } = await import('./register')
  vi.stubGlobal('navigator', { serviceWorker: { register: vi.fn().mockRejectedValue(new Error('offline')) } })
  vi.stubGlobal('isSecureContext', true)
  await expect(registerShellWorker(true)).rejects.toThrow('offline')
  expect(hasShellUpdate()).toBe(false)
})
it('observes a later updatefound worker as well as one already installing', async () => {
  vi.resetModules()
  const { registerShellWorker, hasShellUpdate } = await import('./register')
  const registration = Object.assign(new EventTarget(), { active: {}, installing: undefined as EventTarget | undefined, waiting: undefined as object | undefined })
  vi.stubGlobal('navigator', { serviceWorker: { register: vi.fn().mockResolvedValue(registration) } })
  vi.stubGlobal('isSecureContext', true)
  await registerShellWorker(true)
  const worker = new EventTarget()
  registration.active = {}
  registration.installing = worker
  registration.dispatchEvent(new Event('updatefound'))
  registration.waiting = {}
  worker.dispatchEvent(new Event('statechange'))
  expect(hasShellUpdate()).toBe(true)
})

it('does not announce the initial install as an update', async () => {
  vi.resetModules()
  const { registerShellWorker, hasShellUpdate } = await import('./register')
  const registration = Object.assign(new EventTarget(), { waiting: {}, active: null })
  vi.stubGlobal('navigator', { serviceWorker: { register: vi.fn().mockResolvedValue(registration) } })
  vi.stubGlobal('isSecureContext', true)
  await registerShellWorker(true)
  expect(hasShellUpdate()).toBe(false)
})
