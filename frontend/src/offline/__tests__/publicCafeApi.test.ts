import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cafeAPI, drinksAPI } from '../../utils/api'
import { publicCafeCache, cafeRequest, subscribeCafeInvalidation, invalidatePublicCafeCache } from '../cafeCache'
import { page } from './fixtures'

const { clearAuth, sessionExpired } = vi.hoisted(() => ({ clearAuth: vi.fn(), sessionExpired: vi.fn() }))
vi.mock('../../stores/authStore', () => ({ useAuthStore: { getState: () => ({ clearAuth }) } }))
vi.mock('../../hooks/useSessionExpiry', () => ({ useSessionExpiry: { getState: () => ({ showSessionExpiredDialog: sessionExpired }) } }))
const filters = { city: 'toronto', offset: 0, limit: 20 }
const saved = () => ({ ...page(), cacheInfo: { key: cafeRequest(import.meta.env.VITE_API_URL || '', filters).key, source: 'saved' as const, observedAt: Date.now() - 900000 } })
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
describe('anonymous public café requests', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.spyOn(publicCafeCache, 'begin').mockResolvedValue({ epoch: 0, generation: 0 })
    vi.spyOn(publicCafeCache, 'isCurrent').mockReturnValue(true)
    vi.spyOn(publicCafeCache, 'write').mockResolvedValue(true)
    vi.spyOn(publicCafeCache, 'readStatus').mockResolvedValue({ page: saved(), expired: false })
  })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

  it('uses anonymous no-store reads and persists only the projected page, keeping online photos ephemeral', async () => {
    const data = page()
    Object.assign(data.cafes[0], { images: 'https://example.test/photo', userRatingCount: 9, reviewSnippets: ['UGC'], adminNote: 'secret' })
    vi.mocked(fetch).mockResolvedValue(json(data))
    const result = await cafeAPI.getPublicPage(filters)
    const [url, options] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('city=toronto&limit=20&offset=0')
    expect(options).toMatchObject({ credentials: 'omit', cache: 'no-store' })
    expect(new Headers(options!.headers).has('Authorization')).toBe(false)
    expect(result.cafes[0].images).toContain('photo')
    const persisted = JSON.stringify(vi.mocked(publicCafeCache.write).mock.calls[0][1])
    for (const word of ['photo', 'userRating', 'UGC', 'secret', 'adminNote']) expect(persisted).not.toContain(word)
    expect(result.cacheInfo.source).toBe('network')
  })

  it.each([401, 403, 404, 429])('does not fallback or alter editor auth on HTTP %i', async status => {
    vi.mocked(fetch).mockResolvedValue(json({ error: 'no' }, status))
    await expect(cafeAPI.getPublicPage(filters)).rejects.toMatchObject({ status })
    expect(publicCafeCache.readStatus).not.toHaveBeenCalled()
    expect(clearAuth).not.toHaveBeenCalled()
    expect(sessionExpired).not.toHaveBeenCalled()
  })

  it('does not fallback for malformed, wrong-city or redirected successful responses', async () => {
    for (const data of [{ cafes: [], total: 0 }, page('montreal')]) {
      vi.mocked(fetch).mockResolvedValue(json(data))
      await expect(cafeAPI.getPublicPage(filters)).rejects.toThrow()
    }
    const redirected = json(page())
    Object.defineProperty(redirected, 'redirected', { value: true })
    vi.mocked(fetch).mockResolvedValue(redirected)
    await expect(cafeAPI.getPublicPage(filters)).rejects.toThrow()
    expect(publicCafeCache.readStatus).not.toHaveBeenCalled()
  })

  it.each(['network', 500, 503])('returns only matching saved data with its original timestamp for %s', async failure => {
    if (failure === 'network') vi.mocked(fetch).mockRejectedValue(new TypeError('offline'))
    else vi.mocked(fetch).mockResolvedValue(json({ error: 'temporary' }, Number(failure)))
    const result = await cafeAPI.getPublicPage(filters)
    expect(result.cacheInfo.source).toBe('saved')
    expect(result.cacheInfo.observedAt).toBeLessThan(Date.now() - 800000)
    expect(publicCafeCache.readStatus).toHaveBeenCalledWith(expect.objectContaining({ city: 'toronto', key: cafeRequest(import.meta.env.VITE_API_URL || '', filters).key }))
    expect(publicCafeCache.write).not.toHaveBeenCalled()
  })

  it('falls back after four seconds and aborts the timed-out request', async () => {
    vi.useFakeTimers()
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))
    const pending = cafeAPI.getPublicPage(filters)
    await vi.advanceTimersByTimeAsync(4000)
    expect((await pending).cacheInfo.source).toBe('saved')
    expect((vi.mocked(fetch).mock.calls[0][1]?.signal as AbortSignal).aborted).toBe(true)
  })

  it('never applies or saves a response invalidated by a concurrent edit', async () => {
    vi.mocked(fetch).mockResolvedValue(json(page()))
    vi.mocked(publicCafeCache.isCurrent).mockReturnValue(false)
    await expect(cafeAPI.getPublicPage(filters)).rejects.toMatchObject({ status: 409 })
    expect(publicCafeCache.write).not.toHaveBeenCalled()
    expect(publicCafeCache.readStatus).not.toHaveBeenCalled()
  })

  it('rejects a response when the persisted epoch changed in another tab', async () => {
    vi.mocked(fetch).mockResolvedValue(json(page()))
    vi.mocked(publicCafeCache.write).mockResolvedValue(false)
    await expect(cafeAPI.getPublicPage(filters)).rejects.toMatchObject({ status: 409 })
  })

  it('reports a network error when no matching unexpired saved page exists', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('offline'))
    vi.mocked(publicCafeCache.readStatus).mockResolvedValue({ page: null, expired: false })
    await expect(cafeAPI.getPublicPage(filters)).rejects.toThrow('offline')
  })

  it('leaves ordinary/editor reads credentialed and outside persistence', async () => {
    vi.mocked(fetch).mockResolvedValue(json(page()))
    await cafeAPI.getAll()
    expect(vi.mocked(fetch).mock.calls[0][1]?.credentials).toBe('include')
    expect(publicCafeCache.write).not.toHaveBeenCalled()
  })

  it('invalidates all affected derived queries on every successful café/drink mutation, not failed writes', async () => {
    const invalidate = vi.spyOn(publicCafeCache, 'invalidate').mockResolvedValue(undefined)
    vi.mocked(fetch).mockImplementation(async () => json({ success: true }))
    const mutations = [() => cafeAPI.create({}), () => cafeAPI.update(1, {}), () => cafeAPI.delete(1), () => cafeAPI.import({ cafes: [] }),
      () => drinksAPI.create(1, {}), () => drinksAPI.update(1, {}), () => drinksAPI.delete(1), () => drinksAPI.setAsDefault(1, 2)]
    for (const mutate of mutations) await mutate()
    expect(invalidate).toHaveBeenCalledTimes(mutations.length)
    vi.mocked(fetch).mockResolvedValue(json({ error: 'rejected' }, 500))
    await expect(cafeAPI.update(1, {})).rejects.toThrow()
    expect(invalidate).toHaveBeenCalledTimes(mutations.length)
  })

  it('notifies only after persistent invalidation and listens for other-tab invalidation', async () => {
    let finish!: () => void
    vi.spyOn(publicCafeCache, 'invalidate').mockImplementation(() => new Promise(resolve => { finish = resolve }))
    const listener = vi.fn(), unsubscribe = subscribeCafeInvalidation(listener)
    const pending = invalidatePublicCafeCache()
    expect(listener).not.toHaveBeenCalled()
    finish(); await pending
    expect(listener).toHaveBeenCalledTimes(1)
    window.dispatchEvent(new StorageEvent('storage', { key: 'matchamap-public-cafe-invalidation', newValue: 'next' }))
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
  })
})
