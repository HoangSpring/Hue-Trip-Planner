import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setTripShareApi } from '@/lib/api'
import { useSession } from '@/features/auth/hooks/useSession'
import { vi } from '@/lib/strings/vi'
import type { Trip } from '@shared/schemas'

export function ShareDialog({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const auth = useSession()
  const queryClient = useQueryClient()
  const token = auth.session?.access_token
  const [copied, setCopied] = useState(false)
  const mutation = useMutation({ mutationFn: (enabled: boolean) => setTripShareApi(trip.id, enabled, token!), onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: ['my-trips'] })
    void queryClient.invalidateQueries({ queryKey: ['trip', trip.id] })
  } })
  const enabled = mutation.data?.isShared ?? trip.isShared
  const shareUrl = mutation.data ? mutation.data.shareUrl : (trip.shareToken ? `${window.location.origin}/s/${trip.shareToken}` : null)

  async function copy() {
    if (!shareUrl) return
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true) } catch { setCopied(false) }
  }

  return <div className="fixed inset-0 z-[1100] grid place-items-center bg-ink/50 p-4" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="share-trip-title" className="w-full max-w-lg rounded-card border border-line bg-surface p-6 shadow-card">
      <div className="flex items-start justify-between gap-4"><div><h2 id="share-trip-title" className="font-serif text-2xl font-semibold">{vi.share.title}</h2><p className="mt-1 text-sm text-ink-muted">{trip.title}</p></div><button type="button" aria-label={vi.components.close} onClick={onClose} className="min-h-11 min-w-11 rounded-full border border-line">×</button></div>
      {mutation.isError && <p role="alert" className="mt-4 rounded-control bg-danger/10 p-3 text-sm text-danger">{vi.share.failed}</p>}
      <label className="mt-6 flex cursor-pointer items-center justify-between gap-4 rounded-control border border-line p-4"><span><span className="block font-semibold">{vi.share.toggle}</span><span className="mt-1 block text-xs text-ink-muted">{vi.share.hint}</span></span><input type="checkbox" checked={enabled} disabled={mutation.isPending} onChange={event => mutation.mutate(event.currentTarget.checked)} className="size-5 accent-primary" /></label>
      {enabled && shareUrl && <div className="mt-5"><label htmlFor="share-trip-url" className="text-sm font-semibold">{vi.share.linkLabel}</label><div className="mt-2 flex gap-2"><input id="share-trip-url" readOnly value={shareUrl} className="min-w-0 flex-1 rounded-control border border-line bg-bg px-3 text-sm"/><button type="button" onClick={() => void copy()} className="min-h-11 shrink-0 rounded-control bg-primary px-4 text-sm font-semibold text-white">{copied ? vi.share.copied : vi.share.copy}</button></div></div>}
      <div className="mt-6 flex justify-end"><button type="button" onClick={onClose} className="min-h-11 rounded-control border border-line px-4">{vi.account.renameCancel}</button></div>
    </section>
  </div>
}
