import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { vi } from '@/lib/strings/vi'
import { readStoredTripDraft, writeStoredTripDraft, readStoredNotices } from '@/features/trip-wizard/storage'
import type { Notice, PlaceMapItemDto, Slot, TripDraft, PlaceSummary, TripItem } from '@shared/schemas'
import { placeMapItemSchema } from '@shared/schemas/placeApi'
import { MapView } from '@/features/map/MapView'
import {
  createInitialEditorState,
  tripEditorReducer,
} from './tripEditorReducer'
import { GuestBanner } from './components/GuestBanner'
import { NoticesBanner } from './components/NoticesBanner'
import { DaySelector } from './components/DaySelector'
import { SlotSection } from './components/SlotSection'
import { LoginPromptModal } from './components/LoginPromptModal'
import { AlternativesSheet } from './components/AlternativesSheet'
import { AddPlaceSheet } from './components/AddPlaceSheet'

const emptyTrip: TripDraft = {
  clientDraftId: '00000000-0000-0000-0000-000000000000',
  title: '',
  startDate: null,
  numDays: 1,
  generatedBy: 'fallback',
  llmModel: null,
  start: null,
  input: {
    numDays: 1,
    startDate: null,
    companion: 'couple',
    groupSize: 2,
    interests: [],
    pace: 'moderate',
    budget: null,
    transport: null,
    start: null,
    notes: null,
  },
  days: [],
}

