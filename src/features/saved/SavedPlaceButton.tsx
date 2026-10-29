import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/useSession'
import { deleteSavedPlaceApi, getSavedPlacesApi, putSavedPlaceApi } from '@/lib/api'
import { paths } from '@/app/paths'
import { clearPendingAction, writePendingAction } from '@/features/trip-wizard/storage'
import { vi } from '@/lib/strings/vi'
import { placeSummarySchema, type PlaceSummary } from '@shared/schemas'

export function SavedPlaceButton({ place, className = '' }: { place: Pick<PlaceSummary, 'id' | 'name'> & Partial<PlaceSummary>; className?: string }) {
  const auth = useSession()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [loginOpen, setLoginOpen] = useState(false)
  const [error, setError] = useState(false)
  const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(null)
  const userId = auth.user?.id
  const token = auth.session?.access_token
  const key = ['saved-places', userId] as const
  const savedQuery = useQuery({ queryKey: key, queryFn: () => getSavedPlacesApi(token!), enabled: Boolean(token), staleTime: 30_000 })
  const saved = optimisticSaved ?? (savedQuery.data?.items.some(item => item.id === place.id) ?? false)

  const mutation = useMutation({
    mutationFn: () => saved ? deleteSavedPlaceApi(place.id, token!) : putSavedPlaceApi(place.id, token!),
    onMutate: async () => {
      setError(false)
      setOptimisticSaved(!saved)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<{ items: PlaceSummary[] }>(key)
      const candidate = placeSummarySchema.safeParse(place)
      if (saved) queryClient.setQueryData<{ items: PlaceSummary[] }>(key, current => ({ items: (current?.items ?? []).filter(item => item.id !== place.id) }))
      else if (candidate.success) queryClient.setQueryData<{ items: PlaceSummary[] }>(key, current => ({ items: [...(current?.items ?? []), candidate.data] }))
      return { previous }
    },
    onError: (_error, _variables, context) => {
      setError(true)
      setOptimisticSaved(null)
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSuccess: () => setOptimisticSaved(null),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })

  function handleClick() {
    if (auth.status === 'loading') return
    if (!token) {
      writePendingAction({ type: 'save_place', placeId: place.id })
      setLoginOpen(true)
      return
    }
    mutation.mutate()
  }

  const next = `${location.pathname}${location.search}`
  return <>
    <button type="button" aria-label={(saved ? vi.components.unsavePlace : vi.components.savePlace)(place.name)} aria-pressed={saved} disabled={auth.status === 'loading' || mutation.isPending} onClick={handleClick} className={`grid size-11 place-items-center rounded-full border border-line bg-white/95 text-xl text-primary shadow-card hover:bg-primary-tint disabled:opacity-60 ${className}`}>
      <span aria-hidden="true">{saved ? '♥' : '♡'}</span>
    </button>
    {error && <span className="sr-only" role="alert">{vi.account.actionFailed}</span>}
    {loginOpen && <div className="fixed inset-0 z-[1000] grid place-items-center bg-ink/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="save-place-login-title" className="w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-card">
      <h2 id="save-place-login-title" className="font-serif text-xl font-semibold">{vi.saved.loginTitle}</h2><p className="mt-2 text-sm leading-6 text-ink-muted">{vi.saved.loginBody(place.name)}</p>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => { clearPendingAction(); setLoginOpen(false) }} className="min-h-11 rounded-control border border-line px-4">{vi.account.renameCancel}</button><Link to={`${paths.login}?next=${encodeURIComponent(next)}`} className="inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-4 font-semibold text-white">{vi.navigation.signIn}</Link></div>
    </section></div>}
  </>
}
