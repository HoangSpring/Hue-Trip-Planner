import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readStoredTripDraft, writeStoredTripDraft } from '@/features/trip-wizard/storage'
import type { PlaceSummary, TripDraft } from '@shared/schemas'
import { AddToTripDialog } from './AddToTripDialog'

const auth = vi.hoisted(() => ({ current: { status: 'anonymous', session: null, user: null, isLoading: false, isAuthenticated: false } }))
vi.mock('@/features/auth/hooks/useSession', () => ({ useSession: () => auth.current }))
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const newPlace: PlaceSummary = {
  id: 'b0000000-0000-4000-8000-000000000002', slug: 'place-moi', name: 'Địa điểm mới', category: 'heritage',
  shortDescription: null, area: null, lat: 16.47, lng: 107.59, coverImageUrl: null, coverImageAlt: null,
  imageCredit: null, imageLicense: null, imageSourceUrl: null, tags: [], verified: true,
}
const existingPlace: PlaceSummary = {
  ...newPlace, id: 'b0000000-0000-4000-8000-000000000001', slug: 'place-cu', name: 'Địa điểm cũ', lat: 16.46,
}

function makeDraft(place = existingPlace): TripDraft {
  return {
    clientDraftId: '00000000-0000-4000-8000-000000000001', title: 'Huế 1 ngày', startDate: '2026-11-01', numDays: 1,
    generatedBy: 'fallback', llmModel: null, start: null,
    input: { numDays: 1, startDate: '2026-11-01', companion: 'couple', groupSize: 2, interests: ['heritage', 'cuisine'], pace: 'moderate', budget: null, transport: 'motorbike', start: null, notes: null },
    days: [{ id: 'd1111111-1111-4111-8111-111111111111', dayIndex: 1, date: '2026-11-01', note: null, items: [{
      id: '11111111-1111-4111-8111-111111111111', placeId: place.id, place, position: 0, slot: 'morning', startTime: '08:00',
      durationMin: 60, travelMinFromPrev: null, travelDistanceM: null, reason: null, note: null, isLocked: false, addedBy: 'fallback',
    }] }],
  }
}

function mount() {
  const container = document.createElement('div')
  const root = createRoot(container)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  act(() => root.render(<QueryClientProvider client={client}><MemoryRouter><AddToTripDialog place={newPlace} onClose={() => undefined}/></MemoryRouter></QueryClientProvider>))
  return { container, root, client }
}

describe('AddToTripDialog', () => {
  beforeEach(() => { localStorage.clear(); auth.current = { status: 'anonymous', session: null, user: null, isLoading: false, isAuthenticated: false } })

  it('adds to the guest draft, reindexes, recalculates travel and preserves the chosen slot', async () => {
    writeStoredTripDraft(makeDraft())
    const { container, root, client } = mount()
    const selects = container.querySelectorAll('select')
    expect(selects).toHaveLength(2)
    act(() => { (selects[1] as HTMLSelectElement).value = 'afternoon'; selects[1].dispatchEvent(new Event('change', { bubbles: true })) })
    const timeInput = container.querySelector<HTMLInputElement>('input[type="time"]')
    expect(timeInput?.value).toBe('14:00')
    act(() => {
      if (timeInput) {
        const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
        valueSetter?.call(timeInput, '15:45')
        timeInput.dispatchEvent(new Event('input', { bubbles: true }))
        timeInput.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
    await act(async () => {
      container.querySelector('button:last-child')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    const updated = readStoredTripDraft()
    expect(updated?.days[0].items.map(item => item.placeId)).toEqual([existingPlace.id, newPlace.id])
    expect(updated?.days[0].items.map(item => item.position)).toEqual([0, 1])
    expect(updated?.days[0].items[1].travelMinFromPrev).toBeGreaterThan(0)
    expect(updated?.days[0].items[1].travelDistanceM).toBeGreaterThan(0)
    expect(updated?.days[0].items[1].slot).toBe('afternoon')
    expect(updated?.days[0].items[1].startTime).toBe('15:45')
    act(() => root.unmount()); client.clear()
  })

  it('rejects a place that is already in the draft', async () => {
    writeStoredTripDraft(makeDraft(newPlace))
    const { container, root, client } = mount()
    await act(async () => {
      const button = [...container.querySelectorAll('button')].find(item => item.textContent?.includes('Thêm vào chuyến đi'))
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('đã có')
    act(() => root.unmount()); client.clear()
  })
})
