import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi as vitestVi } from 'vitest'
import { GeneratingPage } from './GeneratingPage'
import {
  writeStoredWizardDraft,
  clearStoredWizardDraft,
  readStoredTripDraft,
  readStoredWizardDraft,
  readStoredNotices,
} from './storage'
import * as apiModule from '@/lib/api'
import { ApiRequestError } from '@/lib/api'
import { vi } from '@/lib/strings/vi'
import type { GenerateTripResponse, TripInput } from '@shared/schemas'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const validTripInput: TripInput = {
  numDays: 2,
  startDate: '2026-11-01',
  companion: 'couple',
  groupSize: 2,
  interests: ['heritage', 'cuisine'],
  pace: 'moderate',
  budget: 'mid',
  transport: 'motorbike',
  start: null,
  notes: null,
}

const mockSuccessResponse: GenerateTripResponse = {
  draft: {
    clientDraftId: '00000000-0000-4000-8000-000000000001',
    title: 'Lịch trình Huế 2026-11-01',
    numDays: 2,
    startDate: '2026-11-01',
    input: validTripInput,
    generatedBy: 'fallback',
    llmModel: null,
    start: null,
    days: [
      {
        id: '00000000-0000-4000-8000-000000000010',
        dayIndex: 1,
        date: '2026-11-01',
        note: null,
        items: [],
      },
      {
        id: '00000000-0000-4000-8000-000000000011',
        dayIndex: 2,
        date: '2026-11-02',
        note: null,
        items: [],
      },
    ],
  },
  warnings: [],
  notices: [{ code: 'FALLBACK_USED', message: 'Lịch trình được tạo theo cách đơn giản hơn.' }],
  generation: { by: 'fallback', model: null, durationMs: 150 },
}

function renderGenerating() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/plan/generating']}>
        <Routes>
          <Route path="/plan/generating" element={<GeneratingPage />} />
          <Route path="/plan/new" element={<div data-testid="plan-new-screen">Plan New Screen</div>} />
          <Route path="/trip/draft" element={<div data-testid="trip-draft-screen">Trip Draft Screen</div>} />
        </Routes>
      </MemoryRouter>
    )
  })

  return {
    container,
    unmount: () => {
      act(() => root.unmount())
      container.remove()
    },
  }
}

describe('GeneratingPage (F-06, FL-01, FL-02)', () => {
  beforeEach(() => {
    localStorage.clear()
    clearStoredWizardDraft()
    vitestVi.restoreAllMocks()
  })

  it('redirects to /plan/new if no wizard draft is present', () => {
    const { container, unmount } = renderGenerating()
    expect(container.querySelector('[data-testid="plan-new-screen"]')).not.toBeNull()
    unmount()
  })

  it('generates trip successfully, saves trip_draft_v1, clears wizard_draft_v1, and navigates to /trip/draft', async () => {
    writeStoredWizardDraft({
      step: 6,
      values: {
        numDays: 2,
        startDate: '2026-11-01',
        companion: 'couple',
        groupSize: 2,
        interests: ['heritage', 'cuisine'],
        pace: 'moderate',
        budget: 'mid',
        transport: 'motorbike',
        start: null,
        notes: '',
      },
      input: validTripInput,
    })

    const generateSpy = vitestVi.spyOn(apiModule, 'generateTripApi').mockResolvedValue(mockSuccessResponse)

    const { container, unmount } = renderGenerating()
    expect(container.textContent).toContain(vi.generating.title)

    // Wait for async generation to finish
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(container.querySelector('[data-testid="trip-draft-screen"]')).not.toBeNull()
    expect(generateSpy).toHaveBeenCalledTimes(1)

    // trip_draft_v1 written
    const storedTrip = readStoredTripDraft()
    expect(storedTrip).not.toBeNull()
    expect(storedTrip?.clientDraftId).toBe('00000000-0000-4000-8000-000000000001')

    // wizard_draft_v1 cleared
    expect(readStoredWizardDraft()).toBeNull()

    // notices stored
    const notices = readStoredNotices()
    expect(notices).toHaveLength(1)
    expect(notices[0].code).toBe('FALLBACK_USED')
    unmount()
  })

  it('allows canceling generation and returns to /plan/new?step=6 keeping draft data', async () => {
    writeStoredWizardDraft({
      step: 6,
      values: {
        numDays: 2,
        startDate: '2026-11-01',
        companion: 'couple',
        groupSize: 2,
        interests: ['heritage', 'cuisine'],
        pace: 'moderate',
        budget: 'mid',
        transport: 'motorbike',
        start: null,
        notes: '',
      },
      input: validTripInput,
    })

    // Never-resolving promise simulating long request
    vitestVi.spyOn(apiModule, 'generateTripApi').mockImplementation((_req, signal) => {
      return new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
    })

    const { container, unmount } = renderGenerating()
    const cancelBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes(vi.generating.cancel))
    expect(cancelBtn).toBeDefined()

    act(() => cancelBtn?.click())

    expect(container.querySelector('[data-testid="plan-new-screen"]')).not.toBeNull()
    // draft was NOT deleted
    expect(readStoredWizardDraft()).not.toBeNull()
    unmount()
  })

  it('handles 429 RATE_LIMITED with countdown and guest login recommendation', async () => {
    writeStoredWizardDraft({
      step: 6,
      values: {
        numDays: 2,
        startDate: '2026-11-01',
        companion: 'couple',
        groupSize: 2,
        interests: ['heritage', 'cuisine'],
        pace: 'moderate',
        budget: 'mid',
        transport: 'motorbike',
        start: null,
        notes: '',
      },
      input: validTripInput,
    })

    const headers = new Headers({ 'Retry-After': '30' })
    const error429 = new ApiRequestError(429, {
      error: { code: 'RATE_LIMITED', message: 'Bạn đã tạo nhiều lịch trình.', requestId: 'req_test' },
    }, headers)

    vitestVi.spyOn(apiModule, 'generateTripApi').mockRejectedValue(error429)

    const { container, unmount } = renderGenerating()

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(container.textContent).toContain(vi.generating.errors.rateLimitedTitle)
    expect(container.textContent).toContain(vi.generating.errors.rateLimitedGuestHint)
    expect(container.textContent).toContain(vi.generating.backToEdit)

    // Retry button is disabled during countdown
    const retryBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Thử lại'))
    expect(retryBtn?.getAttribute('disabled')).not.toBeNull()
    unmount()
  })

  it('handles 422 NO_CANDIDATES with friendly suggestion to change interests', async () => {
    writeStoredWizardDraft({
      step: 6,
      values: {
        numDays: 2,
        startDate: '2026-11-01',
        companion: 'couple',
        groupSize: 2,
        interests: ['nature'],
        pace: 'packed',
        budget: 'budget',
        transport: null,
        start: null,
        notes: '',
      },
      input: validTripInput,
    })

    const error422 = new ApiRequestError(422, {
      error: { code: 'NO_CANDIDATES', message: 'Chưa có đủ địa điểm phù hợp.', requestId: 'req_test' },
    })

    vitestVi.spyOn(apiModule, 'generateTripApi').mockRejectedValue(error422)

    const { container, unmount } = renderGenerating()

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(container.textContent).toContain(vi.generating.errors.noCandidatesTitle)
    expect(container.textContent).toContain(vi.generating.errors.noCandidatesBody)

    const backBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes(vi.generating.backToEdit))
    act(() => backBtn?.click())
    expect(container.querySelector('[data-testid="plan-new-screen"]')).not.toBeNull()
    unmount()
  })
})
