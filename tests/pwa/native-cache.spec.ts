import { test, expect } from '@playwright/test'
import type * as Harness from './harness'
declare global { interface Window { cacheFixture: typeof Harness; notices: string[] } }
const pageData = (city = 'toronto', quickNote = 'Editorial') => ({ cafes: [{ id: 1, name: 'Fixture', slug: 'fixture', city, latitude: 43, longitude: -79, link: 'https://example.test', quickNote, drinks: [] }], total: 1, hasMore: false })

async function setup(page: import('@playwright/test').Page) {
  await page.goto('/__harness')
  await page.evaluate(async () => { const path = '/__harness/harness.js'; window.cacheFixture = await import(path); window.notices = []; window.cacheFixture.subscribeCafeInvalidation(reason => window.notices.push(reason)) })
}

test('native IDB count, UTF8 size, LRU, schema/environment/query/city isolation and corrupt/quota storage behavior', async ({ page }, testInfo) => {
  await setup(page)
  const receipt = await page.evaluate(async data => {
    const { cafeRequest, publicCafeCache: cache, CAFE_CACHE_LIMITS: limits, PublicCafeCache } = window.cacheFixture
    for (let i = 0; i < 21; i++) {
      const r = cafeRequest('https://api.fixture.test', { city: 'toronto', offset: i })
      await cache.write(r, data, await cache.begin(), Date.now() + i * 0)
    }
    const own = cafeRequest('https://api.fixture.test', { city: 'toronto', offset: 20 })
    const counts: number[] = []
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open('matchamap-public-cafes-v1', 1); r.onsuccess = () => resolve(r.result) })
    const read = () => new Promise<{ snapshots: unknown[] }>(resolve => { const r = db.transaction('cache').objectStore('cache').get('state'); r.onsuccess = () => resolve(r.result) })
    counts.push((await read()).snapshots.length)
    const isolation = await Promise.all([{ city: 'montreal' }, { city: 'tokyo' }, { city: 'toronto', search: 'missing' }].map(filters => cache.read(cafeRequest('https://api.fixture.test', filters))))
    const environment = await cache.read(cafeRequest('https://different.fixture.test', { city: 'toronto', offset: 20 }))
    await cache.invalidate()
    for (let i = 0; i < 7; i++) {
      const r = cafeRequest('https://api.fixture.test', { city: 'toronto', offset: i })
      await cache.write(r, { ...data, cafes: [{ ...data.cafes[0], quickNote: '🍵'.repeat(200000) }] }, await cache.begin(), Date.now())
    }
    const bytes = new TextEncoder().encode(JSON.stringify((await read()).snapshots)).byteLength
    counts.push((await read()).snapshots.length)
    await cache.write(own, { ...data, cafes: [{ ...data.cafes[0], quickNote: 'x'.repeat(limits.snapshotBytes) }] }, await cache.begin(), Date.now())
    const oversized = await cache.read(own)
    const denied = new PublicCafeCache({ transact: async () => { throw new Error('fixture quota denied') } })
    const onlineAccepted = await denied.write(own, data, await denied.begin(), Date.now())
    let clearDenied = false; try { await denied.invalidate(true) } catch { clearDenied = true }
    await cache.invalidate()
    const corrupt = cafeRequest('https://api.fixture.test', { city: 'toronto' })
    await cache.write(corrupt, data, await cache.begin(), Date.now())
    await new Promise<void>(resolve => { const tx = db.transaction('cache', 'readwrite'), store = tx.objectStore('cache'), r = store.get('state'); r.onsuccess = () => { const s = r.result; s.snapshots[0].data.cafes[0].city = 'montreal'; store.put(s, 'state') }; tx.oncomplete = () => resolve() })
    const corruptRead = await cache.read(corrupt)
    return { counts, bytes, limits, isolation, environment, oversized, onlineAccepted, clearDenied, corruptRead }
  }, pageData())
  expect(receipt.counts[0]).toBe(20)
  expect(receipt.bytes).toBeLessThanOrEqual(receipt.limits.bytes)
  expect(receipt.counts[1]).toBeLessThan(7)
  expect(receipt.isolation).toEqual([null, null, null])
  expect(receipt.environment).toBeNull(); expect(receipt.oversized).toBeNull(); expect(receipt.corruptRead).toBeNull()
  expect(receipt.onlineAccepted).toBe(true); expect(receipt.clearDenied).toBe(true)
  await testInfo.attach('native-bounds', { body: JSON.stringify(receipt), contentType: 'application/json' })
})

