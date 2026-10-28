import { describe, expect, it, vi } from 'vitest'
import { cafeRequest, projectCafePage, PublicCafeCache, indexedCafeStorage, CAFE_CACHE_LIMITS } from '../cafeCache'
import { MemoryStorage, page } from './fixtures'

const base = 'https://api.example.test'
describe('public editorial café cache', () => {
  it('keys schema, API environment, city and every meaningful filter; ignores only cache busting', () => {
    const a = cafeRequest(base, { city: 'toronto', search: ' matcha ', limit: 20, offset: 0 })
    expect(a.key).toBe(cafeRequest(base, { offset: 0, limit: 20, search: 'matcha', city: 'toronto', _: 17 } as never).key)
    for (const filters of [{ city: 'montreal' }, { search: 'coffee' }, { offset: 20 }, { minScore: 3 }, { maxPrice: 10 }, { userMinRating: 2 }]) {
      expect(cafeRequest(base, { ...a.filters, ...filters }).key).not.toBe(a.key)
    }
    expect(cafeRequest('https://preview.example.test', a.filters).key).not.toBe(a.key)
    expect(() => cafeRequest(base, { city: 'kyoto' })).toThrow()
    expect(() => cafeRequest(base, { city: 'toronto', token: 'secret' } as never)).toThrow()
    expect(() => cafeRequest(base, { city: 'toronto', offset: -1 })).toThrow()
  })

  it('projects nested editorial fields only, preserving zero/unknown and pagination', () => {
    const raw = page()
    Object.assign(raw, { cookies: 'private', headers: { authorization: 'secret' } })
    Object.assign(raw.cafes[0], { images: 'photo', userRatingAvg: 8, userRatingCount: 3, reviewSnippets: [{ text: 'UGC' }], privateNote: 'secret' })
    Object.assign(raw.cafes[0].drinks![0], { token: 'secret' })
    const clean = projectCafePage(raw, cafeRequest(base, { city: 'toronto' }))
    const json = JSON.stringify(clean)
    for (const word of ['photo', 'UGC', 'private', 'secret', 'userRating', 'headers', 'token']) expect(json).not.toContain(word)
    expect(clean.cafes[0].displayScore).toBe(0)
    expect(clean.cafes[0].ambianceScore).toBeUndefined()
    expect(clean.total).toBe(4)
    expect(clean.hasMore).toBe(true)
    expect(() => projectCafePage(page('montreal'), cafeRequest(base, { city: 'toronto' }))).toThrow()
    expect(() => projectCafePage({ cafes: [], total: 0 }, cafeRequest(base, { city: 'toronto' }))).toThrow()
  })

  it('isolates cities/query pages and expires at exactly seven days without refreshing observation time', async () => {
    let now = 1000
    const storage = new MemoryStorage(), cache = new PublicCafeCache(storage, () => now)
    const tor = cafeRequest(base, { city: 'toronto', offset: 0 }), mtl = cafeRequest(base, { city: 'montreal' })
    await cache.write(tor, page(), await cache.begin(), now)
    expect(await cache.read(mtl)).toBeNull()
    expect(await cache.read(cafeRequest(base, { city: 'toronto', offset: 10 }))).toBeNull()
    now += CAFE_CACHE_LIMITS.maxAge - 1
    expect((await cache.read(tor))?.cacheInfo.observedAt).toBe(1000)
    now++
    expect(await cache.read(tor)).toBeNull()
    expect(storage.state.snapshots).toEqual([])
  })

  it('reports a matching expired snapshot separately from missing data without returning expired content', async () => {
    let now = 1000
    const storage = new MemoryStorage(), cache = new PublicCafeCache(storage, () => now)
    const tor = cafeRequest(base, { city: 'toronto' })
    await cache.write(tor, page(), await cache.begin(), now)
    now += CAFE_CACHE_LIMITS.maxAge
    expect(await cache.readStatus(tor)).toEqual({ page: null, expired: true })
    expect(storage.state.snapshots).toEqual([])
    expect(await cache.readStatus(tor)).toEqual({ page: null, expired: false })
  })

  it('bounds count, per-snapshot and total UTF-8 bytes with least-recently-used eviction', async () => {
    let now = 1000
    const storage = new MemoryStorage(), cache = new PublicCafeCache(storage, () => ++now)
    for (let n = 0; n < 20; n++) {
      const request = cafeRequest(base, { city: 'toronto', offset: n })
      await cache.write(request, page(), await cache.begin(), now)
    }
    const oldest = cafeRequest(base, { city: 'toronto', offset: 0 })
    await cache.read(oldest)
    await cache.write(cafeRequest(base, { city: 'toronto', offset: 20 }), page(), await cache.begin(), now)
    expect(storage.state.snapshots).toHaveLength(20)
    expect(await cache.read(oldest)).not.toBeNull()
    expect(await cache.read(cafeRequest(base, { city: 'toronto', offset: 1 }))).toBeNull()
    await cache.invalidate()
    for (let n = 0; n < 7; n++) {
      const city = ['toronto', 'montreal', 'tokyo'][n % 3]
      await cache.write(cafeRequest(base, { city, offset: n }), page(city, 'é'.repeat(450000)), await cache.begin(), now)
    }
    expect(new TextEncoder().encode(JSON.stringify(storage.state.snapshots)).length).toBeLessThanOrEqual(CAFE_CACHE_LIMITS.bytes)
    expect(new Set(storage.state.snapshots.map(s => s.city)).size).toBeLessThanOrEqual(3)
    await cache.write(oldest, page('toronto', 'é'.repeat(600000)), await cache.begin(), now)
    expect(await cache.read(oldest)).toBeNull()
  })

  it('replaces successful empty pages and fences pre-edit writes across cache instances/tabs', async () => {
    const storage = new MemoryStorage(), a = new PublicCafeCache(storage), b = new PublicCafeCache(storage)
    const req = cafeRequest(base, { city: 'toronto' })
    const token = await a.begin()
    await a.write(req, page(), token, Date.now())
    await b.invalidate()
    await a.write(req, page(), token, Date.now())
    expect(await a.read(req)).toBeNull()
    await a.write(req, { cafes: [], total: 0, hasMore: false }, await a.begin(), Date.now())
    expect(await a.read(req)).toMatchObject({ cafes: [], total: 0, hasMore: false })
  })

  it('rejects corrupt data and treats missing/denied storage as optional', async () => {
    const storage = new MemoryStorage(), cache = new PublicCafeCache(storage)
    const req = cafeRequest(base, { city: 'toronto' })
    await cache.write(req, page(), await cache.begin(), Date.now())
    storage.state.snapshots[0].data.cafes[0].city = 'montreal'
    expect(await cache.read(req)).toBeNull()
    const denied = new PublicCafeCache({ transact: vi.fn().mockRejectedValue(new Error('quota')) })
    expect((await denied.begin()).epoch).toBeNull()
    expect(await denied.read(req)).toBeNull()
    await expect(denied.write(req, page(), await denied.begin(), Date.now())).resolves.toBe(true)
    await expect(denied.invalidate()).resolves.toBeUndefined()
    await expect(denied.invalidate(true)).rejects.toThrow('quota')
    vi.stubGlobal('indexedDB', undefined)
    await expect(indexedCafeStorage().transact(() => 1)).rejects.toThrow()
    vi.unstubAllGlobals()
  })
})
