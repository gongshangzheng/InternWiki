#!/usr/bin/env node
/**
 * InternWiki dev server health check.
 *
 * Usage:
 *   node check-server.mjs           # exit 0 if up, exit 1 if down
 *   node check-server.mjs --wait    # poll every 500ms until up (max 30s)
 *   node check-server.mjs --port 5183
 */

import { request } from 'node:http'

const args = process.argv.slice(2)
const PORT = (() => {
  const i = args.indexOf('--port')
  return i !== -1 ? Number(args[i + 1]) : 5183
})()
const WAIT = args.includes('--wait')
const BASE = '/InternWiki/'
const MAX_WAIT_MS = 30_000
const POLL_MS = 500

function probe() {
  return new Promise((resolve) => {
    const req = request({ hostname: 'localhost', port: PORT, path: BASE, method: 'GET' }, (res) => {
      resolve(res.statusCode)
    })
    req.on('error', () => resolve(null))
    req.setTimeout(1000, () => { req.destroy(); resolve(null) })
    req.end()
  })
}

async function main() {
  if (!WAIT) {
    const code = await probe()
    if (code !== null) {
      console.log(`✓ InternWiki is up at http://localhost:${PORT}${BASE} (HTTP ${code})`)
      process.exit(0)
    } else {
      console.log(`✗ InternWiki is not running on port ${PORT}`)
      process.exit(1)
    }
  }

  const deadline = Date.now() + MAX_WAIT_MS
  process.stdout.write(`Waiting for InternWiki on port ${PORT}`)
  while (Date.now() < deadline) {
    const code = await probe()
    if (code !== null) {
      process.stdout.write('\n')
      console.log(`✓ Ready at http://localhost:${PORT}${BASE} (HTTP ${code})`)
      process.exit(0)
    }
    process.stdout.write('.')
    await new Promise((r) => setTimeout(r, POLL_MS))
  }
  process.stdout.write('\n')
  console.error(`✗ Timed out after ${MAX_WAIT_MS / 1000}s — server did not start`)
  process.exit(1)
}

main()
