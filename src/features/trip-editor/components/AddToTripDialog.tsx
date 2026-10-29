import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { tripItemSchema, type PlaceSummary, type Slot, type Trip, type TripDraft } from '@shared/schemas'
import { useSession } from '@/features/auth/hooks/useSession'
import { getMyTripsApi, getTripApi, replaceTripApi } from '@/lib/api'
import { paths } from '@/app/paths'
import { readStoredTripDraft, writeStoredTripDraft } from '@/features/trip-wizard/storage'
import { vi } from '@/lib/strings/vi'

const slots: Slot[] = ['morning', 'noon', 'afternoon', 'evening']

export function AddToTripDialog({ place, onClose }: { place: PlaceSummary; onClose: () => void }) {
  const auth = useSession()
  const navigate = useNavigate()
  const token = auth.session?.access_token
  const trips = useQuery({ queryKey: ['my-trips'], queryFn: () => getMyTripsApi(token!), enabled: Boolean(token), retry: false })
  const [tripId, setTripId] = useState('')
  const [dayIndex, setDayIndex] = useState(1)
  const [slot, setSlot] = useState<Slot>('morning')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const selectedTrip = useQuery({ queryKey: ['trip', tripId], queryFn: () => getTripApi(tripId, token!), enabled: Boolean(token && tripId), retry: false })
  const draft = readStoredTripDraft()

  async function addToSavedTrip(trip: Trip) {
    if (!token) throw new Error('missing_session')
    if (trip.days.some(day => day.items.some(item => item.placeId === place.id))) throw new Error(vi.tripEditor.alreadyAdded)
    const target = trip.days.find(day => day.dayIndex === dayIndex)
    if (!target || target.items.length >= 8) throw new Error(vi.tripEditor.addPlaceLimit)
    const newItem = tripItemSchema.parse({
      id: crypto.randomUUID(), placeId: place.id, place, position: target.items.length, slot,
      startTime: null, durationMin: null, travelMinFromPrev: null, travelDistanceM: null,
      reason: null, note: null, isLocked: false, addedBy: 'user',
    })
    await replaceTripApi(trip.id, {
      expectedUpdatedAt: trip.updatedAt, title: trip.title, startDate: trip.startDate,
      days: trip.days.map(day => ({ ...day, items: day.dayIndex === dayIndex ? [...day.items, newItem] : day.items })),
    }, token)
    navigate(paths.trip(trip.id))
  }

  async function addToDraft(current: TripDraft) {
    if (current.days.some(day => day.items.some(item => item.placeId === place.id))) throw new Error(vi.tripEditor.alreadyAdded)
    const target = current.days.find(day => day.dayIndex === dayIndex)
    if (!target || target.items.length >= 8) throw new Error(vi.tripEditor.addPlaceLimit)
    const newItem = tripItemSchema.parse({
      id: crypto.randomUUID(), placeId: place.id, place, position: target.items.length, slot,
      startTime: null, durationMin: null, travelMinFromPrev: null, travelDistanceM: null,
      reason: null, note: null, isLocked: false, addedBy: 'user',
    })
    const next = { ...current, days: current.days.map(day => day.dayIndex === dayIndex ? { ...day, items: [...day.items, newItem] } : day) }
    writeStoredTripDraft(next)
    navigate(paths.tripDraft)
  }

  async function submit() {
    setError('')
    setBusy(true)
    try {
      if (auth.isAuthenticated) {
        if (!selectedTrip.data) throw new Error(vi.account.loadFailed)
        await addToSavedTrip(selectedTrip.data)
      } else {
        if (!draft) throw new Error(vi.tripEditor.noDraftForAdd)
        await addToDraft(draft)
      }
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : vi.account.actionFailed)
    } finally { setBusy(false) }
  }

  const numDays = auth.isAuthenticated ? selectedTrip.data?.numDays ?? 0 : draft?.numDays ?? 0
  return <div className="fixed inset-0 z-[1000] grid place-items-center bg-ink/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="add-saved-place-title" className="w-full max-w-lg rounded-card border border-line bg-surface p-6 shadow-card">
    <h2 id="add-saved-place-title" className="font-serif text-xl font-semibold">{vi.saved.addToTrip}</h2><p className="mt-2 text-sm text-ink-muted">{place.name}</p>
    {auth.isAuthenticated ? trips.isPending ? <p role="status" className="mt-4">{vi.account.loading}</p> : trips.isError ? <p role="alert" className="mt-4 text-danger">{vi.account.loadFailed}</p> : trips.data?.items.length ? <label className="mt-4 block text-sm">{vi.tripEditor.chooseTrip}<select value={tripId} onChange={event => { setTripId(event.target.value); setDayIndex(1) }} className="mt-2 min-h-11 w-full rounded-control border border-line bg-bg px-3"><option value="">{vi.tripEditor.chooseTrip}</option>{trips.data.items.map(trip => <option key={trip.id} value={trip.id}>{trip.title}</option>)}</select></label> : <p className="mt-4 text-sm text-ink-muted">{vi.account.emptyTrips}</p> : draft ? <p className="mt-4 text-sm text-ink-muted">{vi.tripEditor.draftBadge}: {draft.title}</p> : <div className="mt-4 text-sm text-ink-muted"><p>{vi.tripEditor.noDraftForAdd}</p><Link to={paths.planNew} onClick={onClose} className="mt-2 inline-flex text-primary underline">{vi.navigation.createTrip}</Link></div>}
    {numDays > 0 && <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-sm">{vi.tripEditor.dayTab(1)}<select value={dayIndex} onChange={event => setDayIndex(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-control border border-line bg-bg px-3">{Array.from({ length: numDays }, (_, index) => <option key={index + 1} value={index + 1}>{vi.tripEditor.dayTab(index + 1)}</option>)}</select></label><label className="text-sm">{vi.tripEditor.slotLabel}<select value={slot} onChange={event => setSlot(event.target.value as Slot)} className="mt-2 min-h-11 w-full rounded-control border border-line bg-bg px-3">{slots.map(value => <option key={value} value={value}>{vi.tripEditor.slots[value]}</option>)}</select></label></div>}
    {error && <p className="mt-3 text-sm text-danger" role="alert">{error}</p>}
    <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="min-h-11 rounded-control border border-line px-4">{vi.account.renameCancel}</button><button type="button" disabled={busy || (auth.isAuthenticated ? !selectedTrip.data : !draft)} onClick={() => void submit()} className="min-h-11 rounded-control bg-primary px-4 font-semibold text-white disabled:opacity-50">{busy ? vi.system.loading : vi.saved.addToTrip}</button></div>
  </section></div>
}
