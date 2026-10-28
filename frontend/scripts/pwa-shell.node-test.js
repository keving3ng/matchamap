import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { collectShellFiles, shellWorker, PUBLIC_ROOTS, PUBLIC_FILES, MAX_PRECACHE_BYTES } from './pwa-shell.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const chunk = (name, facade, imports = []) => ({ type: 'chunk', fileName: name, facadeModuleId: '/project/' + facade, imports, dynamicImports: ['assets/AdminLayout-private.js'], code: name, viteMetadata: { importedCss: new Set(), importedAssets: new Set() } })
function bundle() {
  const result = { 'index.html': { type: 'asset', source: '<html>shell</html>' } }
  PUBLIC_ROOTS.forEach((facade, i) => { result[`assets/public${i}.js`] = chunk(`assets/public${i}.js`, facade, ['assets/vendor.js']) })
  result['assets/vendor.js'] = chunk('assets/vendor.js', null)
  result['assets/AdminLayout-private.js'] = chunk('assets/AdminLayout-private.js', 'src/components/admin/AdminLayout.tsx')
  result['assets/public0.js'].viteMetadata.importedCss.add('assets/style.css')
  result['assets/style.css'] = { type: 'asset', source: '.marker{background:url(/assets/marker.png)}' }
  result['assets/marker.png'] = { type: 'asset', source: Buffer.from('icon') }
  return result
}
function emit(input = bundle()) {
  const emitted = []
  const plugin = shellWorker()
  plugin.configResolved({ root })
  plugin.generateBundle.handler.call({ emitFile: item => emitted.push(item) }, {}, input)
  return Object.fromEntries(emitted.map(item => [item.fileName, item.source]))
}

test('build includes only public roots, static dependencies, CSS and referenced local icons', () => {
  const files = collectShellFiles(bundle())
  assert(files.includes('assets/vendor.js'))
  assert(files.includes('assets/style.css'))
  assert(files.includes('assets/marker.png'))
  assert(!files.includes('assets/AdminLayout-private.js'))
  const merged = bundle(); merged['assets/public0.js'].modules = { '/project/src/components/admin/AdminLayout.tsx': {} }
  assert.throws(() => collectShellFiles(merged), /Private route module/)
  const bad = bundle(); bad['assets/public0.js'].imports.push('assets/AdminLayout-private.js')
  assert.throws(() => collectShellFiles(bad), /Private\/non-shell/)
  delete bad['assets/public1.js']
  assert.throws(() => collectShellFiles(bad))
})

test('build measures bytes, generates a content version, and rejects oversized precaches', () => {
  const first = emit(), report = JSON.parse(first['shell-precache.json'])
  assert(report.bytes < MAX_PRECACHE_BYTES)
  assert(PUBLIC_FILES.every(file => report.files.some(item => item.url === '/' + file)))
  assert.equal(report.bytes, report.files.reduce((sum, item) => sum + item.bytes, 0))
  assert(!first['sw.js'].includes('__PRECACHE_URLS__'))
  assert.equal(first['sw.js'], emit()['sw.js'])
  const changed = bundle(); changed['assets/vendor.js'].code += 'changed'
  assert.notEqual(report.version, JSON.parse(emit(changed)['shell-precache.json']).version)
  changed['assets/vendor.js'].code = 'x'.repeat(MAX_PRECACHE_BYTES)
  assert.throws(() => emit(changed), /exceeds/)
})

test('manifest identity and PNG dimensions match actual icon files; artwork is not claimed maskable', () => {
  const manifest = JSON.parse(readFileSync(root + 'public/site.webmanifest'))
  for (const field of ['id', 'name', 'short_name', 'start_url', 'scope', 'theme_color', 'background_color']) assert(manifest[field])
  assert.equal(manifest.id, '/'); assert.equal(manifest.start_url, '/'); assert.equal(manifest.scope, '/')
  assert.equal(manifest.display, 'standalone')
  for (const icon of [...manifest.icons, { src: '/apple-touch-icon.png', sizes: '180x180' }]) {
    const png = readFileSync(root + 'public' + icon.src)
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes)
    assert.notEqual(icon.purpose, 'maskable')
  }
})

