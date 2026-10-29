import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/useSession'
import { deleteTripApi, duplicateTripApi, getMyTripsApi, patchTripApi } from '@/lib/api'
import { paths } from '@/app/paths'
import { vi } from '@/lib/strings/vi'
import { useAccountPageMeta } from './useAccountPageMeta'

export default function MyTripsPage() {
  useAccountPageMeta(vi.account.tripsTitle)
  const auth = useSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const token = auth.session?.access_token
  const trips = useQuery({ queryKey: ['my-trips'], queryFn: () => getMyTripsApi(token!), enabled: Boolean(token), retry: false })
  const [renaming, setRenaming] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['my-trips'] })
  const rename = useMutation({ mutationFn: ({ id, value }: { id: string; value: string }) => patchTripApi(id, { title: value.trim() }, token!), onSuccess: refresh, onError: () => setError(vi.account.actionFailed) })
  const duplicate = useMutation({ mutationFn: (id: string) => duplicateTripApi(id, token!), onSuccess: trip => { void refresh(); navigate(paths.trip(trip.id)) }, onError: () => setError(vi.account.actionFailed) })
  const remove = useMutation({ mutationFn: (id: string) => deleteTripApi(id, token!), onSuccess: () => { setDeleting(null); void refresh() }, onError: () => setError(vi.account.actionFailed) })

  function submitRename(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault()
    if (title.trim()) rename.mutate({ id, value: title })
  }

  if (auth.status === 'loading' || trips.isPending) return <p className="rounded-card bg-surface p-8 text-center text-ink-muted" role="status">{vi.account.loading}</p>
  if (trips.isError) return <div className="rounded-card bg-surface p-8 text-center" role="alert"><p>{vi.account.loadFailed}</p><button className="mt-4 rounded-control bg-primary px-5 py-3 font-semibold text-white" onClick={() => void trips.refetch()}>{vi.system.retry}</button></div>
  const items = trips.data?.items ?? []

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="font-serif text-3xl font-bold text-ink">{vi.account.tripsTitle}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{vi.account.tripsIntro}</p></div><Link to={paths.planNew} className="inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-5 font-semibold text-white">{vi.account.createTrip}</Link></header>
    {error && <p className="rounded-control bg-warning/10 p-4 text-sm text-ink" role="alert">{error}</p>}
    {items.length === 0 ? <section className="rounded-card border border-line bg-surface p-10 text-center"><p className="text-ink-muted">{vi.account.emptyTrips}</p><Link to={paths.planNew} className="mt-5 inline-flex min-h-11 items-center rounded-control bg-primary px-5 font-semibold text-white">{vi.account.createTrip}</Link></section> : <ul className="grid gap-4 xl:grid-cols-2">{items.map(trip => <li key={trip.id} className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {trip.coverImageUrl && trip.coverImageCredit && trip.coverImageLicense ? <figure><img src={trip.coverImageUrl} alt={trip.coverImageAlt ?? trip.title} className="h-44 w-full object-cover" /><figcaption className="px-4 pt-2 text-xs text-ink-muted">{trip.coverImageSourceUrl ? <a href={trip.coverImageSourceUrl} target="_blank" rel="noreferrer" className="underline">{vi.account.coverCredit(trip.coverImageCredit, trip.coverImageLicense)}</a> : vi.account.coverCredit(trip.coverImageCredit, trip.coverImageLicense)}</figcaption></figure> : <div aria-hidden="true" className="h-28 bg-gradient-to-br from-primary-tint via-surface-high to-secondary-tint" />}
      <article className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-serif text-xl font-semibold text-ink">{trip.title}</h2><p className="mt-2 text-sm text-ink-muted">{vi.account.days(trip.numDays)}{trip.startDate ? ` · ${trip.startDate}` : ''}</p><p className="mt-1 text-xs text-ink-muted">{vi.account.updated(new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(trip.updatedAt)))}</p></div><Link to={paths.trip(trip.id)} className="min-h-11 shrink-0 rounded-control bg-primary px-4 py-3 text-sm font-semibold text-white">{vi.account.openTrip}</Link></div>
        {renaming === trip.id ? <form className="mt-4 flex flex-wrap gap-2" onSubmit={event => submitRename(event, trip.id)}><label className="sr-only" htmlFor={`trip-title-${trip.id}`}>{vi.account.tripsTitle}</label><input id={`trip-title-${trip.id}`} value={title} onChange={event => setTitle(event.target.value)} maxLength={100} className="min-h-11 flex-1 rounded-control border border-line bg-bg px-3" /><button disabled={rename.isPending} className="rounded-control bg-primary px-4 font-semibold text-white">{vi.account.renameSave}</button><button type="button" onClick={() => setRenaming(null)} className="rounded-control border border-line px-4">{vi.account.renameCancel}</button></form> : <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => { setTitle(trip.title); setRenaming(trip.id) }} className="min-h-11 rounded-control border border-line px-4 text-sm">{vi.account.rename}</button><button disabled={duplicate.isPending} onClick={() => duplicate.mutate(trip.id)} className="min-h-11 rounded-control border border-line px-4 text-sm">{vi.account.duplicate}</button><button onClick={() => setDeleting(trip.id)} className="min-h-11 rounded-control border border-line px-4 text-sm text-danger">{vi.account.remove}</button></div>}
      </article>
    </li>)}</ul>}
    {deleting && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="delete-trip-title" className="w-full max-w-md rounded-card bg-surface p-6 shadow-card"><h2 id="delete-trip-title" className="font-serif text-xl font-semibold">{vi.account.deleteTitle}</h2><p className="mt-2 text-sm leading-6 text-ink-muted">{vi.account.deleteBody}</p><div className="mt-6 flex justify-end gap-2"><button disabled={remove.isPending} onClick={() => setDeleting(null)} className="min-h-11 rounded-control border border-line px-4">{vi.account.renameCancel}</button><button disabled={remove.isPending} onClick={() => remove.mutate(deleting)} className="min-h-11 rounded-control bg-danger px-4 font-semibold text-white">{vi.account.confirmDelete}</button></div></section></div>}
  </div>
}
