import { test, expect, type BrowserContext, type Page } from '@playwright/test'

const offlineContexts = new WeakSet<BrowserContext>()
export async function offline(context: BrowserContext, value: boolean) {
  if (value) offlineContexts.add(context); else offlineContexts.delete(context)
  await context.setOffline(value)
}
const origin = 'http://localhost:4175'
const api = 'https://api.matchamap.club'
const fixture = (city = 'toronto') => ({ cafes: [{ id: 901, name: 'Fixture Matcha', slug: 'fixture-matcha', city, latitude: 43, longitude: -79, address: '123 Fixture St', link: 'https://example.test/cafe', quickNote: 'Editorial fixture', displayScore: 8, drinks: [{ id: 902, cafeId: 901, score: 8, isDefault: true }], images: 'PRIVATE_CANARY_IMAGE', userRatingAvg: 9, privateNote: 'PRIVATE_CANARY_SECRET', reviewSnippets: [{ text: 'PRIVATE_CANARY_UGC' }] }], total: 1, hasMore: false })

export async function isolatedNetwork(context: BrowserContext, status = 200) {
  const requests: { url: string; headers: Record<string, string> }[] = []
  await context.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url())
    if (url.origin === origin) return route.continue()
    if (url.origin === api && url.pathname === '/api/cafes') {
      if (offlineContexts.has(context)) return route.abort('internetdisconnected')
      requests.push({ url: req.url(), headers: await req.allHeaders() })
      return route.fulfill({ status, json: status === 200 ? fixture(url.searchParams.get('city') || 'toronto') : { error: 'Fixture denied' } })
    }
    if (url.origin === api && url.pathname === '/api/cities') return route.fulfill({ json: { cities: [] } })
    return route.abort() // No live API, fonts, tiles or analytics requests escape this fixture.
  })
  return requests
}
async function storage(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const r = indexedDB.open('matchamap-public-cafes-v1', 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error) })
    return new Promise<{ epoch: number; snapshots: { key: string; observedAt: number; data: unknown }[] }>((resolve, reject) => { const t = db.transaction('cache'), r = t.objectStore('cache').get('state'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error) })
  })
}
async function controlled(page: Page) {
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
}

test.beforeEach(async ({ request }) => { await request.get('/__fixture/version?revision=0') })

test('built startup, native storage privacy, offline list/detail and help before first help visit', async ({ context, page }, testInfo) => {
  const requests = await isolatedNetwork(context)
  await context.addInitScript(() => {
    const realFetch = window.fetch
    Object.assign(window, { __fixtureFetch: [] })
    window.fetch = (url, options) => {
      if (String(url).includes('/api/cafes')) (window as unknown as { __fixtureFetch: unknown[] }).__fixtureFetch.push({ url: String(url), credentials: options?.credentials, cache: options?.cache })
      return realFetch(url, options)
    }
  })
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message))
  await context.addCookies([{ name: 'session', value: 'PRIVATE_CANARY_COOKIE', domain: 'api.matchamap.club', path: '/', secure: true }])
  await page.goto('/list')
  await expect(page.getByText('Fixture Matcha', { exact: true })).toBeVisible()
  await controlled(page)
  const saved = await storage(page)
  const serialized = JSON.stringify(saved)
  expect(saved.snapshots).toHaveLength(1)
  expect(serialized).not.toContain('PRIVATE_CANARY')
  expect(requests.length).toBeGreaterThan(0)
  expect(requests.every(r => !r.headers.cookie && !r.headers.authorization)).toBe(true)
  const fetchOptions = await page.evaluate(() => (window as unknown as { __fixtureFetch: { credentials: string; cache: string }[] }).__fixtureFetch)
  expect(fetchOptions.every(r => r.credentials === 'omit' && r.cache === 'no-store')).toBe(true)
  await offline(context, true)
  await page.reload()
  await expect(page.getByText('Fixture Matcha', { exact: true })).toBeVisible()
  await expect(page.getByText(/Showing saved café data/)).toBeVisible()
  await page.goto('/tor/fixture-matcha')
  await expect(page.getByRole('heading', { name: 'Fixture Matcha' })).toBeVisible()
  await page.goto('/install/')
  await expect(page.getByRole('heading', { name: 'Install and offline help' })).toBeVisible()
  await expect(page.getByText('What works offline')).toBeVisible()
  const cachesReceipt = await page.evaluate(async () => Object.fromEntries(await Promise.all((await caches.keys()).map(async name => [name, (await (await caches.open(name)).keys()).map(r => r.url)]))))
  expect(JSON.stringify(cachesReceipt)).not.toMatch(/api\/|Admin|Login|Events/)
  expect(errors).toEqual([])
  await testInfo.attach('native-storage-and-requests', { body: JSON.stringify({ saved, requests, fetchOptions, cachesReceipt }, null, 2), contentType: 'application/json' })
})

