import type { TripDraft, TripDay, TripItem, Warning, Slot } from '@shared/schemas'
import { estimateTravel } from '@shared/itinerary/travel'
import { computeWarnings } from '@shared/itinerary/warnings'

export interface TripEditorState {
  trip: TripDraft
  activeDayIndex: number // 1..numDays
  selectedItemId: string | null
  undoStack: TripDraft[]
  lastDeletedItem: { item: TripItem; dayIndex: number; position: number } | null
  warnings: Warning[]
}

export type TripEditorAction =
  | { type: 'SET_TRIP'; payload: TripDraft }
  | { type: 'SET_ACTIVE_DAY'; payload: number }
  | { type: 'SELECT_ITEM'; payload: string | null }
  | { type: 'UPDATE_TITLE'; payload: string }
  | { type: 'UPDATE_ITEM'; payload: { itemId: string; startTime?: string | null; durationMin?: number | null; note?: string | null } }
  | { type: 'TOGGLE_LOCK'; payload: { itemId: string } }
  | { type: 'MOVE_ITEM_POSITION'; payload: { dayIndex: number; fromIndex: number; toIndex: number } }
  | { type: 'MOVE_ITEM_DAY'; payload: { itemId: string; targetDayIndex: number; targetSlot?: Slot } }
  | { type: 'DELETE_ITEM'; payload: { itemId: string } }
  | { type: 'UNDO' }
  | { type: 'REPLACE_ITEM'; payload: { itemId: string; newPlace: NonNullable<TripItem['place']>; reason?: string } }
  | { type: 'ADD_ITEM'; payload: { dayIndex: number; slot: Slot; place: NonNullable<TripItem['place']> } }
  | { type: 'REPLACE_DAY'; payload: { dayIndex: number; items: TripItem[] } }

export function recalculateDayTravel(day: TripDay, transport: TripDraft['input']['transport']): TripDay {
  const items = [...day.items].map((item, index) => ({
    ...item,
    position: index,
  }))

  for (let i = 0; i < items.length; i++) {
    if (i === 0) {
      items[i].travelMinFromPrev = null
      items[i].travelDistanceM = null
    } else {
      const prevPlace = items[i - 1].place
      const currPlace = items[i].place
      if (prevPlace?.lat != null && prevPlace?.lng != null && currPlace?.lat != null && currPlace?.lng != null) {
        const est = estimateTravel(
          { lat: prevPlace.lat, lng: prevPlace.lng },
          { lat: currPlace.lat, lng: currPlace.lng },
          transport,
        )
        items[i].travelMinFromPrev = est.travelMin
        items[i].travelDistanceM = Math.round(est.distanceKm * 1000)
      } else {
        items[i].travelMinFromPrev = null
        items[i].travelDistanceM = null
      }
    }
  }

  return { ...day, items }
}

export function refreshTripDerived(trip: TripDraft): { trip: TripDraft; warnings: Warning[] } {
  const recalculatedDays = trip.days.map((day) => recalculateDayTravel(day, trip.input.transport))
  const updatedTrip = { ...trip, days: recalculatedDays }
  const warnings = computeWarnings({
    days: recalculatedDays,
    transport: updatedTrip.input.transport,
    startDate: updatedTrip.startDate,
    pace: updatedTrip.input.pace,
    companion: updatedTrip.input.companion,
    start: updatedTrip.start,
  })
  return { trip: updatedTrip, warnings }
}

export function createInitialEditorState(trip: TripDraft, activeDayIndex = 1): TripEditorState {
  const { trip: recalculated, warnings } = refreshTripDerived(trip)
  return {
    trip: recalculated,
    activeDayIndex: Math.max(1, Math.min(recalculated.numDays, activeDayIndex)),
    selectedItemId: null,
    undoStack: [],
    lastDeletedItem: null,
    warnings,
  }
}

