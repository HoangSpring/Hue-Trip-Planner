import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../authState'
import { PublicLayout } from './PublicLayout'
import { paths } from '../paths'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const mockUserId = 'a0000000-0000-4000-8000-000000000001'

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

async function renderPublicLayout(session: Session | null = null, profileData?: { displayName?: string | null }) {
  if (session && profileData) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: session.user.id,
        email: session.user.email,
        displayName: profileData.displayName ?? null,
        avatarUrl: null,
        role: 'user',
      }),
    }))
  }

  const router = createMemoryRouter([
    {
      element: (
        <AuthProvider client={mockClient(session)}>
          <PublicLayout />
        </AuthProvider>
      ),
      children: [
        { path: '/', element: <div>Nội dung trang chủ</div> },
      ],
    },
  ], { initialEntries: ['/'] })

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)

  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )
    await new Promise(resolve => window.setTimeout(resolve, 150))
  })

  return {
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
  globalThis.localStorage.clear()
})

async function waitForText(container: HTMLElement, text: string) {
  for (let attempt = 0; attempt < 40 && !container.textContent?.includes(text); attempt += 1) {
    await act(async () => new Promise(resolve => window.setTimeout(resolve, 25)))
  }
  expect(container.textContent).toContain(text)
}

describe('PublicLayout Navbar', () => {
  it('renders sticky header container with proper styling classes', async () => {
    const rendered = await renderPublicLayout(null)
    try {
      const header = rendered.container.querySelector('header')
      expect(header).not.toBeNull()
      expect(header?.className).toContain('sticky')
      expect(header?.className).toContain('top-0')
      expect(header?.className).toContain('z-50')
    } finally {
      await rendered.cleanup()
    }
  })

  it('displays "Đăng nhập" linking to /login when user is not authenticated', async () => {
    const rendered = await renderPublicLayout(null)
    try {
      const loginLinks = rendered.container.querySelectorAll(`a[href="${paths.login}"]`)
      expect(loginLinks.length).toBeGreaterThan(0)

      const headerText = rendered.container.querySelector('header')?.textContent
      expect(headerText).toContain('Đăng nhập')
    } finally {
      await rendered.cleanup()
    }
  })

  it('displays user displayName and links to /account/settings when authenticated', async () => {
    const authenticatedSession = {
      access_token: 'test-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: 4_000_000_000,
      refresh_token: 'test-refresh-token',
      user: {
        id: mockUserId,
        aud: 'authenticated',
        role: 'authenticated',
        email: 'leloi@example.test',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: {},
        created_at: '2026-01-01T00:00:00.000Z',
        is_anonymous: false,
      },
    } as unknown as Session

    const rendered = await renderPublicLayout(authenticatedSession, { displayName: 'Lê Lợi' })
    try {
      await waitForText(rendered.container, 'Lê Lợi')

      const headerText = rendered.container.querySelector('header')?.textContent
      expect(headerText).toContain('Lê Lợi')
      expect(headerText).not.toContain('Đăng nhập')

      // Desktop link to account settings
      const settingsLink = rendered.container.querySelector(`header a[href="${paths.accountSettings}"]`)
      expect(settingsLink).not.toBeNull()
      expect(settingsLink?.textContent).toContain('Lê Lợi')

      // Initial letter in avatar circle
      const avatarBadge = settingsLink?.querySelector('span[aria-hidden="true"]')
      expect(avatarBadge?.textContent).toBe('L')

      // Bottom mobile navigation should link "Tôi" to account trips
      const mobileNav = rendered.container.querySelector('nav[aria-label="Điều hướng trên thiết bị di động"]')
      const myTripsTab = mobileNav?.querySelector(`a[href="${paths.accountTrips}"]`)
      expect(myTripsTab).not.toBeNull()
    } finally {
      await rendered.cleanup()
    }
  })

  it('falls back to user_metadata or email username if displayName is missing', async () => {
    const authenticatedSession = {
      access_token: 'test-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: 4_000_000_000,
      refresh_token: 'test-refresh-token',
      user: {
        id: mockUserId,
        aud: 'authenticated',
        role: 'authenticated',
        email: 'traveler_hue@example.test',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: { full_name: 'Nguyễn Du' },
        created_at: '2026-01-01T00:00:00.000Z',
        is_anonymous: false,
      },
    } as unknown as Session

    const rendered = await renderPublicLayout(authenticatedSession, { displayName: null })
    try {
      const headerText = rendered.container.querySelector('header')?.textContent
      expect(headerText).toContain('Nguyễn Du')
      expect(headerText).not.toContain('Đăng nhập')
    } finally {
      await rendered.cleanup()
    }
  })
})
