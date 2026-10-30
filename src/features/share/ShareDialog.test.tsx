import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Trip } from '@shared/schemas'
import { ShareDialog } from './ShareDialog'

const auth = vi.hoisted(() => ({ current: { session: { access_token: 'test-token' } } }))
vi.mock('@/features/auth/hooks/useSession', () => ({ useSession: () => auth.current }))
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
const trip = { id: 'd0000000-0000-4000-8000-000000000004', title: 'Huế 2 ngày', isShared: false, shareToken: null } as Trip

describe('ShareDialog', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ isShared: true, shareToken: 'AAAAAAAAAAAAAAAAAAAAAA', shareUrl: 'https://example.test/s/AAAAAAAAAAAAAAAAAAAAAA' }), { status: 200 }))))

  it('enables sharing and shows a copyable link', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    act(() => root.render(<QueryClientProvider client={client}><MemoryRouter><ShareDialog trip={trip} onClose={() => undefined}/></MemoryRouter></QueryClientProvider>))
    const checkbox = container.querySelector('input[type="checkbox"]')!
    await act(async () => { (checkbox as HTMLInputElement).click(); await new Promise(resolve => setTimeout(resolve, 20)) })
    expect(container.textContent).toContain('Cho phép ai có link xem')
    expect(container.querySelector('input[readonly]')).not.toBeNull()
    expect(container.textContent).toContain('Sao chép link')
    act(() => root.unmount()); client.clear(); vi.unstubAllGlobals()
  })
})