export function tripEditorReducer(state: TripEditorState, action: TripEditorAction): TripEditorState {
  switch (action.type) {
    case 'SET_TRIP': {
      const { trip: refreshed, warnings } = refreshTripDerived(action.payload)
      return {
        ...state,
        trip: refreshed,
        warnings,
        activeDayIndex: Math.max(1, Math.min(refreshed.numDays, state.activeDayIndex)),
      }
    }

    case 'SET_ACTIVE_DAY': {
      const clamped = Math.max(1, Math.min(state.trip.numDays, action.payload))
      return {
        ...state,
        activeDayIndex: clamped,
        selectedItemId: null,
      }
    }

    case 'SELECT_ITEM': {
      return {
        ...state,
        selectedItemId: action.payload,
      }
    }

    case 'UPDATE_TITLE': {
      const trimmed = action.payload.trim().slice(0, 100)
      if (!trimmed || trimmed === state.trip.title) return state
      const nextTrip: TripDraft = { ...state.trip, title: trimmed }
      return {
        ...state,
        trip: nextTrip,
        undoStack: [state.trip, ...state.undoStack].slice(0, 20),
      }
    }

    case 'UPDATE_ITEM': {
      const { itemId, startTime, durationMin, note } = action.payload
      let found = false
      const nextDays = state.trip.days.map((day) => {
        const itemIdx = day.items.findIndex((it) => it.id === itemId)
        if (itemIdx === -1) return day
        found = true
        const currentItem = day.items[itemIdx]
        const updatedItem: TripItem = {
          ...currentItem,
          startTime: startTime !== undefined ? startTime : currentItem.startTime,
          durationMin: durationMin !== undefined ? durationMin : currentItem.durationMin,
          note: note !== undefined ? (note ? note.slice(0, 300) : null) : currentItem.note,
        }
        const nextItems = [...day.items]
        nextItems[itemIdx] = updatedItem
        return { ...day, items: nextItems }
      })

      if (!found) return state
      const { trip: nextTrip, warnings } = refreshTripDerived({ ...state.trip, days: nextDays })
      return {
        ...state,
        trip: nextTrip,
        warnings,
        undoStack: [state.trip, ...state.undoStack].slice(0, 20),
      }
    }

    case 'TOGGLE_LOCK': {
      const { itemId } = action.payload
      let found = false
      const nextDays = state.trip.days.map((day) => {
        const itemIdx = day.items.findIndex((it) => it.id === itemId)
        if (itemIdx === -1) return day
        found = true
        const nextItems = [...day.items]
        nextItems[itemIdx] = { ...nextItems[itemIdx], isLocked: !nextItems[itemIdx].isLocked }
        return { ...day, items: nextItems }
      })

      if (!found) return state
      return {
        ...state,
        trip: { ...state.trip, days: nextDays },
        undoStack: [state.trip, ...state.undoStack].slice(0, 20),
      }
    }

    case 'MOVE_ITEM_POSITION': {
      const { dayIndex, fromIndex, toIndex } = action.payload
      const day = state.trip.days.find((d) => d.dayIndex === dayIndex)
      if (!day) return state
      if (fromIndex < 0 || fromIndex >= day.items.length || toIndex < 0 || toIndex >= day.items.length || fromIndex === toIndex) {
        return state
      }

      const items = [...day.items]
      const [moved] = items.splice(fromIndex, 1)
      items.splice(toIndex, 0, moved)

      const nextDays = state.trip.days.map((d) => (d.dayIndex === dayIndex ? { ...d, items } : d))
      const { trip: nextTrip, warnings } = refreshTripDerived({ ...state.trip, days: nextDays })

      return {
        ...state,
        trip: nextTrip,
        warnings,
        undoStack: [state.trip, ...state.undoStack].slice(0, 20),
      }
    }

    case 'MOVE_ITEM_DAY': {
      const { itemId, targetDayIndex, targetSlot } = action.payload
      if (targetDayIndex < 1 || targetDayIndex > state.trip.numDays) return state

      let sourceItem: TripItem | null = null
      let sourceDayIndex = -1

      for (const day of state.trip.days) {
        const found = day.items.find((it) => it.id === itemId)
        if (found) {
          sourceItem = found
          sourceDayIndex = day.dayIndex
          break
        }
      }

      if (!sourceItem) return state

      const nextDays = state.trip.days.map((day) => {
        if (day.dayIndex === sourceDayIndex && day.dayIndex === targetDayIndex) {
          return day
        }
        if (day.dayIndex === sourceDayIndex) {
          return { ...day, items: day.items.filter((it) => it.id !== itemId) }
        }
        if (day.dayIndex === targetDayIndex) {
          const updatedItem: TripItem = {
            ...sourceItem!,
            slot: targetSlot ?? sourceItem!.slot,
          }
          return { ...day, items: [...day.items, updatedItem] }
        }
        return day
      })

      const { trip: nextTrip, warnings } = refreshTripDerived({ ...state.trip, days: nextDays })
      return {
        ...state,
        trip: nextTrip,
        warnings,
        undoStack: [state.trip, ...state.undoStack].slice(0, 20),
        activeDayIndex: targetDayIndex,
      }
    }

    case 'DELETE_ITEM': {
      const { itemId } = action.payload
      let deletedItem: TripItem | null = null
      let deletedDayIndex = -1
      let deletedPos = -1

      const nextDays = state.trip.days.map((day) => {
        const idx = day.items.findIndex((it) => it.id === itemId)
        if (idx !== -1) {
          deletedItem = day.items[idx]
          deletedDayIndex = day.dayIndex
          deletedPos = idx
          return { ...day, items: day.items.filter((it) => it.id !== itemId) }
        }
        return day
      })

      if (!deletedItem) return state

      const { trip: nextTrip, warnings } = refreshTripDerived({ ...state.trip, days: nextDays })
      return {
        ...state,
        trip: nextTrip,
        warnings,
        lastDeletedItem: { item: deletedItem, dayIndex: deletedDayIndex, position: deletedPos },
        undoStack: [state.trip, ...state.undoStack].slice(0, 20),
        selectedItemId: state.selectedItemId === itemId ? null : state.selectedItemId,
      }
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state
      const [previousTrip, ...remainingUndo] = state.undoStack
      const { trip: refreshed, warnings } = refreshTripDerived(previousTrip)
      return {
        ...state,
        trip: refreshed,
        warnings,
        undoStack: remainingUndo,
        lastDeletedItem: null,
      }
    }

    case 'REPLACE_ITEM': {
      const { itemId, newPlace, reason } = action.payload
      // Invariant: no duplicate placeId across the whole trip
      const allExistingPlaceIds = new Set(
        state.trip.days.flatMap((d) => d.items.filter((it) => it.id !== itemId).map((it) => it.placeId)),
      )
      if (allExistingPlaceIds.has(newPlace.id)) {
        return state // Prevent duplicate
      }

      let found = false
      const nextDays = state.trip.days.map((day) => {
        const idx = day.items.findIndex((it) => it.id === itemId)
        if (idx === -1) return day
        found = true
        const nextItems = [...day.items]
        nextItems[idx] = {
          ...nextItems[idx],
          placeId: newPlace.id,
          place: newPlace,
          reason: reason ?? nextItems[idx].reason,
          addedBy: 'user',
        }
        return { ...day, items: nextItems }
      })

      if (!found) return state
      const { trip: nextTrip, warnings } = refreshTripDerived({ ...state.trip, days: nextDays })
      return {
        ...state,
        trip: nextTrip,
        warnings,
        undoStack: [state.trip, ...state.undoStack].slice(0, 20),
      }
    }

    case 'ADD_ITEM': {
      const { dayIndex, slot, place } = action.payload
      // Invariant: no duplicate placeId across the whole trip
      const allExistingPlaceIds = new Set(state.trip.days.flatMap((d) => d.items.map((it) => it.placeId)))
      if (allExistingPlaceIds.has(place.id)) {
        return state // Prevent duplicate
      }

      const targetDay = state.trip.days.find((d) => d.dayIndex === dayIndex)
      if (!targetDay || targetDay.items.length >= 8) return state

      const newItemId = crypto.randomUUID()
      const newItem: TripItem = {
        id: newItemId,
        placeId: place.id,
        place,
        position: targetDay.items.length,
        slot,
        startTime: null,
        durationMin: 90,
        travelMinFromPrev: null,
        travelDistanceM: null,
        reason: 'Bạn đã thêm địa điểm này vào lịch trình.',
        note: null,
        isLocked: false,
        addedBy: 'user',
      }

      const nextDays = state.trip.days.map((day) => {
        if (day.dayIndex !== dayIndex) return day
        return { ...day, items: [...day.items, newItem] }
      })

      const { trip: nextTrip, warnings } = refreshTripDerived({ ...state.trip, days: nextDays })
      return {
        ...state,
        trip: nextTrip,
        warnings,
        undoStack: [state.trip, ...state.undoStack].slice(0, 20),
        selectedItemId: newItemId,
      }
    }

    case 'REPLACE_DAY': {
      const { dayIndex, items } = action.payload
      // Ensure positions are continuous 0..n-1
      const normalizedItems = items.map((it, idx) => ({ ...it, position: idx }))

      const nextDays = state.trip.days.map((day) => {
        if (day.dayIndex !== dayIndex) return day
        return { ...day, items: normalizedItems }
      })

      const { trip: nextTrip, warnings } = refreshTripDerived({ ...state.trip, days: nextDays })
      return {
        ...state,
        trip: nextTrip,
        warnings,
        undoStack: [state.trip, ...state.undoStack].slice(0, 20),
      }
    }

    default:
      return state
  }
}
