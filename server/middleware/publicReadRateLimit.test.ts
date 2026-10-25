import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import type { ApiEnv } from '../types'
import { publicReadRateLimit } from './publicReadRateLimit'

describe('public read rate limit', () => {
  it('returns 429 with Retry-After after the IP limit and resets the window', async () => {
    let now = 1_000
    const app = new Hono<ApiEnv>()
    app.use('*', publicReadRateLimit(2, 60_000, () => now))
    app.get('/api/places', (context) => context.json({ items: [] }))

    const first = await app.request('/api/places', { headers: { 'x-forwarded-for': '203.0.113.10' } })
    const second = await app.request('/api/places', { headers: { 'x-forwarded-for': '203.0.113.10' } })
    const limited = await app.request('/api/places', { headers: { 'x-forwarded-for': '203.0.113.10' } })
    expect(first.status).toBe(200)
    expect(second.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(limited.status).toBe(429)
    expect(limited.headers.get('Retry-After')).toBe('60')
    expect((await limited.json()).error.code).toBe('RATE_LIMITED')

    now += 60_000
    const reset = await app.request('/api/places', { headers: { 'x-forwarded-for': '203.0.113.10' } })
    expect(reset.status).toBe(200)
  })
})
