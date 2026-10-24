import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAppRoutes, routePaths } from './router'
import { paths } from './paths'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const userId = 'a0000000-0000-4000-8000-000000000001'
const testSession = {
  access_token: 'test-session-token', token_type: 'bearer', expires_in: 3600,
  expires_at: 4_000_000_000, refresh_token: 'test-refresh-token',
  user: {
    id: userId, aud: 'authenticated', role: 'authenticated', email: 'traveler@example.test',
    app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {},
    created_at: '2026-01-01T00:00:00.000Z', is_anonymous: false,
  },
} as unknown as Session

function mockClient(session: Session | null): SupabaseClient {
  const client = {
    auth: {
      onAuthStateChange(callback: (event: string, session: Session | null) => void) {
        callback('INITIAL_SESSION', session)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      },
      getSession: async () => ({ data: { session }, error: null }),
    },
  }
  return client as unknown as SupabaseClient
}

function profileResponse(role: 'user' | 'admin') {
  return {
    id: userId, email: 'traveler@example.test', displayName: 'Người đi Huế',
    avatarUrl: null, role,
  }
}

async function renderPath(path: string, session: Session | null = null, role: 'user' | 'admin' = 'user') {
  if (session) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => profileResponse(role),
    }))
  }
  const router = createMemoryRouter(createAppRoutes(mockClient(session)), { initialEntries: [path] })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const tree = <QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>
  await act(async () => {
    root.render(tree)
    await new Promise(resolve => window.setTimeout(resolve, 250))
  })
  return {
    router,
    container,
    async cleanup() {
      await act(async () => root.unmount())
      queryClient.clear()
      container.remove()
    },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  window.localStorage?.clear()
})

const documentedRoutes: Array<{ label: string; path: string; expected: string }> = [
  { label: 'landing', path: paths.home, expected: paths.home },
  { label: 'explore', path: paths.explore, expected: paths.explore },
  { label: 'place detail', path: paths.place('sample-place'), expected: paths.place('sample-place') },
  { label: 'map', path: paths.map, expected: paths.map },
  { label: 'about', path: paths.about, expected: paths.about },
  { label: 'privacy', path: paths.privacy, expected: paths.privacy },
  { label: 'plan wizard', path: paths.planNew, expected: paths.planNew },
  { label: 'plan generating guard', path: paths.planGenerating, expected: paths.planNew },
  { label: 'trip draft guard', path: paths.tripDraft, expected: paths.planNew },
  { label: 'saved trip guard', path: paths.trip('c0000000-0000-4000-8000-000000000003'), expected: paths.login },
  { label: 'shared trip', path: paths.sharedTrip('sample-token'), expected: paths.sharedTrip('sample-token') },
  { label: 'login', path: paths.login, expected: paths.login },
  { label: 'register', path: paths.register, expected: paths.register },
  { label: 'forgot password', path: paths.forgotPassword, expected: paths.forgotPassword },
  { label: 'reset password', path: paths.resetPassword, expected: paths.resetPassword },
  { label: 'auth callback', path: paths.authCallback, expected: paths.authCallback },
  { label: 'account index guard', path: paths.account, expected: paths.login },
  { label: 'account trips guard', path: paths.accountTrips, expected: paths.login },
  { label: 'account saved guard', path: paths.accountSaved, expected: paths.login },
  { label: 'account settings guard', path: paths.accountSettings, expected: paths.login },
  { label: 'admin index guard', path: paths.admin, expected: paths.login },
  { label: 'admin places guard', path: paths.adminPlaces, expected: paths.login },
  { label: 'admin create guard', path: paths.adminPlaceNew, expected: paths.login },
  { label: 'admin edit guard', path: paths.adminPlace('c0000000-0000-4000-8000-000000000003'), expected: paths.login },
  { label: 'admin import guard', path: paths.adminImport, expected: paths.login },
  { label: 'forbidden page', path: paths.forbidden, expected: paths.forbidden },
  { label: 'not found', path: '/route-that-does-not-exist', expected: '/route-that-does-not-exist' },
]

describe('memory router for every route in docs/04', () => {
  it.each(documentedRoutes)('$label resolves to its page or expected guard redirect', async ({ path, expected }) => {
    const rendered = await renderPath(path)
    try {
      expect(rendered.router.state.location.pathname).toBe(expected)
    } finally {
      await rendered.cleanup()
    }
  })

  it('admits a persisted Supabase session to protected account routes', async () => {
    const rendered = await renderPath(paths.accountTrips, testSession)
    try {
      expect(rendered.router.state.location.pathname).toBe(paths.accountTrips)
    } finally {
      await rendered.cleanup()
    }
  })

  it('routes a persisted Supabase session away from guest pages using safe next', async () => {
    const rendered = await renderPath(`${paths.login}?next=%2Fexplore`, testSession)
    try {
      expect(rendered.router.state.location.pathname).toBe(paths.explore)
    } finally {
      await rendered.cleanup()
    }
  })

  it('loads profile role before allowing or denying admin routes', async () => {
    const regular = await renderPath(paths.adminPlaces, testSession, 'user')
    try {
      expect(regular.router.state.location.pathname).toBe(paths.adminPlaces)
      expect(vi.mocked(fetch)).toHaveBeenCalled()
      await vi.waitFor(() => expect(regular.container.textContent).toContain('Bạn chưa có quyền truy cập'))
    } finally {
      await regular.cleanup()
    }

    const admin = await renderPath(paths.adminPlaces, testSession, 'admin')
    try {
      expect(admin.router.state.location.pathname).toBe(paths.adminPlaces)
      await vi.waitFor(() => expect(admin.container.textContent).toContain('Quản trị nội dung'))
      const request = vi.mocked(fetch).mock.calls[0]
      expect(new Headers(request?.[1]?.headers).get('Authorization')).toBe('Bearer test-session-token')
    } finally {
      await admin.cleanup()
    }
  })

  it('registers all documented paths in its route manifest', () => {
    expect(routePaths).toEqual(expect.arrayContaining([
      paths.home, paths.explore, paths.placePattern, paths.map, paths.about, paths.privacy,
      paths.planNew, paths.planGenerating, paths.tripDraft, paths.tripPattern, paths.sharedTripPattern,
      paths.login, paths.register, paths.forgotPassword, paths.resetPassword, paths.authCallback,
      paths.account, paths.accountTrips, paths.accountSaved, paths.accountSettings,
      paths.admin, paths.adminPlaces, paths.adminPlaceNew, paths.adminPlacePattern, paths.adminImport,
      paths.forbidden, '*',
    ]))
  })
})
