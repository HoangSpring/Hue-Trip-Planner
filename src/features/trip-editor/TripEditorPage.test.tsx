import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TripEditorPage } from './TripEditorPage'
import type { TripDraft } from '@shared/schemas'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const basePlace = {
  shortDescription: null,
  area: null,
  coverImageAlt: null,
  imageCredit: null,
  imageLicense: null,
  verified: true,
  tags: [],
}

const mockPlaces = [
  { ...basePlace, id: '11111111-1111-4111-8111-111111111111', slug: 'dai-noi', name: 'Đại Nội Huế', category: 'heritage' as const, lat: 16.4691, lng: 107.5794, coverImageUrl: null },
  { ...basePlace, id: '22222222-2222-4222-8222-222222222222', slug: 'chua-thien-mu', name: 'Chùa Thiên Mụ', category: 'heritage' as const, lat: 16.4528, lng: 107.5453, coverImageUrl: null },
  { ...basePlace, id: '33333333-3333-4333-8333-333333333333', slug: 'banh-khoai', name: 'Bánh Khoái Lạc Thiện', category: 'food' as const, lat: 16.4688, lng: 107.5815, coverImageUrl: null },
  { ...basePlace, id: '44444444-4444-4444-8444-444444444444', slug: 'lang-tu-duc', name: 'Lăng Tự Đức', category: 'heritage' as const, lat: 16.4328, lng: 107.5658, coverImageUrl: null },
]

function makeMockDraft(): TripDraft {
  return {
    clientDraftId: '00000000-0000-4000-8000-000000000001',
    title: 'Lịch trình Huế 2 ngày thử nghiệm',
    startDate: '2026-11-01',
    numDays: 2,
    generatedBy: 'fallback',
    llmModel: null,
    start: { label: 'Trung tâm thành phố Huế', lat: 16.4637, lng: 107.5909 },
    input: {
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
    },
    days: [
      {
        id: '11111111-d001-4000-8000-000000000001',
        dayIndex: 1,
        date: '2026-11-01',
        note: null,
        items: [
          {
            id: '11111111-0001-4000-8000-000000000001',
            placeId: mockPlaces[0].id,
            place: mockPlaces[0],
            position: 0,
            slot: 'morning',
            startTime: '08:00',
            durationMin: 120,
            travelMinFromPrev: null,
            travelDistanceM: null,
            reason: 'Di sản tiêu biểu của triều Nguyễn',
            note: null,
            isLocked: false,
            addedBy: 'fallback',
          },
          {
            id: '11111111-0002-4000-8000-000000000002',
            placeId: mockPlaces[1].id,
            place: mockPlaces[1],
            position: 1,
            slot: 'morning',
            startTime: '10:30',
            durationMin: 60,
            travelMinFromPrev: 15,
            travelDistanceM: 4000,
            reason: 'Ngôi chùa cổ kính bên dòng Hương',
            note: null,
            isLocked: false,
            addedBy: 'fallback',
          },
          {
            id: '11111111-0003-4000-8000-000000000003',
            placeId: mockPlaces[2].id,
            place: mockPlaces[2],
            position: 2,
            slot: 'noon',
            startTime: '12:00',
            durationMin: 60,
            travelMinFromPrev: 10,
            travelDistanceM: 1500,
            reason: 'Đặc sản bánh khoái trứ danh',
            note: null,
            isLocked: false,
            addedBy: 'fallback',
          },
        ],
      },
      {
        id: '11111111-d002-4000-8000-000000000002',
        dayIndex: 2,
        date: '2026-11-02',
        note: null,
        items: [
          {
            id: '11111111-0004-4000-8000-000000000004',
            placeId: mockPlaces[3].id,
            place: mockPlaces[3],
            position: 0,
            slot: 'morning',
            startTime: '08:30',
            durationMin: 90,
            travelMinFromPrev: null,
            travelDistanceM: null,
            reason: 'Lăng tẩm thơ mộng của vua Tự Đức',
            note: null,
            isLocked: false,
            addedBy: 'fallback',
          },
        ],
      },
    ],
  }
}

