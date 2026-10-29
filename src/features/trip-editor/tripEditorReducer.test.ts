import { describe, expect, it } from 'vitest'
import type { TripDraft } from '@shared/schemas'
import {
  createInitialEditorState,
  tripEditorReducer,
} from './tripEditorReducer'

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

function makeMockTrip(): TripDraft {
  return {
    clientDraftId: '00000000-0000-4000-8000-000000000001',
    title: 'Lịch trình Huế 2 ngày',
    startDate: '2026-11-01',
    numDays: 2,
    generatedBy: 'fallback',
    llmModel: null,
    start: null,
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
        id: 'd1111111-1111-4111-8111-111111111111',
        dayIndex: 1,
        date: '2026-11-01',
        note: null,
        items: [
          {
            id: 'item-1',
            placeId: mockPlaces[0].id,
            place: mockPlaces[0],
            position: 0,
            slot: 'morning',
            startTime: '08:00',
            durationMin: 120,
            travelMinFromPrev: null,
            travelDistanceM: null,
            reason: 'Di sản nổi tiếng',
            note: null,
            isLocked: false,
            addedBy: 'fallback',
          },
          {
            id: 'item-2',
            placeId: mockPlaces[2].id,
            place: mockPlaces[2],
            position: 1,
            slot: 'noon',
            startTime: '11:30',
            durationMin: 60,
            travelMinFromPrev: 10,
            travelDistanceM: 500,
            reason: 'Món ngon',
            note: null,
            isLocked: false,
            addedBy: 'fallback',
          },
        ],
      },
      {
        id: 'd2222222-2222-4222-8222-222222222222',
        dayIndex: 2,
        date: '2026-11-02',
        note: null,
        items: [
          {
            id: 'item-3',
            placeId: mockPlaces[1].id,
            place: mockPlaces[1],
            position: 0,
            slot: 'morning',
            startTime: '08:30',
            durationMin: 90,
            travelMinFromPrev: null,
            travelDistanceM: null,
            reason: 'Cổ kính',
            note: null,
            isLocked: false,
            addedBy: 'fallback',
          },
        ],
      },
    ],
  }
}

