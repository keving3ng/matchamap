/* Build placeholders are replaced only by scripts/pwa-shell.js. */
/* eslint-disable no-undef -- build-time constants replaced by pwa-shell.js */
const PRECACHE_URLS = __PRECACHE_URLS__
const CACHE_NAME = 'matchamap-shell-' + __CACHE_VERSION__
const OWNED_PREFIX = 'matchamap-shell-'
const PUBLIC_PATH = /^(?:\/|\/index\.html|\/(?:list|install)\/?|\/(?:TOR|MTL|NYC|MIS|SCA|TYO|KYO|OSA)\/[^/]+\/?)$/i

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const responses = await Promise.all(PRECACHE_URLS.map(async url => {
        const response = await fetch(new Request(url, { credentials: 'omit', cache: 'reload', redirect: 'error' }))
        if (!response.ok || response.type === 'opaque') throw new Error('Shell asset unavailable')
        return [url, response]
      }))
      const cache = await caches.open(CACHE_NAME)
      await Promise.all(responses.map(([url, response]) => cache.put(url, response)))
    } catch (error) {
      await caches.delete(CACHE_NAME)
      throw error
    }
    // Natural activation waits for old controlled tabs to close. Never force
    // a reload or replace an editor's worker midway through an interaction.
  })())
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter(key => key.startsWith(OWNED_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)))
  })())
})

self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (request.mode === 'navigate') {
    if (!PUBLIC_PATH.test(url.pathname)) return
    event.respondWith((async () => {
      try { return await fetch(request) } catch (error) {
        const shell = await (await caches.open(CACHE_NAME)).match('/index.html')
        if (shell) return shell
        throw error
      }
    })())
  } else if (!url.search && PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith((async () => (await (await caches.open(CACHE_NAME)).match(url.pathname)) || fetch(request))())
  }
  // All other requests (APIs, tiles, photos, admin) use the browser network.
  // No runtime response is persisted.
})
