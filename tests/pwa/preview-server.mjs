import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, extname } from 'node:path'
const root = resolve('frontend/dist')
let revision = 0, failInstall = false
const mime = { '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.html': 'text/html', '.png': 'image/png', '.ico': 'image/x-icon' }
const rules = readFileSync(root + '/_headers', 'utf8').trim().split(/\n\n+/).map(block => block.split('\n'))
createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost:4175')
  if (url.pathname === '/__fixture/version') {
    revision = Number(url.searchParams.get('revision') || 0)
    failInstall = url.searchParams.get('fail') === 'true'
    res.end('fixture changed'); return
  }
  if (failInstall && url.pathname.endsWith('/favicon.ico')) { res.writeHead(503); res.end('fixture install failure'); return }
  if (url.pathname === '/__harness') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><title>Isolated native cache fixture</title>'); return }
  if (url.pathname === '/__harness/harness.js') { res.setHeader('Content-Type', 'application/javascript'); res.end(readFileSync('/private/tmp/map5-evidence/harness/harness.js')); return }
  const pathname = decodeURIComponent(url.pathname)
  let file = resolve(root, '.' + pathname)
  if (!file.startsWith(root + '/') && file !== root) { res.writeHead(403); res.end(); return }
  if (!extname(pathname)) file = root + '/index.html'
  if (!existsSync(file)) { res.writeHead(404); res.end(); return }
  const headers = { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }
  for (const [pattern, ...lines] of rules) {
    if (!new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*') + '$').test(pathname)) continue
    for (const line of lines) {
      const match = line.trim().match(/^([^:]+):\s*(.*)$/)
      if (match) headers[match[1]] = match[2]
    }
  }
  let data = readFileSync(file)
  if (pathname === '/sw.js' && revision) data = Buffer.from(data.toString().replace(/matchamap-shell-'/, `matchamap-shell-fixture${revision}-'`))
  res.writeHead(200, headers); res.end(data)
}).listen(4175, 'localhost')