test('native cross-tab mutation invalidation, all variants, failure retention, epoch fencing and fallback storage events', async ({ context, page }, testInfo) => {
  await context.route('**/*', async route => {
    if (new URL(route.request().url()).origin === 'http://localhost:4175') return route.continue()
    if (route.request().method() === 'DELETE' && route.request().url().endsWith('/999')) return route.fulfill({ status: 500, json: { error: 'fixture failed mutation' } })
    return route.fulfill({ json: { cafe: pageData().cafes[0], drinks: [], success: 1 } })
  })
  await setup(page)
  const other = await context.newPage(); await setup(other)
  for (const path of ['deleteCafe', 'editCafe', 'moveCafe', 'createDrink', 'editDrink', 'defaultDrink', 'deleteDrink', 'import']) {
    const noticeCount = await other.evaluate(() => window.notices.filter(x => x === 'edit').length)
    await page.evaluate(async ({ data }) => {
      const { cafeRequest, publicCafeCache: cache } = window.cacheFixture
      for (const city of ['toronto', 'montreal', 'tokyo']) for (const offset of [0, 1]) {
        const request = cafeRequest('https://api.fixture.test', { city, offset })
        await cache.write(request, { ...data, cafes: [{ ...data.cafes[0], city }] }, await cache.begin(), Date.now())
      }
    }, { data: pageData() })
    // Exercise the actual central client's exported mutation method for these API families.
    await page.evaluate(async path => {
      const { api } = window.cacheFixture
      if (path === 'deleteCafe') await api.cafes.delete(1)
      else if (path === 'editCafe') await api.cafes.update(1, { quickNote: 'Edited fixture' })
      else if (path === 'moveCafe') await api.cafes.update(1, { city: 'montreal' })
      else if (path === 'import') await api.cafes.import({ cafes: [] })
      else if (path === 'createDrink') await api.drinks.create(1, { name: 'Fixture', score: 8 })
      else if (path === 'editDrink') await api.drinks.update(2, { score: 9 })
      else if (path === 'defaultDrink') await api.drinks.setAsDefault(1, 2)
      else await api.drinks.delete(2)
    }, path)
    await expect.poll(() => other.evaluate(() => window.notices.filter(x => x === 'edit').length)).toBe(noticeCount + 1)
    const state = await other.evaluate(async () => {
      const { cafeRequest, publicCafeCache: cache } = window.cacheFixture
      return Promise.all(['toronto', 'montreal', 'tokyo'].map(city => cache.read(cafeRequest('https://api.fixture.test', { city }))))
    })
    expect(state).toEqual([null, null, null])
  }
  const failed = await page.evaluate(async data => {
    const { api, cafeRequest, publicCafeCache: cache } = window.cacheFixture
    const request = cafeRequest('https://api.fixture.test', { city: 'toronto' })
    await cache.write(request, data, await cache.begin(), Date.now())
    try { await api.cafes.delete(999) } catch { /* expected */ }
    return Boolean(await cache.read(request))
  }, pageData())
  expect(failed).toBe(true)
  const oldToken = await page.evaluate(() => window.cacheFixture.publicCafeCache.begin())
  await other.evaluate(() => window.cacheFixture.clearOfflineCafeCache())
  const accepted = await page.evaluate(async ({ token, data }) => {
    const { cafeRequest, publicCafeCache: cache } = window.cacheFixture
    return cache.write(cafeRequest('https://api.fixture.test', { city: 'toronto' }), data, token, Date.now())
  }, { token: oldToken, data: pageData() })
  expect(accepted).toBe(false)
  const fallback = await context.newPage()
  await fallback.addInitScript(() => Object.defineProperty(window, 'BroadcastChannel', { value: undefined }))
  await setup(fallback)
  await fallback.evaluate(() => window.cacheFixture.clearOfflineCafeCache())
  await expect.poll(() => page.evaluate(() => window.notices.filter(x => x === 'clear').length)).toBeGreaterThan(0)
  await testInfo.attach('cross-tab-notices', { body: JSON.stringify(await page.evaluate(() => window.notices)), contentType: 'application/json' })
})
