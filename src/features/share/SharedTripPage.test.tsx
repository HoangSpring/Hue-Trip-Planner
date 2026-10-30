import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SharedTripPage from './SharedTripPage'

const auth = vi.hoisted(() => ({ current: { status: 'anonymous', session: null, user: null } }))
vi.mock('@/features/auth/hooks/useSession', () => ({ useSession: () => auth.current }))
vi.mock('@/features/map/MapView', () => ({ MapView: () => <div data-testid="shared-map"/> }))
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const sharedTrip = {
  title: 'Huế hai ngày', numDays: 1, startDate: '2026-10-30', start: null,
  days: [{ dayIndex: 1, date: '2026-10-30', items: [{
    placeId: 'c0000000-0000-4000-8000-000000000003', position: 0, slot: 'morning', startTime: '08:00', durationMin: 60,
    travelMinFromPrev: null, travelDistanceM: null, reason: 'Ghé thăm di sản.', place: {
      id: 'c0000000-0000-4000-8000-000000000003', slug: 'dai-noi', name: 'Đại Nội Huế', category: 'heritage', shortDescription: null,
      area: 'Huế', lat: 16.47, lng: 107.58, coverImageUrl: null, coverImageAlt: null, imageCredit: null, imageLicense: null,
      imageSourceUrl: null, tags: [], verified: true,
    },
  }] }],
}

function mount() {
  const container = document.createElement('div')
  const root = createRoot(container)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  act(() => root.render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/s/AAAAAAAAAAAAAAAAAAAAAA']}><Routes><Route path="/s/:shareToken" element={<SharedTripPage/>}/></Routes></MemoryRouter></QueryClientProvider>))
  return { container, root, client }
}

describe('SharedTripPage', () => {
  beforeEach(() => {
    auth.current = { status: 'anonymous', session: null, user: null }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(sharedTrip), { status: 200 })))
  })

  it('renders a read-only shared itinerary and offers login to copy', async () => {
    const { container, root, client } = mount()
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })
    expect(container.textContent).toContain('Huế hai ngày')
    expect(container.textContent).toContain('Đại Nội Huế')
    expect(container.textContent).toContain('Tạo bản sao của tôi')
    expect(container.querySelector('[data-testid="shared-map"]')).not.toBeNull()
    expect(container.textContent).not.toContain('clientDraftId')
    act(() => root.unmount()); client.clear()
    vi.unstubAllGlobals()
  })
})