export function TripEditorPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Read initial stored trip draft
  const initialDraft = useMemo(() => {
    return readStoredTripDraft()
  }, [])

  const [notices] = useState<Notice[]>(() => readStoredNotices())

  const dayParam = Number(searchParams.get('day'))
  const initialDayIndex = dayParam >= 1 ? dayParam : 1

  const hasValidDraft = Boolean(initialDraft)

  const [state, dispatch] = useReducer(
    tripEditorReducer,
    initialDraft ?? emptyTrip,
    (draft) => createInitialEditorState(draft, initialDayIndex)
  )

  // Modals & UI States
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [loginActionName, setLoginActionName] = useState('Lưu lịch trình')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(state.trip?.title ?? '')
  const [isMobileMapOpen, setIsMobileMapOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Sheet states for T-027
  const [selectedAlternativeItem, setSelectedAlternativeItem] = useState<TripItem | null>(null)
  const [isAlternativesSheetOpen, setIsAlternativesSheetOpen] = useState(false)
  const [isAddPlaceSheetOpen, setIsAddPlaceSheetOpen] = useState(false)

  const allExistingPlaceIds = useMemo(() => {
    if (!state.trip) return new Set<string>()
    return new Set(state.trip.days.flatMap((d) => d.items.map((it) => it.placeId)))
  }, [state.trip])

  // Toast for deleted item & undo
  const [toast, setToast] = useState<{ message: string; visible: boolean } | null>(null)
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isFirstRender = useRef(true)

  // Sync state.activeDayIndex and searchParams ?day=
  useEffect(() => {
    const currentParamDay = Number(searchParams.get('day'))
    if (currentParamDay >= 1 && currentParamDay !== state.activeDayIndex) {
      dispatch({ type: 'SET_ACTIVE_DAY', payload: currentParamDay })
    }
  }, [searchParams, state.activeDayIndex])

  // Sync state.selectedItemId and searchParams ?item=
  useEffect(() => {
    const currentParamItem = searchParams.get('item')
    if (currentParamItem && currentParamItem !== state.selectedItemId) {
      dispatch({ type: 'SELECT_ITEM', payload: currentParamItem })
    }
  }, [searchParams, state.selectedItemId])

  // Debounced auto-save ~800ms
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (!state.trip) return

    setSaveStatus('saving')
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)

    autoSaveTimerRef.current = setTimeout(() => {
      writeStoredTripDraft(state.trip)
      setSaveStatus('saved')
    }, 800)

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [state.trip])

  const handleSelectDay = useCallback(
    (dayIndex: number) => {
      dispatch({ type: 'SET_ACTIVE_DAY', payload: dayIndex })
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('day', String(dayIndex))
      nextParams.delete('item')
      setSearchParams(nextParams)
    },
    [searchParams, setSearchParams]
  )

  const handleSelectItem = useCallback(
    (itemId: string | null) => {
      dispatch({ type: 'SELECT_ITEM', payload: itemId })
      const nextParams = new URLSearchParams(searchParams)
      if (itemId) {
        nextParams.set('item', itemId)
      } else {
        nextParams.delete('item')
      }
      setSearchParams(nextParams)
    },
    [searchParams, setSearchParams]
  )

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault()
    if (titleInput.trim()) {
      dispatch({ type: 'UPDATE_TITLE', payload: titleInput.trim() })
    }
    setIsEditingTitle(false)
  }

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      // Find item name for toast
      let placeName = 'địa điểm'
      for (const d of state.trip.days) {
        const found = d.items.find((it) => it.id === itemId)
        if (found?.place?.name) {
          placeName = found.place.name
          break
        }
      }

      dispatch({ type: 'DELETE_ITEM', payload: { itemId } })

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      setToast({
        message: vi.tripEditor.itemDeleted(placeName),
        visible: true,
      })

      toastTimerRef.current = setTimeout(() => {
        setToast((prev) => (prev ? { ...prev, visible: false } : null))
      }, 5000)
    },
    [state.trip?.days]
  )

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' })
    setToast(null)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
  }, [])

  const handleToggleLock = useCallback((itemId: string) => {
    dispatch({ type: 'TOGGLE_LOCK', payload: { itemId } })
  }, [])

  const handleMoveUp = useCallback(
    (itemId: string) => {
      const currentDay = state.trip.days.find((d) => d.dayIndex === state.activeDayIndex)
      if (!currentDay) return
      const idx = currentDay.items.findIndex((it) => it.id === itemId)
      if (idx > 0) {
        dispatch({
          type: 'MOVE_ITEM_POSITION',
          payload: { dayIndex: state.activeDayIndex, fromIndex: idx, toIndex: idx - 1 },
        })
      }
    },
    [state.trip?.days, state.activeDayIndex]
  )

  const handleMoveDown = useCallback(
    (itemId: string) => {
      const currentDay = state.trip.days.find((d) => d.dayIndex === state.activeDayIndex)
      if (!currentDay) return
      const idx = currentDay.items.findIndex((it) => it.id === itemId)
      if (idx !== -1 && idx < currentDay.items.length - 1) {
        dispatch({
          type: 'MOVE_ITEM_POSITION',
          payload: { dayIndex: state.activeDayIndex, fromIndex: idx, toIndex: idx + 1 },
        })
      }
    },
    [state.trip?.days, state.activeDayIndex]
  )

  const handleMoveToDay = useCallback(
    (itemId: string, targetDayIndex: number) => {
      dispatch({
        type: 'MOVE_ITEM_DAY',
        payload: { itemId, targetDayIndex },
      })
      handleSelectDay(targetDayIndex)
    },
    [handleSelectDay]
  )

  const handleUpdateItemTimes = useCallback(
    (itemId: string, startTime: string | null, durationMin: number | null) => {
      dispatch({
        type: 'UPDATE_ITEM',
        payload: { itemId, startTime, durationMin },
      })
    },
    []
  )

  const handleUpdateNote = useCallback((itemId: string, note: string | null) => {
    dispatch({
      type: 'UPDATE_ITEM',
      payload: { itemId, note },
    })
  }, [])

  const handleDropOnItem = useCallback(
    (sourceItemId: string, targetItemId: string) => {
      const currentDay = state.trip?.days.find((d) => d.dayIndex === state.activeDayIndex)
      if (!currentDay) return
      const fromIdx = currentDay.items.findIndex((it) => it.id === sourceItemId)
      const toIdx = currentDay.items.findIndex((it) => it.id === targetItemId)
      if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
        dispatch({
          type: 'MOVE_ITEM_POSITION',
          payload: { dayIndex: state.activeDayIndex, fromIndex: fromIdx, toIndex: toIdx },
        })
      }
    },
    [state.trip?.days, state.activeDayIndex]
  )

  const handleOpenAlternatives = useCallback((item: TripItem) => {
    setSelectedAlternativeItem(item)
    setIsAlternativesSheetOpen(true)
  }, [])

  const handleSelectAlternative = useCallback(
    (item: TripItem, newPlace: PlaceSummary, reasonTag: string) => {
      dispatch({
        type: 'REPLACE_ITEM',
        payload: {
          itemId: item.id,
          newPlace,
          reason: `Gợi ý thay thế (${reasonTag}): ${newPlace.name}`,
        },
      })
      setIsAlternativesSheetOpen(false)
      setSelectedAlternativeItem(null)

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      setToast({
        message: `Đã đổi thành ${newPlace.name}`,
        visible: true,
      })
      toastTimerRef.current = setTimeout(() => {
        setToast((prev) => (prev ? { ...prev, visible: false } : null))
      }, 5000)
    },
    []
  )

  const handleAddPlace = useCallback(
    (place: PlaceSummary, slot: Slot) => {
      dispatch({
        type: 'ADD_ITEM',
        payload: {
          dayIndex: state.activeDayIndex,
          slot,
          place,
        },
      })
      setIsAddPlaceSheetOpen(false)

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      setToast({
        message: `Đã thêm ${place.name}`,
        visible: true,
      })
      toastTimerRef.current = setTimeout(() => {
        setToast((prev) => (prev ? { ...prev, visible: false } : null))
      }, 5000)
    },
    [state.activeDayIndex]
  )

  // If no draft is available, show empty trip fallback
  if (!hasValidDraft || !state.trip) {
    return (
      <div className="mx-auto max-w-content px-4 py-16 text-center">
        <h2 className="font-serif text-2xl font-bold text-ink">{vi.tripEditor.emptyTripTitle}</h2>
        <p className="mt-2 text-sm text-ink-muted">{vi.tripEditor.emptyTripBody}</p>
        <Link
          to={paths.planNew}
          className="mt-6 inline-flex items-center justify-center rounded-control bg-primary px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
        >
          {vi.tripEditor.createTripBtn}
        </Link>
      </div>
    )
  }

  const activeDay =
    state.trip.days.find((d) => d.dayIndex === state.activeDayIndex) ?? state.trip.days[0]

  // Map items for the active day
  const mapPlaces: PlaceMapItemDto[] = useMemo(() => {
    if (!activeDay) return []
    const items: PlaceMapItemDto[] = []
    for (const it of activeDay.items) {
      if (it.place) {
        try {
          items.push(
            placeMapItemSchema.parse({
              id: it.place.id,
              slug: it.place.slug,
              name: it.place.name,
              category: it.place.category,
              lat: it.place.lat,
              lng: it.place.lng,
              coverImageUrl: it.place.coverImageUrl,
            })
          )
        } catch {
          // ignore malformed place item
        }
      }
    }
    return items
  }, [activeDay])

  // Total daily travel calculation
  const totalTravel = useMemo(() => {
    if (!activeDay) return { distanceM: 0, timeMin: 0 }
    let distM = 0
    let timeMin = 0
    for (const item of activeDay.items) {
      if (item.travelDistanceM) distM += item.travelDistanceM
      if (item.travelMinFromPrev) timeMin += item.travelMinFromPrev
    }
    return { distanceM: distM, timeMin }
  }, [activeDay])

  const slotsOrder: Slot[] = ['morning', 'noon', 'afternoon', 'evening']

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Guest Banner */}
      <GuestBanner />

      {/* Generation Notices Banner */}
      <NoticesBanner notices={notices} />

      {/* Trip Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-surface p-5 sm:p-6 shadow-sm border border-line">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wider text-primary">
              {vi.tripEditor.draftBadge}
            </span>
            <span className="text-line-dark">•</span>
            <span className="text-ink-muted">
              {saveStatus === 'saving'
                ? vi.tripEditor.savingDraft
                : saveStatus === 'saved'
                ? vi.tripEditor.savedDraft
                : ''}
            </span>
          </div>

          {/* Editable Title */}
          {isEditingTitle ? (
            <form onSubmit={handleSaveTitle} className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                maxLength={100}
                className="w-full max-w-md rounded-lg border border-primary bg-surface px-3 py-1.5 font-serif text-xl sm:text-2xl font-bold text-ink focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="rounded-control bg-primary px-3 py-1.5 text-xs font-semibold text-white"
              >
                Lưu
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitleInput(state.trip.title)
                  setIsEditingTitle(false)
                }}
                className="text-xs text-ink-muted hover:underline"
              >
                Hủy
              </button>
            </form>
          ) : (
            <div className="mt-1 flex items-center gap-2 group">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink truncate">
                {state.trip.title}
              </h1>
              <button
                type="button"
                onClick={() => {
                  setTitleInput(state.trip.title)
                  setIsEditingTitle(true)
                }}
                title={vi.tripEditor.editTitlePrompt}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-ink-muted hover:text-primary transition-opacity"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}

          {/* Metadata badges */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <span className="rounded-md bg-surface-high px-2 py-0.5 font-medium text-ink">
              {state.trip.numDays} ngày
            </span>
            {state.trip.startDate && (
              <span className="rounded-md bg-surface-high px-2 py-0.5">
                Bắt đầu: {state.trip.startDate}
              </span>
            )}
            {state.trip.start?.label && (
              <span className="rounded-md bg-surface-high px-2 py-0.5">
                Xuất phát: {state.trip.start.label}
              </span>
            )}
            <span className="rounded-md bg-surface-high px-2 py-0.5">
              Nhịp độ: {state.trip.input.pace === 'relaxed' ? 'Thong thả' : state.trip.input.pace === 'packed' ? 'Dày đặc' : 'Vừa phải'}
            </span>
          </div>
        </div>

        {/* Action buttons: Lưu & Chia sẻ (show login prompt for guests) */}
        <div className="flex shrink-0 items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-line">
          <button
            type="button"
            onClick={() => {
              setLoginActionName('Lưu lịch trình')
              setLoginModalOpen(true)
            }}
            className="rounded-control bg-surface-high hover:bg-surface-high/80 border border-line px-4 py-2 text-xs font-semibold text-ink transition-colors"
          >
            Lưu
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginActionName('Chia sẻ lịch trình')
              setLoginModalOpen(true)
            }}
            className="rounded-control bg-primary hover:bg-primary-hover px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            Chia sẻ
          </button>
        </div>
      </div>

      {/* Day Selector */}
      <DaySelector
        numDays={state.trip.numDays}
        activeDayIndex={state.activeDayIndex}
        startDate={state.trip.startDate}
        onSelectDay={handleSelectDay}
      />

      {/* Two-Column Responsive Layout: Left Timeline ~55%, Right Sticky Map ~45% */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Timeline */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Day Note / Intro */}
          <div className="rounded-2xl bg-surface-high/60 border border-line p-4 flex items-start gap-3">
            <span className="text-xl">📖</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Hành trình {vi.tripEditor.dayTab(state.activeDayIndex)}
              </span>
              <p className="text-xs text-ink-muted">
                Khám phá cố đô với các điểm dừng được sắp xếp tối ưu theo thời gian và cung đường di chuyển.
              </p>
            </div>
          </div>

          {/* Slots & Items */}
          {activeDay && activeDay.items.length > 0 ? (
            <div className="flex flex-col gap-6">
              {slotsOrder.map((slot) => {
                const slotItems = activeDay.items.filter((it) => it.slot === slot)
                return (
                  <SlotSection
                    key={slot}
                    slot={slot}
                    items={slotItems}
                    dayItems={activeDay.items}
                    totalDays={state.trip.numDays}
                    currentDayIndex={state.activeDayIndex}
                    selectedItemId={state.selectedItemId}
                    warnings={state.warnings}
                    transport={state.trip.input.transport}
                    onSelectItem={handleSelectItem}
                    onToggleLock={handleToggleLock}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onMoveToDay={handleMoveToDay}
                    onDelete={handleDeleteItem}
                    onUpdateItemTimes={handleUpdateItemTimes}
                    onUpdateNote={handleUpdateNote}
                    onDropOnItem={handleDropOnItem}
                    onOpenAlternatives={handleOpenAlternatives}
                  />
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-surface p-8 text-center border border-line">
              <p className="text-sm text-ink-muted">{vi.tripEditor.noStopsInDay}</p>
            </div>
          )}

          {/* Bottom Action Strip for Active Day */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-line">
            <button
              type="button"
              onClick={() => setIsAddPlaceSheetOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-surface-high hover:bg-surface-high/80 border border-line px-5 py-2.5 text-xs font-semibold text-ink shadow-xs transition-colors"
            >
              <span>+</span>
              <span>{vi.tripEditor.addPlaceBtn}</span>
            </button>
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary-tint/30 hover:bg-primary-tint/50 border border-primary/30 px-5 py-2.5 text-xs font-semibold text-primary shadow-xs transition-colors"
            >
              <span>✨</span>
              <span>{vi.tripEditor.regenerateDayBtn}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Desktop Sticky Map */}
        <div className="hidden lg:flex lg:col-span-5 sticky top-24 self-start flex-col gap-3">
          <div className="rounded-3xl overflow-hidden bg-surface border border-line shadow-card flex flex-col">
            {/* Route Metrics Header */}
            <div className="flex items-center justify-between border-b border-line bg-surface/90 backdrop-blur-xs px-4 py-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <span className="text-primary">📍</span>
                <span>{vi.tripEditor.totalDistance(totalTravel.distanceM)}</span>
              </div>
              <div className="text-xs text-ink-muted">
                {vi.tripEditor.totalTravelTime(totalTravel.timeMin)}
              </div>
            </div>

            {/* Map Canvas */}
            <MapView
              places={mapPlaces}
              numbered={true}
              height="540px"
              selectedPlaceId={
                state.selectedItemId
                  ? activeDay?.items.find((it) => it.id === state.selectedItemId)?.placeId ?? null
                  : null
              }
              onSelectPlace={(place) => {
                if (place) {
                  const matchingItem = activeDay?.items.find((it) => it.placeId === place.id)
                  if (matchingItem) {
                    handleSelectItem(matchingItem.id)
                  }
                } else {
                  handleSelectItem(null)
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Floating Button for Mobile Map */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsMobileMapOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-xl hover:bg-primary-hover transition-colors"
        >
          <span className="text-base">🗺️</span>
          <span>{vi.tripEditor.viewMapBtn} ({mapPlaces.length})</span>
        </button>
      </div>

      {/* Mobile Map Drawer / Modal */}
      {isMobileMapOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface p-4 sm:p-6 lg:hidden">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <span className="text-lg">🗺️</span>
              <h2 className="font-serif text-lg font-bold text-ink">
                Bản đồ {vi.tripEditor.dayTab(state.activeDayIndex)}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMapOpen(false)}
              className="rounded-full bg-surface-high p-2 text-ink hover:bg-surface-high/80 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          {/* Route Metrics on mobile */}
          <div className="flex items-center justify-between py-2 text-xs text-ink-muted">
            <span>{vi.tripEditor.totalDistance(totalTravel.distanceM)}</span>
            <span>{vi.tripEditor.totalTravelTime(totalTravel.timeMin)}</span>
          </div>

          <div className="flex-1 rounded-2xl overflow-hidden mt-2">
            <MapView
              places={mapPlaces}
              numbered={true}
              height="100%"
              selectedPlaceId={
                state.selectedItemId
                  ? activeDay?.items.find((it) => it.id === state.selectedItemId)?.placeId ?? null
                  : null
              }
              onSelectPlace={(place) => {
                if (place) {
                  const matchingItem = activeDay?.items.find((it) => it.placeId === place.id)
                  if (matchingItem) {
                    handleSelectItem(matchingItem.id)
                  }
                } else {
                  handleSelectItem(null)
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Toast Notification (Delete & Undo) */}
      {toast?.visible && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-6 z-50 flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-xs text-white shadow-xl animate-fade-in"
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={handleUndo}
            className="rounded font-bold text-accent underline hover:text-accent-tint transition-colors ml-2"
          >
            {vi.tripEditor.undo}
          </button>
        </aside>
      )}

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        actionLabel={loginActionName}
      />

      {/* Alternatives Sheet */}
      <AlternativesSheet
        isOpen={isAlternativesSheetOpen}
        targetItem={selectedAlternativeItem}
        currentDate={activeDay?.date ?? null}
        tripInput={state.trip.input}
        excludePlaceIds={Array.from(allExistingPlaceIds)}
        onClose={() => {
          setIsAlternativesSheetOpen(false)
          setSelectedAlternativeItem(null)
        }}
        onSelectAlternative={handleSelectAlternative}
        onOpenSearchFallback={() => {
          setIsAlternativesSheetOpen(false)
          setSelectedAlternativeItem(null)
          setIsAddPlaceSheetOpen(true)
        }}
      />

      {/* Add Place Sheet */}
      <AddPlaceSheet
        isOpen={isAddPlaceSheetOpen}
        dayIndex={state.activeDayIndex}
        allExistingPlaceIds={allExistingPlaceIds}
        onClose={() => setIsAddPlaceSheetOpen(false)}
        onAddPlace={handleAddPlace}
      />
    </div>
  )
}
