import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'

const envFile = fileURLToPath(new URL('../.env.local', import.meta.url))
try {
  const contents = readFileSync(envFile, 'utf8')
  for (const line of contents.split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line)
    if (!match || match[1].startsWith('#') || process.env[match[1]]) continue
    const value = match[2].replace(/^(['"])(.*)\1$/, '$2').replace(/\s+#.*$/, '')
    process.env[match[1]] = value
  }
} catch {
  // The frontend can run without the API; this message contains no environment values.
  console.warn('.env.local was not found; API requests may fail until configured.')
}

process.env.SUPABASE_URL ||= process.env.VITE_SUPABASE_URL
process.env.SUPABASE_ANON_KEY ||= process.env.VITE_SUPABASE_ANON_KEY

const { app } = await import('../server/app')
const port = 8787
serve({ fetch: app.fetch, hostname: '127.0.0.1', port }, (info) => {
  console.info(`Local API listening at http://127.0.0.1:${info.port}`)
})