for (const path of ['/list', '/install']) test(`clear ${path} does not repopulate through reload, visibility, reconnect, other tab or route navigation`, async ({ context, page }) => {
  const requests = await isolatedNetwork(context)
  await page.goto('/list'); await expect(page.getByText('Fixture Matcha', { exact: true })).toBeVisible(); await controlled(page)
  const second = await context.newPage(); await second.goto('/list'); await expect(second.getByText('Fixture Matcha', { exact: true })).toBeVisible()
  await page.goto(path)
  if (path === '/list') { await offline(context, true); await page.reload(); await expect(page.getByText(/Showing saved café data/)).toBeVisible() }
  await page.waitForLoadState('networkidle')
  const before = requests.length
  await page.getByRole('button', { name: 'Clear offline café data' }).click()
  await expect(page.getByText('Saved café data was cleared from this device.', { exact: true })).toBeVisible()
  await expect.poll(async () => (await storage(second)).snapshots.length).toBe(0)
  await offline(context, false)
  await second.evaluate(() => { window.dispatchEvent(new Event('online')); document.dispatchEvent(new Event('visibilitychange')) })
  await page.goto('/list')
  await expect(page.getByText('Saved café data was cleared from this device.', { exact: true })).toBeVisible()
  expect(requests.length).toBe(before)
  expect((await storage(page)).snapshots).toEqual([])
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByText('Fixture Matcha', { exact: true })).toBeVisible()
  expect((await storage(page)).snapshots).toHaveLength(1)
})

test('new worker waits with two tabs; safe guidance leaves clients and unsaved editor content intact; failed update and recovery', async ({ context, page, request }) => {
  await isolatedNetwork(context)
  await page.goto('/list'); await expect(page.getByText('Fixture Matcha', { exact: true })).toBeVisible(); await controlled(page)
  const second = await context.newPage(); await second.goto('/list')
  await second.evaluate(() => { const input = document.createElement('input'); input.id = 'unsaved-fixture'; input.value = 'unsaved editor draft'; document.body.append(input) })
  await request.get('/__fixture/version?revision=1&fail=true')
  await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update() })
  await expect.poll(() => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())!.installing))).toBe(false)
  expect(await page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())!.waiting))).toBe(false)
  await request.get('/__fixture/version?revision=2')
  await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update() })
  await expect(page.getByText('A MatchaMap update is ready.')).toBeVisible()
  await page.getByRole('button', { name: 'How to update' }).click()
  await expect(page.getByText(/Save any editor changes/)).toBeFocused()
  await expect(second.locator('#unsaved-fixture')).toHaveValue('unsaved editor draft')
  expect(await page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())!.waiting))).toBe(true)
  await page.close(); await second.close()
  const reopened = await context.newPage(); await reopened.goto('/list')
  await expect.poll(() => reopened.evaluate(async () => (await caches.keys()).some(name => name.startsWith('matchamap-shell-fixture2-')))).toBe(true)
  await expect(reopened.getByText('Fixture Matcha', { exact: true })).toBeVisible()
})

test('missing and expired native data leave useful offline exits and respect exact seven day ceiling', async ({ context, page }) => {
  await isolatedNetwork(context)
  await page.goto('/list'); await expect(page.getByText('Fixture Matcha', { exact: true })).toBeVisible(); await controlled(page)
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(resolve => { const r = indexedDB.open('matchamap-public-cafes-v1', 1); r.onsuccess = () => resolve(r.result) })
    await new Promise<void>(resolve => { const t = db.transaction('cache', 'readwrite'), store = t.objectStore('cache'), r = store.get('state'); r.onsuccess = () => { const s = r.result; s.snapshots.forEach((x: { observedAt: number }) => { x.observedAt = Date.now() - 7 * 86400000 }); store.put(s, 'state') }; t.oncomplete = () => resolve() })
  })
  await offline(context, true); await page.goto('/tor/fixture-matcha')
  await expect(page.getByText('Saved café data for this city has expired.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open café list' })).toBeVisible()
  await page.reload()
  await expect(page.getByText('This café is not available offline.')).toBeVisible()
  expect((await storage(page)).snapshots).toEqual([])
})

for (const status of [401, 403, 404, 429, 500, 503]) test(`HTTP ${status} ${status >= 500 ? 'uses matching saved fallback' : 'does not masquerade as saved success'}`, async ({ context, page }) => {
  await isolatedNetwork(context)
  await page.goto('/list'); await expect(page.getByText('Fixture Matcha', { exact: true })).toBeVisible(); await controlled(page)
  await context.unrouteAll(); await isolatedNetwork(context, status)
  await page.reload()
  if (status >= 500) {
    await expect(page.getByText(/Showing saved café data/)).toBeVisible()
    await expect(page.getByText('Fixture Matcha', { exact: true })).toBeVisible()
  } else {
    await expect(page.getByText('Unable to refresh café data right now.', { exact: true })).toBeVisible()
    await expect(page.getByText('Fixture Matcha', { exact: true })).toHaveCount(0)
  }
})
