import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'

export const MAX_PRECACHE_BYTES = 2 * 1024 * 1024
export const PUBLIC_ROOTS = ['index.html', 'src/components/MapView.tsx', 'src/components/ListView.tsx', 'src/components/DetailView.tsx', 'src/components/InstallHelpView.tsx']
export const PUBLIC_FILES = ['site.webmanifest', 'android-chrome-192x192.png', 'android-chrome-512x512.png', 'apple-touch-icon.png', 'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png']

// Follow static imports only: lazy routes need explicit approval to enter here.
export function collectShellFiles(bundle) {
  const files = new Set(['index.html'])
  const visit = (file) => {
    if (files.has(file)) return
    const item = bundle[file]
    if (!item) throw new Error(`Missing shell dependency: ${file}`)
    if (/admin|login|management|importer|events|passport/i.test(file)) throw new Error(`Private/non-shell chunk in precache: ${file}`)
    files.add(file)
    if (item.type === 'chunk') {
      if (Object.keys(item.modules || {}).some(id => /\/src\/components\/(?:admin|auth)\//.test(id.replaceAll('\\', '/')))) {
        throw new Error(`Private route module merged into shell chunk: ${file}`)
      }
      item.imports.forEach(visit)
      item.viteMetadata?.importedCss?.forEach(visit)
      item.viteMetadata?.importedAssets?.forEach(visit)
    } else if (file.endsWith('.css')) {
      for (const match of String(item.source).matchAll(/url\(["']?\/?(assets\/[^)"']+)["']?\)/g)) visit(match[1])
    }
  }
  for (const root of PUBLIC_ROOTS) {
    const chunk = Object.values(bundle).find(item => item.type === 'chunk' && item.facadeModuleId?.replaceAll('\\', '/').endsWith('/' + root))
    if (!chunk) throw new Error(`Missing public shell root: ${root}`)
    visit(chunk.fileName)
  }
  return [...files].sort()
}

export function shellWorker() {
  let root
  return {
    name: 'matchamap-shell-worker',
    apply: 'build',
    enforce: 'post',
    configResolved(config) { root = config.root },
    generateBundle: { order: 'post', handler(_options, bundle) {
      const files = collectShellFiles(bundle)
      const payloads = new Map(files.map(file => {
        const item = bundle[file]
        return [file, Buffer.from(item.type === 'chunk' ? item.code : item.source)]
      }))
      for (const file of PUBLIC_FILES) payloads.set(file, readFileSync(path.join(root, 'public', file)))
      const entries = [...payloads].sort(([a], [b]) => a.localeCompare(b))
      const bytes = entries.reduce((sum, [, value]) => sum + value.length, 0)
      if (bytes > MAX_PRECACHE_BYTES) throw new Error(`Shell precache ${bytes} exceeds ${MAX_PRECACHE_BYTES} bytes`)
      const digest = createHash('sha256')
      const template = readFileSync(path.join(root, 'src/pwa/service-worker.js'), 'utf8')
      digest.update(template)
      for (const [file, value] of entries) digest.update(file).update('\0').update(value).update('\0')
      const version = digest.digest('hex').slice(0, 20)
      const urls = entries.map(([file]) => '/' + file)
      const source = template
        .replace('__PRECACHE_URLS__', JSON.stringify(urls))
        .replace('__CACHE_VERSION__', JSON.stringify(version))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
      this.emitFile({ type: 'asset', fileName: 'shell-precache.json', source: JSON.stringify({ version, bytes, files: entries.map(([file, value]) => ({ url: '/' + file, bytes: value.length })) }, null, 2) })
    } },
  }
}