describe('tripEditorReducer', () => {
  it('creates initial state and recalculates travel and warnings', () => {
    const trip = makeMockTrip()
    const state = createInitialEditorState(trip)
    expect(state.activeDayIndex).toBe(1)
    expect(state.trip.days[0].items[0].travelMinFromPrev).toBeNull()
    expect(state.trip.days[0].items[1].travelMinFromPrev).toBeGreaterThan(0)
    expect(state.warnings).toBeDefined()
  })

  it('updates title with undo support', () => {
    const state = createInitialEditorState(makeMockTrip())
    const nextState = tripEditorReducer(state, { type: 'UPDATE_TITLE', payload: 'Chuyến đi Huế mộng mơ' })
    expect(nextState.trip.title).toBe('Chuyến đi Huế mộng mơ')
    expect(nextState.undoStack).toHaveLength(1)

    const undoneState = tripEditorReducer(nextState, { type: 'UNDO' })
    expect(undoneState.trip.title).toBe(state.trip.title)
  })

  it('toggles lock on item', () => {
    const state = createInitialEditorState(makeMockTrip())
    const nextState = tripEditorReducer(state, { type: 'TOGGLE_LOCK', payload: { itemId: 'item-1' } })
    expect(nextState.trip.days[0].items[0].isLocked).toBe(true)

    const reverted = tripEditorReducer(nextState, { type: 'TOGGLE_LOCK', payload: { itemId: 'item-1' } })
    expect(reverted.trip.days[0].items[0].isLocked).toBe(false)
  })

  it('replaces only the selected day and restores it with undo', () => {
    const state = createInitialEditorState(makeMockTrip())
    const untouchedDay = state.trip.days[1]
    const replacement = state.trip.days[0].items.slice(0, 1).map((item) => ({
      ...item,
      id: 'replacement-item',
      placeId: mockPlaces[2].id,
      place: mockPlaces[2],
      position: 0,
    }))
    const replaced = tripEditorReducer(state, {
      type: 'REPLACE_DAY',
      payload: { dayIndex: 1, items: replacement },
    })

    expect(replaced.trip.days[0].items).toEqual(replacement)
    expect(replaced.trip.days[1]).toEqual(untouchedDay)
    expect(tripEditorReducer(replaced, { type: 'UNDO' }).trip.days).toEqual(state.trip.days)
  })

  it('reorders item within day and maintains continuous positions', () => {
    const state = createInitialEditorState(makeMockTrip())
    const nextState = tripEditorReducer(state, {
      type: 'MOVE_ITEM_POSITION',
      payload: { dayIndex: 1, fromIndex: 0, toIndex: 1 },
    })

    expect(nextState.trip.days[0].items[0].id).toBe('item-2')
    expect(nextState.trip.days[0].items[0].position).toBe(0)
    expect(nextState.trip.days[0].items[1].id).toBe('item-1')
    expect(nextState.trip.days[0].items[1].position).toBe(1)
  })

  it('moves item to another day', () => {
    const state = createInitialEditorState(makeMockTrip())
    const nextState = tripEditorReducer(state, {
      type: 'MOVE_ITEM_DAY',
      payload: { itemId: 'item-1', targetDayIndex: 2, targetSlot: 'afternoon' },
    })

    expect(nextState.trip.days[0].items).toHaveLength(1)
    expect(nextState.trip.days[1].items).toHaveLength(2)
    const movedItem = nextState.trip.days[1].items.find((it) => it.id === 'item-1')
    expect(movedItem).toBeDefined()
    expect(movedItem?.slot).toBe('afternoon')
  })

  it('deletes an item and allows undo to restore it', () => {
    const state = createInitialEditorState(makeMockTrip())
    const deletedState = tripEditorReducer(state, {
      type: 'DELETE_ITEM',
      payload: { itemId: 'item-1' },
    })

    expect(deletedState.trip.days[0].items).toHaveLength(1)
    expect(deletedState.lastDeletedItem?.item.id).toBe('item-1')

    const undoneState = tripEditorReducer(deletedState, { type: 'UNDO' })
    expect(undoneState.trip.days[0].items).toHaveLength(2)
    expect(undoneState.trip.days[0].items[0].id).toBe('item-1')
  })

  it('prevents adding a duplicate placeId already in the trip', () => {
    const state = createInitialEditorState(makeMockTrip())
    // mockPlaces[0] (Đại Nội) is already in Day 1
    const duplicateState = tripEditorReducer(state, {
      type: 'ADD_ITEM',
      payload: { dayIndex: 2, slot: 'afternoon', place: mockPlaces[0] },
    })

    // Should reject and not duplicate
    expect(duplicateState.trip.days[1].items).toHaveLength(1)
  })

  it('adds a new place cleanly when not duplicate', () => {
    const state = createInitialEditorState(makeMockTrip())
    const nextState = tripEditorReducer(state, {
      type: 'ADD_ITEM',
      payload: { dayIndex: 2, slot: 'afternoon', place: mockPlaces[3] },
    })

    expect(nextState.trip.days[1].items).toHaveLength(2)
    const added = nextState.trip.days[1].items[1]
    expect(added.placeId).toBe(mockPlaces[3].id)
    expect(added.slot).toBe('afternoon')
    expect(added.position).toBe(1)
  })

  it('replaces an item with an alternative without duplicating', () => {
    const state = createInitialEditorState(makeMockTrip())
    // Replace item-1 with mockPlaces[3] (Lăng Tự Đức)
    const nextState = tripEditorReducer(state, {
      type: 'REPLACE_ITEM',
      payload: { itemId: 'item-1', newPlace: mockPlaces[3], reason: 'Gợi ý thay thế gần đó' },
    })

    expect(nextState.trip.days[0].items[0].placeId).toBe(mockPlaces[3].id)
    expect(nextState.trip.days[0].items[0].reason).toBe('Gợi ý thay thế gần đó')

    // Trying to replace with an already existing place should be rejected
    const blockedState = tripEditorReducer(nextState, {
      type: 'REPLACE_ITEM',
      payload: { itemId: 'item-2', newPlace: mockPlaces[3] },
    })
    expect(blockedState.trip.days[0].items[1].placeId).toBe(mockPlaces[2].id)
  })
})
