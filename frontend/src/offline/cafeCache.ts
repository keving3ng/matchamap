// This module runs outside React renders; compilationMode=all must not inject hooks.
'use no memo'

import { COPY } from '../constants/copy'
import type { Cafe, Drink } from '../../../shared/types'

export const CAFE_CACHE_LIMITS = {
  cities: 3, snapshots: 20, bytes: 5 * 1024 * 1024,
  snapshotBytes: 1024 * 1024, maxAge: 7 * 24 * 60 * 60 * 1000,
  refreshAge: 5 * 60 * 1000, timeout: 4000,
} as const
const CITIES = ['toronto', 'montreal', 'tokyo']
const SCHEMA = 1
export interface CafeFilters {
  city?: string; search?: string; minScore?: number; maxPrice?: number
  userMinRating?: number; limit?: number; offset?: number
}
export interface CafePage { cafes: Cafe[]; total: number; hasMore: boolean }
export interface CafeRequest { key: string; city: string; filters: CafeFilters; query: string }
export interface CafePageResult extends CafePage {
  cacheInfo: { key: string; source: 'network' | 'saved'; observedAt: number }
}
export class CafeCacheExpiredError extends Error {
  constructor() { super(COPY.pwa.expired); this.name = 'CafeCacheExpiredError' }
}
interface Snapshot { key: string; city: string; observedAt: number; accessedAt: number; data: CafePage }
export interface CacheState { epoch: number; snapshots: Snapshot[] }
export interface CafeCacheStorage {
  // The read/modify/write must be atomic across tabs, including the epoch check.
  transact<T>(change: (state: CacheState) => T): Promise<T>
}
const blankState = (): CacheState => ({ epoch: 0, snapshots: [] })
const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).byteLength
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(COPY.cafeData.invalidData)
  return value as Record<string, unknown>
}
function text(value: unknown): string {
  if (typeof value !== 'string') throw new Error(COPY.cafeData.invalidData)
  return value
}
function number(value: unknown, min = 0, max = Infinity): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(COPY.cafeData.invalidData)
  return value
}
function integer(value: unknown, min = 0, max = Infinity) {
  const result = number(value, min, max)
  if (!Number.isInteger(result)) throw new Error(COPY.cafeData.invalidData)
  return result
}
function publicLink(value: string) {
  if (!value) return value
  let url: URL
  try { url = new URL(value) } catch { throw new Error(COPY.cafeData.invalidData) }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error(COPY.cafeData.invalidData)
  return value
}
function optionalFields(target: Record<string, unknown>, source: Record<string, unknown>, names: string[], numeric = false) {
  for (const name of names) {
    if (source[name] === undefined) continue
    target[name] = source[name] === null ? null : numeric ? number(source[name]) : text(source[name])
  }
}

export function cafeRequest(base: string, input: CafeFilters = {}): CafeRequest {
  const allowed = ['city', 'search', 'minScore', 'maxPrice', 'userMinRating', 'limit', 'offset', '_']
  if (Object.keys(input).some(key => !allowed.includes(key))) throw new Error(COPY.cafeData.unsupportedQuery)
  const city = text(input.city).trim().toLowerCase()
  if (!CITIES.includes(city)) throw new Error(COPY.cafeData.unsupportedCity)
  const filters: CafeFilters = { city, limit: input.limit === undefined ? 500 : integer(input.limit, 1, 500), offset: input.offset === undefined ? 0 : integer(input.offset) }
  if (input.search !== undefined) {
    const search = text(input.search).trim()
    if (search.length > 100) throw new Error(COPY.cafeData.searchTooLong)
    if (search) filters.search = search
  }
  for (const name of ['minScore', 'maxPrice', 'userMinRating'] as const) {
    if (input[name] !== undefined) filters[name] = number(input[name], 0, name === 'maxPrice' ? Infinity : 10)
  }
  const endpoint = new URL(`${base.replace(/\/$/, '')}/api/cafes`, typeof location === 'undefined' ? 'https://local.invalid' : location.origin)
  if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash || !['http:', 'https:'].includes(endpoint.protocol)) throw new Error(COPY.cafeData.invalidData)
  const params = new URLSearchParams()
  for (const name of Object.keys(filters).sort()) params.set(name, String(filters[name as keyof CafeFilters]))
  const query = params.toString()
  return { key: JSON.stringify([SCHEMA, endpoint.href, query]), city, filters, query }
}

