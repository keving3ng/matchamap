import { test, expect } from '@playwright/test'

test('record cold 3G list timing separately from warm and offline (desktop emulation)', async ({ browser }, testInfo) => {
  test.setTimeout(150000)
  const measurements = []
  for (let run = 0; run < 3; run++) {
    const context = await browser.newContext({ viewport: { width: 320, height: 740 }, isMobile: true, deviceScaleFactor: 2, recordHar: { path: `/private/tmp/map5-evidence/cold-${run}.har` } })
    await context.route('**/*', async route => {
      const url = new URL(route.request().url())
      if (url.origin === 'http://localhost:4175') return route.continue()
      if (url.hostname === 'api.matchamap.club' && url.pathname === '/api/cafes') return route.fulfill({ json: { cafes: [{ id: 1, name: 'Performance Fixture', slug: 'performance-fixture', city: 'toronto', latitude: 43, longitude: -79, link: 'https://example.test', quickNote: 'Editorial fixture', drinks: [] }], total: 1, hasMore: false } })
      if (url.hostname === 'api.matchamap.club' && url.pathname === '/api/cities') return route.fulfill({ json: { cities: [] } })
      return route.abort()
    })
    await context.addInitScript(() => {
      const entries: Record<string, PerformanceEntry[]> = { 'largest-contentful-paint': [], 'layout-shift': [], longtask: [], event: [], 'first-input': [] }
      Object.assign(window, { __performanceFixture: entries })
      for (const type of Object.keys(entries)) try { new PerformanceObserver(list => entries[type].push(...list.getEntries())).observe({ type, buffered: true, ...(type === 'event' ? { durationThreshold: 16 } : {}) }) } catch { /* disclose missing entries */ }
    })
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1600000 / 8, uploadThroughput: 750000 / 8 })
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await page.goto('/list')
    await expect(page.getByText('Performance Fixture', { exact: true })).toBeVisible()
    // Retain enough timeline for a five-second CPU/network-quiet window.
    await page.waitForTimeout(5500)
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    await page.waitForTimeout(100)
    const cold = await page.evaluate(() => {
      const entries = (window as unknown as { __performanceFixture: Record<string, (PerformanceEntry & { value?: number; hadRecentInput?: boolean; processingStart?: number; interactionId?: number })[]> }).__performanceFixture
      const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null
      const lastLongTaskEnd = Math.max(fcp || 0, ...entries.longtask.map(t => t.startTime + t.duration))
      const resources = performance.getEntriesByType('resource').map(r => r.toJSON())
      const lastResourceEnd = Math.max(fcp || 0, ...performance.getEntriesByType('resource').map(r => r.startTime + r.duration))
      const quietStart = Math.max(lastLongTaskEnd, lastResourceEnd)
      return { fcp, lcp: entries['largest-contentful-paint'].at(-1)?.startTime ?? null,
        cls: entries['layout-shift'].filter(e => !e.hadRecentInput).reduce((sum, e) => sum + (e.value || 0), 0),
        fid: entries['first-input'][0] ? entries['first-input'][0].processingStart! - entries['first-input'][0].startTime : null,
        observedInteractionLatency: entries.event.filter(e => e.interactionId).map(e => e.duration),
        quietStart, quietDuration: performance.now() - quietStart,
        // This conservative quiet-window proxy is retained separately; it is not standardized TTI.
        longTasks: entries.longtask.map(e => e.toJSON()), resources,
        browser: navigator.userAgent,
      }
    })
    await page.evaluate(async () => { await navigator.serviceWorker.ready })
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: false })
    const warmStart = Date.now(); await page.reload(); await expect(page.getByText('Performance Fixture', { exact: true })).toBeVisible(); const warmReadyMs = Date.now() - warmStart
    await context.unrouteAll()
    await context.route('https://api.matchamap.club/**', route => route.abort('internetdisconnected'))
    await context.setOffline(true)
    const offlineStart = Date.now(); await page.reload(); await expect(page.getByText('Performance Fixture', { exact: true })).toBeVisible(); const offlineReadyMs = Date.now() - offlineStart
    measurements.push({ run, cold, warmReadyMs, offlineReadyMs })
    await context.close()
  }
  await testInfo.attach('mobile-timing-observations', { body: JSON.stringify({ profile: { downBps: 1600000, upBps: 750000, latencyMs: 150, cpuSlowdown: 4, viewport: '320x740', physicalDevice: false, api: 'synthetic', tti: 'unverified: no pinned trace-based TTI analyzer', inp: 'event durations for one menu interaction per fresh context; insufficient field interactions for standardized INP' }, measurements }, null, 2), contentType: 'application/json' })
  // Record failed gates without replacing them with a Lighthouse score/quiet-window proxy.
  expect(measurements.every(m => m.cold.lcp !== null && m.cold.lcp < 2500 && m.cold.cls < .1)).toBe(true)
})
