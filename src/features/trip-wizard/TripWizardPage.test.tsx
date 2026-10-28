import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { TripWizardPage } from './TripWizardPage'
import {
  writeStoredWizardDraft,
  clearStoredWizardDraft,
  readStoredWizardDraft,
  defaultWizardValues,
} from './storage'
import { vi } from '@/lib/strings/vi'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function mockShowModal() {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function mockClose() {
    this.open = false
  }
})

function renderWizard(initialEntries = ['/plan/new']) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/plan/new" element={<TripWizardPage />} />
            <Route path="/plan/generating" element={<div data-testid="generating-screen">Generating Screen</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
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

describe('TripWizardPage (F-05)', () => {
  beforeEach(() => {
    localStorage.clear()
    clearStoredWizardDraft()
  })

  it('renders step 1 by default with 2 days selected and recommended badge', () => {
    const { container, unmount } = renderWizard()
    expect(container.textContent).toContain(vi.wizard.step1Title)
    expect(container.textContent).toContain(vi.wizard.recommended)
    expect(container.textContent).toContain('Bước 1 / 6')
    unmount()
  })

  it('allows changing days and updates curator hint', () => {
    const { container, unmount } = renderWizard()
    // Find pill button with text "3 ngày"
    const buttons = Array.from(container.querySelectorAll('button'))
    const button3Days = buttons.find((b) => b.textContent?.includes('3 ngày'))
    expect(button3Days).toBeDefined()

    act(() => button3Days?.click())
    expect(container.textContent).toContain('3 ngày thư thái')
    unmount()
  })

  it('blocks navigation from step 2 if companion is not selected', () => {
    const { container, unmount } = renderWizard()
    // Click "Tiếp tục" on step 1 to advance to step 2
    const buttons = Array.from(container.querySelectorAll('button'))
    const nextBtn = buttons.find((b) => b.textContent?.trim() === vi.wizard.next)
    act(() => nextBtn?.click())

    expect(container.textContent).toContain(vi.wizard.step2Title)

    // Try to advance without choosing companion
    const nextBtn2 = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === vi.wizard.next)
    act(() => nextBtn2?.click())

    expect(container.textContent).toContain('Vui lòng chọn người đồng hành cùng bạn.')
    unmount()
  })

  it('allows companion selection and auto-adjusts group size', () => {
    const { container, unmount } = renderWizard()
    // Step 1 -> Step 2
    const nextBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === vi.wizard.next)
    act(() => nextBtn?.click())

    // Click companion "Cặp đôi"
    const coupleCard = Array.from(container.querySelectorAll('div[role="radio"]')).find((d) => d.textContent?.includes('Cặp đôi'))
    expect(coupleCard).toBeDefined()
    act(() => (coupleCard as HTMLElement)?.click())

    expect(container.textContent).toContain('2 người')
    expect(container.textContent).toContain('Lời khuyên cho đoàn')
    unmount()
  })

  it('blocks step 3 if fewer than 2 interests are chosen', () => {
    const { container, unmount } = renderWizard()
    // Step 1 -> Step 2
    act(() => Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === vi.wizard.next)?.click())

    // Step 2: Choose companion
    const coupleCard = Array.from(container.querySelectorAll('div[role="radio"]')).find((d) => d.textContent?.includes('Cặp đôi'))
    act(() => (coupleCard as HTMLElement)?.click())

    // Step 2 -> Step 3
    act(() => Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === vi.wizard.next)?.click())
    expect(container.textContent).toContain(vi.wizard.step3Title)

    // Try advancing with 0 interests
    act(() => Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === vi.wizard.next)?.click())
    expect(container.textContent).toContain(vi.wizard.errorMinInterests)

    // Click 1 interest
    const interestBtn1 = Array.from(container.querySelectorAll('button[role="checkbox"]'))[0] as HTMLElement
    act(() => interestBtn1?.click())
    act(() => Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === vi.wizard.next)?.click())
    expect(container.textContent).toContain(vi.wizard.errorMinInterests)

    // Click 2nd interest
    const interestBtn2 = Array.from(container.querySelectorAll('button[role="checkbox"]'))[1] as HTMLElement
    act(() => interestBtn2?.click())

    // Now valid! Advance to step 4
    act(() => Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === vi.wizard.next)?.click())
    expect(container.textContent).toContain(vi.wizard.step4Title)
    unmount()
  })

  it('preserves all entered data when moving backward', () => {
    const { container, unmount } = renderWizard()
    // Step 1: click 3 days
    const button3Days = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('3 ngày'))
    act(() => button3Days?.click())
    act(() => Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === vi.wizard.next)?.click())

    // Step 2: choose seniors
    const seniorCard = Array.from(container.querySelectorAll('div[role="radio"]')).find((d) => d.textContent?.includes('Người lớn tuổi'))
    act(() => (seniorCard as HTMLElement)?.click())
    act(() => Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === vi.wizard.next)?.click())

    // Step 3: click 'Quay lại'
    const backBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === vi.wizard.back)
    act(() => backBtn?.click())
    expect(container.textContent).toContain('Người lớn tuổi')

    // Step 2: click 'Quay lại'
    const backBtn2 = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === vi.wizard.back)
    act(() => backBtn2?.click())
    expect(container.textContent).toContain(vi.wizard.step1Title)
    // 3 days is still selected
    expect(container.textContent).toContain('3 ngày thư thái')
    unmount()
  })

  it('shows resume draft dialog when opening with an existing draft and allows resuming', () => {
    writeStoredWizardDraft({
      step: 3,
      values: {
        ...defaultWizardValues,
        numDays: 4,
        companion: 'friends',
        interests: ['heritage', 'cuisine'],
      },
    })

    const { container, unmount } = renderWizard()
    expect(container.textContent).toContain(vi.wizard.resumeTitle)
    expect(container.textContent).toContain(vi.wizard.resumeContinue)
    expect(container.textContent).toContain(vi.wizard.resumeRestart)

    // Click 'Tiếp tục'
    const resumeBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === vi.wizard.resumeContinue)
    act(() => resumeBtn?.click())

    const draft = readStoredWizardDraft()
    expect(draft?.values.numDays).toBe(4)
    expect(draft?.values.companion).toBe('friends')
    unmount()
  })

  it('resets form when user chooses "Làm lại từ đầu"', () => {
    writeStoredWizardDraft({
      step: 4,
      values: {
        ...defaultWizardValues,
        numDays: 4,
        companion: 'seniors',
      },
    })

    const { container, unmount } = renderWizard()
    const restartBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === vi.wizard.resumeRestart)
    act(() => restartBtn?.click())

    expect(container.textContent).toContain(vi.wizard.step1Title)
    expect(readStoredWizardDraft()).toBeNull()
    unmount()
  })

  it('step 6 summary displays choices, plain text notes, and submits to generating', () => {
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
        start: { label: 'Gần Đại Nội', lat: 16.4691, lng: 107.5794 },
        notes: 'Chuyến đi nghỉ dưỡng lãng mạn',
      },
    })

    const { container, unmount } = renderWizard(['/plan/new?step=6'])
    expect(container.textContent).toContain(vi.wizard.step6Title)
    expect(container.textContent).toContain('2 ngày')
    expect(container.textContent).toContain('Cặp đôi')
    expect(container.textContent).toContain('"Chuyến đi nghỉ dưỡng lãng mạn"')

    // Click "Tạo lịch trình"
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === vi.wizard.createTripBtn)
    act(() => submitBtn?.click())

    expect(container.querySelector('[data-testid="generating-screen"]')).not.toBeNull()

    const stored = readStoredWizardDraft()
    expect(stored?.input).toBeDefined()
    expect(stored?.input?.numDays).toBe(2)
    expect(stored?.input?.companion).toBe('couple')
    unmount()
  })
})