/** Explicit allowlist. Never serialize raw API payloads, photos or user fields. */
export function projectCafePage(value: unknown, request: CafeRequest): CafePage {
  const page = record(value)
  if (!Array.isArray(page.cafes) || page.cafes.length > (request.filters.limit || 500) || typeof page.hasMore !== 'boolean') throw new Error(COPY.cafeData.invalidData)
  const cafes = page.cafes.map(value => {
    const c = record(value)
    if (c.city !== request.city || c.deletedAt) throw new Error(COPY.cafeData.invalidData)
    const cafe: Cafe = {
      id: integer(c.id, 1), name: text(c.name), slug: text(c.slug), city: request.city,
      latitude: number(c.latitude, -90, 90), longitude: number(c.longitude, -180, 180),
      link: publicLink(text(c.link)), quickNote: text(c.quickNote),
    }
    optionalFields(cafe as unknown as Record<string, unknown>, c, ['address', 'review', 'source', 'instagram', 'instagramPostLink', 'tiktokPostLink', 'hours', 'updatedAt'])
    for (const name of ['instagramPostLink', 'tiktokPostLink'] as const) if (cafe[name]) publicLink(cafe[name]!)
    if (cafe.instagram?.includes('://')) publicLink(cafe.instagram)
    optionalFields(cafe as unknown as Record<string, unknown>, c, ['chargeForAltMilk'], true)
    for (const name of ['ambianceScore', 'displayScore'] as const) if (c[name] !== undefined) cafe[name] = c[name] === null ? null : number(c[name], 0, 10)
    if (c.drinks !== undefined && !Array.isArray(c.drinks)) throw new Error(COPY.cafeData.invalidData)
    cafe.drinks = ((c.drinks || []) as unknown[]).map(value => {
      const d = record(value)
      if (d.cafeId !== cafe.id || typeof d.isDefault !== 'boolean') throw new Error(COPY.cafeData.invalidData)
      const drink: Drink = { id: integer(d.id, 1), cafeId: cafe.id, score: number(d.score, 0, 10), isDefault: d.isDefault }
      optionalFields(drink as unknown as Record<string, unknown>, d, ['name', 'notes', 'priceCurrency'])
      optionalFields(drink as unknown as Record<string, unknown>, d, ['priceAmount', 'gramsUsed'], true)
      return drink
    })
    return cafe
  })
  return { cafes, total: integer(page.total, cafes.length), hasMore: page.hasMore }
}

/** One bounded record lets every eviction and invalidation be one IDB transaction. */
export function indexedCafeStorage(): CafeCacheStorage {
  let connection: Promise<IDBDatabase> | undefined
  function open() {
    if (!connection) connection = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') { reject(new Error(COPY.cafeData.storageUnavailable)); return }
      const request = indexedDB.open('matchamap-public-cafes-v1', 1)
      let finished = false
      const fail = () => { finished = true; reject(new Error(COPY.cafeData.storageUnavailable)) }
      const timer = setTimeout(fail, 1000)
      request.onupgradeneeded = () => request.result.createObjectStore('cache')
      request.onblocked = request.onerror = () => { clearTimeout(timer); fail() }
      request.onsuccess = () => { clearTimeout(timer); if (finished) { request.result.close(); return }; finished = true; request.result.onversionchange = () => { request.result.close(); connection = undefined }; resolve(request.result) }
    }).catch(error => { connection = undefined; throw error })
    return connection
  }
  return {
    async transact<T>(change: (state: CacheState) => T): Promise<T> {
      const db = await open()
      return new Promise<T>((resolve, reject) => {
        const tx = db.transaction('cache', 'readwrite')
        const timer = setTimeout(() => tx.abort(), 1000)
        let result: T
        const request = tx.objectStore('cache').get('state')
        request.onsuccess = () => {
          try {
            const state = request.result || blankState()
            if (!Number.isSafeInteger(state.epoch) || !Array.isArray(state.snapshots)) throw new Error(COPY.cafeData.storageUnavailable)
            result = change(state)
            tx.objectStore('cache').put(state, 'state')
          } catch { tx.abort() }
        }
        tx.oncomplete = () => { clearTimeout(timer); resolve(result) }
        tx.onabort = tx.onerror = () => { clearTimeout(timer); reject(new Error(COPY.cafeData.storageUnavailable)) }
      })
    },
  }
}