test('Pages rules revalidate shell resources without joining no-cache onto immutable assets', () => {
  const rules = readFileSync(root + 'public/_headers', 'utf8').split(/\n\n+/).map(block => block.split('\n'))
  const values = url => rules.filter(([pattern]) => new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*') + '$').test(url))
    .flatMap(lines => lines.slice(1).filter(line => line.trim().startsWith('Cache-Control:')).map(line => line.trim().slice('Cache-Control:'.length).trim()))
  for (const url of ['/', '/list', '/list/', '/install', '/install/', '/tor/cafe', '/login', '/admin/cafes', '/events/1', '/index.html', '/sw.js', '/site.webmanifest']) assert.deepEqual(values(url), ['no-cache'], url)
  assert.deepEqual(values('/assets/index-hash.js'), ['public, max-age=31536000, immutable'])
})

function worker() {
  const handlers = {}, storage = new Map(), requests = []
  let fetcher = async request => { requests.push(request); return new Response('asset') }
  const caches = {
    open: async name => {
      if (!storage.has(name)) storage.set(name, new Map())
      const data = storage.get(name)
      return { put: async (url, response) => data.set(url, response), match: async url => data.get(url)?.clone() }
    },
    keys: async () => [...storage.keys()],
    delete: async name => storage.delete(name),
  }
  const context = { self: { location: { origin: 'https://matchamap.test' }, addEventListener: (name, handler) => { handlers[name] = handler } }, caches, URL, Request: class extends Request { constructor(url, options) { super(new URL(url, 'https://matchamap.test'), options) } }, fetch: (...args) => fetcher(...args) }
  const source = readFileSync(root + 'src/pwa/service-worker.js', 'utf8').replace('__PRECACHE_URLS__', JSON.stringify(['/index.html', '/assets/app.js'])).replace('__CACHE_VERSION__', '"test"')
  vm.runInNewContext(source, context)
  return {
    storage, requests, setFetch: fn => { fetcher = fn },
    lifecycle: name => { let promise; handlers[name]({ waitUntil: p => { promise = p } }); return promise },
    request: (path, options = {}) => { let promise; handlers.fetch({ request: { url: new URL(path, 'https://matchamap.test').href, method: 'GET', mode: 'cors', ...options }, respondWith: p => { promise = p } }); return promise },
  }
}

test('install is anonymous and atomic; activation deletes only obsolete app-owned shell caches', async () => {
  const w = worker()
  await w.lifecycle('install')
  assert.equal(w.requests.length, 2)
  assert(w.requests.every(request => request.credentials === 'omit' && request.cache === 'reload' && request.redirect === 'error'))
  w.storage.set('matchamap-shell-old', new Map()); w.storage.set('other-app', new Map()); w.storage.set('workbox-unknown', new Map())
  await w.lifecycle('activate')
  assert.deepEqual([...w.storage.keys()].sort(), ['matchamap-shell-test', 'other-app', 'workbox-unknown'])
  const bad = worker(); bad.storage.set('matchamap-shell-old', new Map())
  bad.setFetch(async () => new Response('error', { status: 500 }))
  await assert.rejects(bad.lifecycle('install'))
  assert.deepEqual([...bad.storage.keys()], ['matchamap-shell-old'])
})

test('offline shell and assets are served only on allowlisted public paths; no runtime writes', async () => {
  const w = worker(); await w.lifecycle('install')
  w.setFetch(async () => { throw new Error('offline') })
  for (const route of ['/list', '/install', '/install/']) assert.equal(await (await w.request(route, { mode: 'navigate' })).text(), 'asset')
  assert.equal(await (await w.request('/tor/cafe-name', { mode: 'navigate' })).text(), 'asset')
  assert.equal(await (await w.request('/assets/app.js')).text(), 'asset')
  for (const path of ['/api/cafes', '/api/admin', '/admin', '/login', '/events', '/other/unknown', '/assets/private.js', '/assets/app.js?v=private', 'https://tiles.test/1.png']) {
    assert.equal(w.request(path, { mode: path.startsWith('/assets') || path.includes('api') ? 'cors' : 'navigate' }), undefined, path)
  }
  assert.equal(w.request('/list', { method: 'POST', mode: 'navigate' }), undefined)
  w.setFetch(async () => new Response('denied', { status: 401 }))
  assert.equal((await w.request('/list', { mode: 'navigate' })).status, 401)
  assert.equal(w.storage.get('matchamap-shell-test').size, 2)
})
