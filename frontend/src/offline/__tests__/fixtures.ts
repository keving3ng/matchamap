import type { CacheState, CafeCacheStorage, CafePage } from '../cafeCache'

export class MemoryStorage implements CafeCacheStorage {
  state: CacheState = { epoch: 0, snapshots: [] }
  private tail: Promise<unknown> = Promise.resolve()
  transact<T>(change: (state: CacheState) => T): Promise<T> {
    const next = this.tail.then(() => {
      const state = structuredClone(this.state)
      const result = change(state)
      this.state = state
      return result
    })
    this.tail = next.catch(() => undefined)
    return next
  }
}
export function page(city = 'toronto', note = 'Editorial note'): CafePage {
  return { cafes: [{ id: 1, name: 'Café', slug: 'cafe', city, latitude: 43, longitude: -79,
    link: 'https://example.test/cafe', quickNote: note, displayScore: 0,
    drinks: [{ id: 2, cafeId: 1, score: 8, isDefault: true, notes: 'Editorial tasting' }],
  }], total: 4, hasMore: true }
}