export class PublicCafeCache {
  private generation = 0
  constructor(private storage: CafeCacheStorage, private now = Date.now) {}
  async begin() {
    const generation = this.generation
    try { return { epoch: await this.storage.transact(state => state.epoch), generation } }
    catch { return { epoch: null, generation } }
  }
  isCurrent(token: { generation: number }) { return token.generation === this.generation }
  private prune(state: CacheState) {
    const now = this.now()
    state.snapshots = state.snapshots.filter(s => s && Number.isFinite(s.observedAt) && Number.isFinite(s.accessedAt) && CITIES.includes(s.city) && s.observedAt <= now && now - s.observedAt < CAFE_CACHE_LIMITS.maxAge)
  }
  private bound(state: CacheState) {
    state.snapshots.sort((a, b) => b.accessedAt - a.accessedAt || b.observedAt - a.observedAt || a.key.localeCompare(b.key))
    const cities = new Set<string>()
    let size = 2
    state.snapshots = state.snapshots.filter(s => {
      const next = bytes(s) + 1
      if (next > CAFE_CACHE_LIMITS.snapshotBytes || (!cities.has(s.city) && cities.size >= CAFE_CACHE_LIMITS.cities) || size + next > CAFE_CACHE_LIMITS.bytes) return false
      cities.add(s.city); size += next; return true
    }).slice(0, CAFE_CACHE_LIMITS.snapshots)
  }
  async read(request: CafeRequest) {
    return (await this.readStatus(request)).page
  }
  async readStatus(request: CafeRequest): Promise<{ page: CafePageResult | null; expired: boolean }> {
    try {
      return await this.storage.transact(state => {
        const expired = state.snapshots.some(s => s && s.key === request.key && s.city === request.city &&
          Number.isFinite(s.observedAt) && s.observedAt <= this.now() && this.now() - s.observedAt >= CAFE_CACHE_LIMITS.maxAge)
        this.prune(state)
        this.bound(state)
        const snapshot = state.snapshots.find(s => s.key === request.key && s.city === request.city)
        if (!snapshot) return { page: null, expired }
        try {
          const data = projectCafePage(snapshot.data, request)
          if (bytes(snapshot) > CAFE_CACHE_LIMITS.snapshotBytes) throw new Error(COPY.cafeData.storageUnavailable)
          snapshot.accessedAt = this.now()
          this.bound(state)
          return { page: { ...data, cacheInfo: { key: request.key, source: 'saved' as const, observedAt: snapshot.observedAt } }, expired: false }
        } catch { state.snapshots = state.snapshots.filter(s => s !== snapshot); return { page: null, expired: false } }
      })
    } catch { return { page: null, expired: false } }
  }
  async write(request: CafeRequest, value: unknown, token: { epoch: number | null; generation: number }, observedAt: number) {
    if (!this.isCurrent(token)) return false
    if (token.epoch === null) return true
    const snapshot: Snapshot = { key: request.key, city: request.city, observedAt, accessedAt: this.now(), data: projectCafePage(value, request) }
    try {
      return await this.storage.transact(state => {
        if (state.epoch !== token.epoch || !this.isCurrent(token)) return false
        this.prune(state)
        state.snapshots = state.snapshots.filter(s => s.key !== request.key)
        if (bytes(snapshot) <= CAFE_CACHE_LIMITS.snapshotBytes) state.snapshots.push(snapshot)
        this.bound(state)
        return true
      })
    } catch { return this.isCurrent(token) /* Online reads work when persistence is denied/full. */ }
  }
  async invalidate(requireStorage = false) {
    this.generation++
    try { await this.storage.transact(state => { state.epoch++; state.snapshots = [] }) }
    catch (error) { if (requireStorage) throw error /* Editing remains functional without optional storage. */ }
  }
  noticeInvalidation() { this.generation++ }
}

export const publicCafeCache = new PublicCafeCache(indexedCafeStorage())
type InvalidationReason = 'edit' | 'clear'
const listeners = new Set<(reason: InvalidationReason) => void>()
const CHANNEL = 'matchamap-public-cafe-invalidation'
let channel: BroadcastChannel | undefined
let listening = false
function notify(reason: InvalidationReason) { listeners.forEach(listener => listener(reason)) }
function connect() {
  if (listening || typeof window === 'undefined') return
  listening = true
  try { if (typeof window.BroadcastChannel !== 'undefined') {
    channel = new window.BroadcastChannel(CHANNEL)
    channel.onmessage = event => { publicCafeCache.noticeInvalidation(); notify(event.data === 'clear' ? 'clear' : 'edit') }
  } } catch { channel = undefined }
  window.addEventListener('storage', event => {
    if (event.key === CHANNEL) { publicCafeCache.noticeInvalidation(); notify(event.newValue?.startsWith('clear:') ? 'clear' : 'edit') }
  })
}
export function subscribeCafeInvalidation(listener: (reason: InvalidationReason) => void) {
  connect(); listeners.add(listener)
  return () => { listeners.delete(listener) }
}
export async function invalidatePublicCafeCache(reason: InvalidationReason = 'edit') {
  connect()
  // Advance the local fence immediately, before an in-flight response can apply.
  const cleared = publicCafeCache.invalidate(reason === 'clear')
  await cleared
  notify(reason)
  try { channel?.postMessage(reason) } catch { channel = undefined }
  if (!channel) try { localStorage.setItem(CHANNEL, `${reason}:${Date.now()}-${Math.random()}`) } catch { /* storage denied */ }
}
export const clearOfflineCafeCache = () => invalidatePublicCafeCache('clear')
