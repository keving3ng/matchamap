import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const manifest = JSON.parse(readFileSync(dist + '.vite/manifest.json'))
const budget = 100 * 1024
let failed = false
for (const [route, root] of Object.entries({ map: 'MapView', list: 'ListView', detail: 'DetailView', help: 'InstallHelpView' })) {
  const files = new Set()
  const visited = new Set()
  function visit(key) {
    if (visited.has(key)) return
    visited.add(key)
    const item = manifest[key]
    if (!item) throw new Error(`Missing manifest entry: ${key}`)
    files.add(item.file)
    item.css?.forEach(file => files.add(file))
    item.imports?.forEach(visit)
  }
  visit('index.html')
  visit(`src/components/${root}.tsx`)
  const measured = [...files].filter(file => /\.(?:js|css)$/.test(file)).map(file => ({ file, gzip: gzipSync(readFileSync(dist + file)).length }))
  const gzip = measured.reduce((sum, item) => sum + item.gzip, 0)
  console.log(JSON.stringify({ route, gzip, budget, pass: gzip < budget, files: measured }))
  if (gzip >= budget) failed = true
}
if (failed) process.exitCode = 1
