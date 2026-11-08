import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { createSeoRoutes } from './seo'

function appFor(dependencies: Parameters<typeof createSeoRoutes>[0]) {
  const app = new Hono()
  app.route('/api', createSeoRoutes(dependencies))
  return app
}

describe('SEO endpoints', () => {
  const places = {
    async listPublishedSitemapPlaces() { return [{ slug: 'published-place', lastmod: '2026-11-01T00:00:00Z' }] },
    async getOgPlace(slug: string) {
      return slug === 'good' ? { name: 'Huế <b>đẹp</b>', shortDescription: 'Một & hai', description: null, image: null } : null
    },
  }

  it('generates sitemap for static pages and published place rows only', async () => {
    const response = await appFor({ places, appBaseUrl: 'https://hue.example' }).request('/api/sitemap.xml')
    const body = await response.text()
    expect(response.headers.get('cache-control')).toContain('s-maxage=3600')
    expect(body).toContain('https://hue.example/place/published-place')
    expect(body).toContain('https://hue.example/privacy')
    expect(body).not.toContain('draft')
  })

  it('escapes place OG metadata and returns 404 for missing places', async () => {
    const app = appFor({ places, appBaseUrl: 'https://hue.example' })
    const response = await app.request('/api/og/place/good')
    const html = await response.text()
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(html).toContain('Huế &lt;b&gt;đẹp&lt;/b&gt;')
    expect(html).toContain('Một &amp; hai')
    expect(html).toContain('https://hue.example/og-hue.svg')
    expect(await app.request('/api/og/place/missing')).toHaveProperty('status', 404)
  })

  it('returns generic share cards and never exposes trip title, owner, or notes', async () => {
    const app = appFor({ getSharedImage: async () => ({ image: 'https://images.example/cover.webp' }), appBaseUrl: 'https://hue.example' })
    const response = await app.request('/api/og/share/Abcdefghijklmnopqrstuv')
    const html = await response.text()
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-robots-tag')).toBe('noindex')
    expect(html).toContain('Lịch trình Huế được chia sẻ')
    expect(html).toContain('https://images.example/cover.webp')
    expect(html).not.toContain('Trip Secret Name')
    expect(html).not.toContain('Owner Email')
    expect(html).not.toContain('private note')
    expect((await app.request('/api/og/share/not-a-token')).status).toBe(404)
    const inactive = appFor({ getSharedImage: async () => null })
    expect((await inactive.request('/api/og/share/Abcdefghijklmnopqrstuv')).status).toBe(404)
  })

  it('serves robots rules including private areas and sitemap', async () => {
    const response = await appFor({ appBaseUrl: 'https://hue.example', places }).request('/api/robots.txt')
    const body = await response.text()
    expect(response.headers.get('content-type')).toContain('text/plain')
    expect(body).toContain('Disallow: /admin')
    expect(body).toContain('Disallow: /account')
    expect(body).toContain('Sitemap: https://hue.example/sitemap.xml')
  })
})
