import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PlaceSummary } from '@shared/schemas'

const authMock = vi.hoisted(() => ({ current: { status: 'anonymous' as 'anonymous' | 'authenticated', session: null as { access_token: string } | null, user: null as { id: string } | null, isLoading: false, isAuthenticated: false } }))
vi.mock('@/features/auth/hooks/useSession', () => ({ useSession: () => authMock.current }))

import { SavedPlaceButton } from './SavedPlaceButton'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const place: PlaceSummary = {
  id: 'b0000000-0000-4000-8000-000000000001', slug: 'dai-noi', name: 'Đại Nội', category: 'heritage',
  shortDescription: null, area: null, lat: 16.46, lng: 107.59, coverImageUrl: null, coverImageAlt: null,
  imageCredit: null, imageLicense: null, imageSourceUrl: null, tags: [], verified: true,
}

function mount() {
  const container = document.createElement('div')
  const root = createRoot(container)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  act(() => root.render(<QueryClientProvider client={client}><MemoryRouter><SavedPlaceButton place={place}/></MemoryRouter></QueryClientProvider>))
  return { container, root, client }
}

describe('SavedPlaceButton', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
    authMock.current = { status: 'anonymous', session: null, user: null, isLoading: false, isAuthenticated: false }
  })

  it('prompts guests and saves pending_action before login', () => {
    const { container, root, client } = mount()
    act(() => container.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(container.textContent).toContain('Đăng nhập để lưu địa điểm')
    expect(localStorage.getItem('pending_action')).toBe(`save_place:${place.id}`)
    act(() => root.unmount())
    client.clear()
  })

  it('optimistically saves for an authenticated user and sends the bearer token', async () => {
    authMock.current = { status: 'authenticated', session: { access_token: 'fake-jwt' }, user: { id: 'a0000000-0000-4000-8000-000000000001' }, isLoading: false, isAuthenticated: true }
    let serverSaved = false
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/saved') return new Response(JSON.stringify({ items: serverSaved ? [place] : [] }), { status: 200 })
      if (url.endsWith(`/api/saved/${place.id}`) && init?.method === 'PUT') { serverSaved = true; return new Response(null, { status: 204 }) }
      return new Response(null, { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const { container, root, client } = mount()
    const button = container.querySelector('button')!
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })
    await act(async () => { button.dispatchEvent(new MouseEvent('click', { bubbles: true })); await new Promise(resolve => setTimeout(resolve, 30)) })
    expect(button.getAttribute('aria-pressed')).toBe('true')
    const put = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith(`/api/saved/${place.id}`) && init?.method === 'PUT')
    expect(put).toBeDefined()
    expect(new Headers(put?.[1]?.headers).get('Authorization')).toBe('Bearer fake-jwt')
    act(() => root.unmount())
    client.clear()
  })

  it('shows the API save failure and lets the user retry after rolling back', async () => {
    authMock.current = { status: 'authenticated', session: { access_token: 'fake-jwt' }, user: { id: 'a0000000-0000-4000-8000-000000000001' }, isLoading: false, isAuthenticated: true }
    let failed = false
    let serverSaved = false
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === '/api/saved') return new Response(JSON.stringify({ items: serverSaved ? [place] : [] }), { status: 200 })
      if (String(input).endsWith(`/api/saved/${place.id}`) && init?.method === 'PUT') {
        if (!failed) {
          failed = true
          return new Response(JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Chưa thể lưu địa điểm lúc này.', requestId: 'req_test' } }), { status: 503 })
        }
        serverSaved = true
        return new Response(null, { status: 204 })
      }
      return new Response(null, { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const { container, root, client } = mount()
    const button = container.querySelector('button')!
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })
    await act(async () => { button.dispatchEvent(new MouseEvent('click', { bubbles: true })); await new Promise(resolve => setTimeout(resolve, 30)) })
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Chưa thể lưu địa điểm lúc này.')
    expect(button.getAttribute('aria-pressed')).toBe('false')
    const retry = [...container.querySelectorAll('button')].find(candidate => candidate.textContent === 'Thử lại')
    expect(retry).toBeDefined()
    await act(async () => { retry?.dispatchEvent(new MouseEvent('click', { bubbles: true })); await new Promise(resolve => setTimeout(resolve, 30)) })
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelector('[role="alert"]')).toBeNull()
    act(() => root.unmount())
    client.clear()
  })
})