function renderTripEditor(initialEntries = ['/trip/draft?day=1']) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  act(() => {
    root.render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/trip/draft" element={<TripEditorPage />} />
          <Route path="/plan/new" element={<div>Plan New Page</div>} />
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

describe('TripEditorPage', () => {
  let mounted: { container: HTMLElement; unmount: () => void } | null = null

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    if (mounted) {
      mounted.unmount()
      mounted = null
    }
  })

  it('renders empty trip message when no trip draft in localStorage', () => {
    mounted = renderTripEditor()
    expect(mounted.container.textContent).toContain('Chưa có lịch trình nào')
    expect(mounted.container.textContent).toContain('Tạo lịch trình mới')
  })

  it('renders trip title, day selector tabs, and slot items when draft exists', () => {
    const draft = makeMockDraft()
    localStorage.setItem('trip_draft_v1', JSON.stringify(draft))

    mounted = renderTripEditor(['/trip/draft?day=1'])

    expect(mounted.container.textContent).toContain('Lịch trình Huế 2 ngày thử nghiệm')
    expect(mounted.container.textContent).toContain('Ngày 1')
    expect(mounted.container.textContent).toContain('Ngày 2')

    // Day 1 items
    expect(mounted.container.textContent).toContain('Đại Nội Huế')
    expect(mounted.container.textContent).toContain('Bánh Khoái Lạc Thiện')
    expect(mounted.container.textContent).toContain('Di sản tiêu biểu của triều Nguyễn')
  })

  it('switches days when clicking day tabs', () => {
    const draft = makeMockDraft()
    localStorage.setItem('trip_draft_v1', JSON.stringify(draft))

    mounted = renderTripEditor(['/trip/draft?day=1'])
    expect(mounted.container.textContent).toContain('Đại Nội Huế')

    // Find and click Day 2 tab
    const day2Buttons = Array.from(mounted.container.querySelectorAll('button[role="tab"]'))
    const day2Btn = day2Buttons.find((btn) => btn.textContent?.includes('Ngày 2'))
    expect(day2Btn).toBeDefined()

    act(() => {
      day2Btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(mounted.container.textContent).toContain('Lăng Tự Đức')
  })

  it('allows inline editing of the trip title', () => {
    const draft = makeMockDraft()
    localStorage.setItem('trip_draft_v1', JSON.stringify(draft))

    mounted = renderTripEditor(['/trip/draft'])

    const editBtn = mounted.container.querySelector('button[title="Chỉnh sửa tên chuyến đi"]') as HTMLButtonElement
    expect(editBtn).not.toBeNull()

    act(() => {
      editBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const titleInput = mounted.container.querySelector('input[type="text"]') as HTMLInputElement
    expect(titleInput).not.toBeNull()

    act(() => {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
      nativeSetter?.call(titleInput, 'Chuyến đi Huế mộng mơ')
      titleInput.dispatchEvent(new Event('input', { bubbles: true }))
    })

    const form = titleInput.closest('form')
    act(() => {
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(mounted.container.textContent).toContain('Chuyến đi Huế mộng mơ')
  })

  it('deletes an item and allows undo via toast', () => {
    const draft = makeMockDraft()
    localStorage.setItem('trip_draft_v1', JSON.stringify(draft))

    mounted = renderTripEditor(['/trip/draft?day=1'])
    expect(mounted.container.querySelector('#item-11111111-0001-4000-8000-000000000001')).not.toBeNull()

    // Find delete buttons
    const deleteBtn = mounted.container.querySelector('button[title="Xóa"]') as HTMLButtonElement
    expect(deleteBtn).not.toBeNull()

    act(() => {
      deleteBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    // Item card is removed, toast appears
    expect(mounted.container.querySelector('#item-11111111-0001-4000-8000-000000000001')).toBeNull()
    expect(mounted.container.textContent).toContain('Đã xóa Đại Nội Huế')

    // Find and click Hoàn tác
    const undoBtn = Array.from(mounted.container.querySelectorAll('button')).find((b) => b.textContent === 'Hoàn tác')
    expect(undoBtn).toBeDefined()

    act(() => {
      undoBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    // Item card is restored
    expect(mounted.container.querySelector('#item-11111111-0001-4000-8000-000000000001')).not.toBeNull()
  })

  it('opens login prompt modal when clicking Chia sẻ', () => {
    const draft = makeMockDraft()
    localStorage.setItem('trip_draft_v1', JSON.stringify(draft))

    mounted = renderTripEditor(['/trip/draft'])

    const shareBtn = Array.from(mounted.container.querySelectorAll('button')).find((b) => b.textContent === 'Chia sẻ')
    expect(shareBtn).toBeDefined()

    act(() => {
      shareBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(mounted.container.textContent).toContain('Đăng nhập để chia sẻ lịch trình')
  })

  it('moves item position via move down button', () => {
    const draft = makeMockDraft()
    localStorage.setItem('trip_draft_v1', JSON.stringify(draft))

    mounted = renderTripEditor(['/trip/draft?day=1'])

    // Initial order: Đại Nội first, Bánh Khoái second
    const item1 = mounted.container.querySelector('#item-11111111-0001-4000-8000-000000000001')
    expect(item1).not.toBeNull()

    const moveDownBtn = item1?.querySelector('button[title="Xuống"]') as HTMLButtonElement
    expect(moveDownBtn).not.toBeNull()

    act(() => {
      moveDownBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    // Now Chùa Thiên Mụ is first and Đại Nội is second
    const cards = Array.from(mounted.container.querySelectorAll('[id^="item-11111111-000"]'))
    expect(cards[0].textContent).toContain('Chùa Thiên Mụ')
    expect(cards[1].textContent).toContain('Đại Nội Huế')
  })

  it('toggles item lock status', () => {
    const draft = makeMockDraft()
    localStorage.setItem('trip_draft_v1', JSON.stringify(draft))

    mounted = renderTripEditor(['/trip/draft?day=1'])

    const lockBtn = mounted.container.querySelector('button[title="Khóa vị trí"]') as HTMLButtonElement
    expect(lockBtn).not.toBeNull()

    act(() => {
      lockBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    // Now button has title "Mở khóa vị trí"
    expect(mounted.container.querySelector('button[title="Mở khóa vị trí"]')).not.toBeNull()
  })

  it('moves item to another day', () => {
    const draft = makeMockDraft()
    localStorage.setItem('trip_draft_v1', JSON.stringify(draft))

    mounted = renderTripEditor(['/trip/draft?day=1'])

    const item1 = mounted.container.querySelector('#item-11111111-0001-4000-8000-000000000001')
    const moveDayBtn = item1?.querySelector('button[title="Chuyển ngày"]') as HTMLButtonElement
    expect(moveDayBtn).not.toBeNull()

    act(() => {
      moveDayBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    // Select Day 2 in the menu
    const targetDayBtn = Array.from(mounted.container.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Ngày 2')
    expect(targetDayBtn).toBeDefined()

    act(() => {
      targetDayBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    // Now Day 2 is active and contains Đại Nội Huế
    expect(mounted.container.textContent).toContain('Hành trình Ngày 2')
    expect(mounted.container.textContent).toContain('Đại Nội Huế')
  })
})
