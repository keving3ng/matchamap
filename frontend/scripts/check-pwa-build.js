import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { MAX_PRECACHE_BYTES } from './pwa-shell.js'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const report = JSON.parse(readFileSync(dist + 'shell-precache.json'))
let bytes = 0, gzipBytes = 0
for (const item of report.files) {
  assert(/^\/(?:index\.html|site\.webmanifest|[\w-]+\.(?:png|ico)|assets\/[\w.-]+\.(?:js|css|png))$/.test(item.url), `Invalid precache path: ${item.url}`)
  assert(!/admin|login|management|importer|events|passport|\.map$/i.test(item.url), `Non-shell asset: ${item.url}`)
  const data = readFileSync(dist + item.url.slice(1))
  assert.equal(data.length, item.bytes, `Build changed after shell generation: ${item.url}`)
  bytes += data.length; gzipBytes += gzipSync(data).length
}
assert.equal(bytes, report.bytes)
assert(bytes <= MAX_PRECACHE_BYTES)
const worker = readFileSync(dist + 'sw.js', 'utf8')
assert(!/__PRECACHE_URLS__|__CACHE_VERSION__|workbox/i.test(worker))
assert.deepEqual(readdirSync(dist).filter(file => /^(?:sw\.js|workbox-.*\.js|registerSW\.js|manifest\.webmanifest)$/.test(file)), ['sw.js'])
console.log(`Shell precache: ${report.files.length} files, ${bytes} bytes raw, ${gzipBytes} bytes gzip, version ${report.version}`)
