import { Hono } from 'hono'
import { shareTokenSchema } from '@shared/schemas'
import { brand } from '../../src/lib/brand'
import { env } from '../lib/env'
import { createPublicSupabaseClient, createServiceRoleSupabaseClient } from '../lib/supabase'
import { errorHandler } from '../middleware/errorHandler'
import { PlaceService } from '../services/placeService'
import { SupabaseTripSharingRepository } from '../services/tripSharingRepository'
import type { ApiEnv } from '../types'

type SitemapPlace = { slug: string; lastmod: string }
type OgPlace = { name: string; description: string | null; shortDescription: string | null; image: string | null }
export type SeoRouteDependencies = {
  places?: { listPublishedSitemapPlaces(): Promise<SitemapPlace[]>; getOgPlace(slug: string): Promise<OgPlace | null> }
  getSharedImage?: (token: string) => Promise<{ image: string | null } | null>
  appBaseUrl?: string
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character)
}

function xmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character] ?? character)
}

function documentHtml(input: { title: string; description: string; image: string; url: string }): string {
  const title = escapeHtml(input.title)
  const description = escapeHtml(input.description)
  const image = escapeHtml(input.image)
  const url = escapeHtml(input.url)
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><meta property="og:type" content="website"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:image" content="${image}"><meta property="og:url" content="${url}"><meta name="twitter:card" content="summary_large_image"></head><body></body></html>`
}

export function createSeoRoutes(dependencies: SeoRouteDependencies = {}) {
  const routes = new Hono<ApiEnv>()
  routes.onError(errorHandler)
  const baseUrl = (requestUrl: string) => (dependencies.appBaseUrl ?? env.APP_BASE_URL ?? new URL(requestUrl).origin).replace(/\/$/, '')
  const defaultPlaces = () => {
    const service = new PlaceService(createPublicSupabaseClient())
    return {
      listPublishedSitemapPlaces: () => service.listPublishedSitemapPlaces(),
      async getOgPlace(slug: string): Promise<OgPlace | null> {
        const { data, error } = await createPublicSupabaseClient().from('places').select('name,short_description,description,cover_image_url').eq('slug', slug).eq('status', 'published').maybeSingle()
        if (error) throw new Error('Không thể tải metadata địa điểm.')
        return data ? { name: data.name, description: data.description, shortDescription: data.short_description, image: data.cover_image_url } : null
      },
    }
  }

  routes.get('/sitemap.xml', async (context) => {
    context.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    context.header('Content-Type', 'application/xml; charset=utf-8')
    const base = baseUrl(context.req.url)
    const staticPaths = ['/', '/explore', '/map', '/about', '/privacy']
    const places = await (dependencies.places ?? defaultPlaces()).listPublishedSitemapPlaces()
    const urls = [
      ...staticPaths.map(path => `<url><loc>${xmlEscape(`${base}${path}`)}</loc></url>`),
      ...places.map(place => `<url><loc>${xmlEscape(`${base}/place/${encodeURIComponent(place.slug)}`)}</loc><lastmod>${xmlEscape(place.lastmod)}</lastmod></url>`),
    ]
    return context.body(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`)
  })

  routes.get('/robots.txt', (context) => {
    context.header('Cache-Control', 'public, max-age=3600')
    context.header('Content-Type', 'text/plain; charset=utf-8')
    const base = baseUrl(context.req.url)
    return context.body(`User-agent: *\nDisallow: /admin\nDisallow: /account\nDisallow: /trip\nDisallow: /s\nDisallow: /plan/generating\nDisallow: /api\nSitemap: ${base}/sitemap.xml\n`)
  })

  routes.get('/og/place/:slug', async (context) => {
    const place = await (dependencies.places ?? defaultPlaces()).getOgPlace(context.req.param('slug'))
    if (!place) return context.text('Not found', 404)
    const base = baseUrl(context.req.url)
    const title = `${place.name} · ${brand.name}`
    const description = place.shortDescription || place.description || brand.description
    const image = place.image || `${base}/og-hue.svg`
    context.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    context.header('Content-Type', 'text/html; charset=utf-8')
    return context.body(documentHtml({ title, description, image, url: `${base}/place/${encodeURIComponent(context.req.param('slug'))}` }))
  })

  routes.get('/og/share/:token', async (context) => {
    context.header('Cache-Control', 'no-store')
    context.header('X-Robots-Tag', 'noindex')
    const parsed = shareTokenSchema.safeParse(context.req.param('token'))
    if (!parsed.success) return context.text('Not found', 404)
    const shared = await (dependencies.getSharedImage ?? (async (token: string) => {
      const client = createServiceRoleSupabaseClient()
      const trip = await new SupabaseTripSharingRepository(client, client).getSharedByToken(token)
      const firstPlace = trip?.days.flatMap(day => day.items).find(item => item.place?.coverImageUrl)?.place
      return trip ? { image: firstPlace?.coverImageUrl ?? null } : null
    }))(parsed.data)
    if (!shared) return context.text('Not found', 404)
    const base = baseUrl(context.req.url)
    context.header('Content-Type', 'text/html; charset=utf-8')
    return context.body(documentHtml({ title: `Lịch trình Huế được chia sẻ · ${brand.name}`, description: 'Xem lịch trình khám phá Huế được chia sẻ.', image: shared.image || `${base}/og-hue.svg`, url: `${base}/s/${encodeURIComponent(parsed.data)}` }))
  })
  return routes
}
