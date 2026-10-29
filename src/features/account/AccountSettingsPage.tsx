import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useProfile } from '@/features/auth/hooks/useProfile'
import { useSession } from '@/features/auth/hooks/useSession'
import { deleteMyAccountApi, updateMyProfileApi } from '@/lib/api'
import { supabaseClient } from '@/lib/supabase'
import { paths } from '@/app/paths'
import { vi } from '@/lib/strings/vi'
import { useAccountPageMeta } from './useAccountPageMeta'

export default function AccountSettingsPage() {
  useAccountPageMeta(vi.account.profileTitle)
  const auth = useSession()
  const profile = useProfile()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [displayName, setDisplayName] = useState('')
  const [confirm, setConfirm] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => { if (profile.data) setDisplayName(profile.data.displayName ?? '') }, [profile.data])

  const update = useMutation({
    mutationFn: (name: string) => updateMyProfileApi(name, auth.session!.access_token),
    onSuccess: async result => { setFeedback(vi.account.profileSaved); await queryClient.setQueryData(['profile', result.id], result) },
    onError: () => setFeedback(vi.account.actionFailed),
  })
  const remove = useMutation({
    mutationFn: () => deleteMyAccountApi(auth.session!.access_token),
    onSuccess: async () => {
      await supabaseClient?.auth.signOut()
      queryClient.clear()
      navigate(paths.home, { replace: true })
    },
    onError: () => setFeedback(vi.account.actionFailed),
  })

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback('')
    update.mutate(displayName)
  }

  if (auth.status === 'loading' || profile.isPending) return <p className="rounded-card bg-surface p-8 text-center text-ink-muted" role="status">{vi.account.loading}</p>
  if (profile.isError || !profile.data) return <div className="rounded-card bg-surface p-8 text-center" role="alert"><p>{vi.account.loadFailed}</p><button className="mt-4 rounded-control bg-primary px-5 py-3 font-semibold text-white" onClick={() => void profile.refetch()}>{vi.system.retry}</button></div>

  return <div className="space-y-6">
    <header><h1 className="font-serif text-3xl font-bold text-ink">{vi.account.profileTitle}</h1><p className="mt-2 text-sm text-ink-muted">{vi.account.profileIntro}</p></header>
    <section className="rounded-card border border-line bg-surface p-5 sm:p-7"><h2 className="font-serif text-xl font-semibold">{vi.account.displayName}</h2><form className="mt-4 flex flex-col gap-4 sm:max-w-xl" onSubmit={saveProfile}><label className="text-sm font-medium" htmlFor="display-name">{vi.account.displayName}</label><input id="display-name" value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={60} required className="min-h-12 rounded-control border border-line bg-bg px-3" /><button disabled={update.isPending} className="min-h-11 self-start rounded-control bg-primary px-5 font-semibold text-white disabled:opacity-60">{update.isPending ? vi.system.loading : vi.account.saveProfile}</button></form>{feedback && <p className="mt-4 text-sm text-ink-muted" role="status">{feedback}</p>}</section>
    <section className="rounded-card border border-danger/30 bg-surface p-5 sm:p-7"><h2 className="font-serif text-xl font-semibold text-danger">{vi.account.dangerTitle}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{vi.account.dangerBody}</p><form className="mt-4 flex flex-col gap-4 sm:max-w-xl" onSubmit={event => { event.preventDefault(); if (confirm === 'XOA') remove.mutate() }}><label className="text-sm font-medium" htmlFor="delete-confirm">{vi.account.confirmWord}</label><input id="delete-confirm" value={confirm} onChange={event => setConfirm(event.target.value)} autoComplete="off" className="min-h-12 rounded-control border border-line bg-bg px-3" /><button disabled={confirm !== 'XOA' || remove.isPending} className="min-h-11 self-start rounded-control bg-danger px-5 font-semibold text-white disabled:opacity-50">{remove.isPending ? vi.system.loading : vi.account.deleteAccount}</button></form></section>
  </div>
}
