import { AxeBuilder } from '@axe-core/playwright'
import { chromium } from '@playwright/test'

const base = process.env.A11Y_BASE_URL ?? 'http://127.0.0.1:5173'
const placeSlug = process.env.A11Y_PLACE_SLUG ?? 'bun-bo-ba-tuyet'
const paths = ['/', '/explore', `/place/${encodeURIComponent(placeSlug)}`, '/map', '/plan/new', '/trip/draft', '/login', '/register', '/account/trips', '/s/not-a-valid-share-token']
const executablePath = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const browser = await chromium.launch({ headless: true, executablePath })
const results: Array<{ viewport: string; path: string; finalPath: string; serious: number; critical: number; violations: string[] }> = []

try {
  for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } })
    const page = await context.newPage()
    for (const path of paths) {
      await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(600)
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      results.push({
        viewport: viewport.name,
        path,
        finalPath: new URL(page.url()).pathname,
        serious: result.violations.filter(item => item.impact === 'serious').length,
        critical: result.violations.filter(item => item.impact === 'critical').length,
        violations: result.violations.map(item => `${item.impact ?? 'unknown'}:${item.id}:${item.nodes.length} [${item.nodes.slice(0, 3).map(node => node.target.join(' ')).join('; ')}]`),
      })
    }
    await context.close()
  }
} finally {
  await browser.close()
}

console.log('| Viewport | Route (final) | Critical | Serious | Violations |')
console.log('|---|---|---:|---:|---|')
for (const result of results) console.log(`| ${result.viewport} | ${result.path} (${result.finalPath}) | ${result.critical} | ${result.serious} | ${result.violations.join(', ') || 'none'} |`)
const critical = results.reduce((count, result) => count + result.critical, 0)
const serious = results.reduce((count, result) => count + result.serious, 0)
console.log(`\nAxe: ${results.length} page/viewport combinations; critical=${critical}; serious=${serious}.`)
if (critical > 0 || serious > 0) process.exitCode = 1
