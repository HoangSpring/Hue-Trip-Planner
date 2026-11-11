import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/useSession'
import { vi } from '@/lib/strings/vi'
import { deleteAdminUser, listAdminUsers, setAdminUserSuspension, updateAdminUserRole } from './adminApi'
import type { AdminUser } from '@shared/schemas/adminUser'

export default function AdminUsersPage() {
  const auth = useSession()
  const token = auth.session?.access_token ?? ''
  const actorId = auth.user?.id
  const client = useQueryClient()
  const [page, setPage] = useState(1)
  const [roleDrafts, setRoleDrafts] = useState<Record<string, 'user' | 'admin'>>({})
  const [deleting, setDeleting] = useState<AdminUser | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const users = useQuery({ queryKey: ['admin-users', page], queryFn: () => listAdminUsers(token, page), enabled: Boolean(token), retry: false })

  const invalidate = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['admin-users'] }),
      client.invalidateQueries({ queryKey: ['admin-dashboard'] }),
    ])
  }
  const roleMutation = useMutation({ mutationFn: ({ id, role }: { id: string; role: 'user' | 'admin' }) => updateAdminUserRole(id, role, token), onSuccess: async user => { setRoleDrafts(current => { const next = { ...current }; delete next[user.id]; return next }); await invalidate() } })
  const suspensionMutation = useMutation({ mutationFn: ({ id, suspended }: { id: string; suspended: boolean }) => setAdminUserSuspension(id, suspended, token), onSuccess: invalidate })
  const deleteMutation = useMutation({ mutationFn: (id: string) => deleteAdminUser(id, token), onSuccess: async () => { setDeleting(null); setDeleteConfirmation(''); if (users.data?.items.length === 1 && page > 1) setPage(value => value - 1); await invalidate() } })
  const actionError = roleMutation.error || suspensionMutation.error || deleteMutation.error

  return <div className="space-y-6">
    <header><p className="text-sm font-semibold text-secondary">{vi.layout.admin}</p><h1 className="mt-1 font-serif text-3xl font-bold">{vi.admin.users}</h1><p className="mt-2 text-sm text-ink-muted">{vi.admin.usersIntro}</p><p className="mt-3 rounded-control bg-danger/5 p-3 text-sm text-ink-muted">{vi.admin.suspendedNotice}</p></header>
    {actionError && <p role="alert" className="rounded-control bg-danger/5 p-3 text-sm text-danger">{actionError instanceof Error ? actionError.message : vi.admin.userActionFailed}</p>}
    {users.isPending ? <div role="status" className="h-64 animate-pulse rounded-card bg-surface-high" />
      : users.isError ? <section role="alert" className="rounded-card border border-line bg-surface p-6"><p>{vi.admin.userActionFailed}</p><button type="button" onClick={() => void users.refetch()} className="mt-3 rounded-control bg-primary px-4 py-2 font-semibold text-white">{vi.admin.retry}</button></section>
        : users.data.items.length === 0 ? <section className="rounded-card border border-line bg-surface p-8 text-center text-ink-muted">{vi.admin.noUsers}</section>
          : <div className="overflow-x-auto rounded-card border border-line bg-surface"><table className="w-full min-w-[880px] text-left text-sm"><thead className="bg-surface-high text-xs uppercase tracking-wide text-ink-muted"><tr><th className="px-4 py-3">{vi.admin.user}</th><th className="px-4 py-3">{vi.admin.role}</th><th className="px-4 py-3">{vi.admin.joinedAt}</th><th className="px-4 py-3">{vi.admin.lastSignIn}</th><th className="px-4 py-3">{vi.admin.active}</th><th className="px-4 py-3">Thao tác</th></tr></thead><tbody className="divide-y divide-line">{users.data.items.map(user => {
            const role = roleDrafts[user.id] ?? user.role
            const isSelf = user.id === actorId
            return <tr key={user.id}>
              <td className="px-4 py-4"><p className="font-semibold">{user.displayName || '—'}</p><p className="mt-1 text-xs text-ink-muted">{user.email || '—'}</p></td>
              <td className="px-4 py-4"><div className="flex items-center gap-2"><select aria-label={`${vi.admin.role}: ${user.email ?? user.id}`} value={role} disabled={isSelf || roleMutation.isPending} onChange={event => setRoleDrafts(current => ({ ...current, [user.id]: event.target.value as 'user' | 'admin' }))} className="min-h-10 rounded-control border border-line bg-bg px-2"><option value="user">{vi.admin.roleUser}</option><option value="admin">{vi.admin.roleAdmin}</option></select>{role !== user.role && <button type="button" onClick={() => roleMutation.mutate({ id: user.id, role })} className="min-h-10 rounded-control bg-primary px-3 text-xs font-semibold text-white">{vi.admin.saveRole}</button>}</div></td>
              <td className="px-4 py-4">{formatDate(user.createdAt)}</td><td className="px-4 py-4">{user.lastSignInAt ? formatDate(user.lastSignInAt) : '—'}</td>
              <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.suspended ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>{user.suspended ? vi.admin.suspended : vi.admin.active}</span></td>
              <td className="px-4 py-4"><div className="flex gap-2"><button type="button" disabled={isSelf || suspensionMutation.isPending} onClick={() => {
                if (user.suspended || window.confirm(vi.admin.suspendedNotice)) suspensionMutation.mutate({ id: user.id, suspended: !user.suspended })
              }} className="min-h-10 rounded-control border border-line px-3 text-xs font-semibold disabled:opacity-40">{user.suspended ? vi.admin.unsuspend : vi.admin.suspend}</button><button type="button" title={user.role === 'admin' ? vi.admin.adminCannotDeleteRole : undefined} disabled={isSelf || user.role === 'admin' || deleteMutation.isPending} onClick={() => { setDeleting(user); setDeleteConfirmation('') }} className="min-h-10 rounded-control border border-danger/30 px-3 text-xs font-semibold text-danger disabled:opacity-40">{vi.admin.deleteUser}</button></div></td>
            </tr>
          })}</tbody></table></div>}
    {users.data && <nav aria-label="Phân trang người dùng" className="flex items-center justify-between"><button type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)} className="min-h-11 rounded-control border border-line px-4 disabled:opacity-40">{vi.admin.previousPage}</button><span className="text-sm text-ink-muted">{vi.admin.page(page)}</span><button type="button" disabled={!users.data.hasNext} onClick={() => setPage(value => value + 1)} className="min-h-11 rounded-control border border-line px-4 disabled:opacity-40">{vi.admin.nextPage}</button></nav>}
    {deleting && <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="delete-admin-user-title" className="w-full max-w-lg rounded-card border border-line bg-surface p-6 shadow-card"><h2 id="delete-admin-user-title" className="font-serif text-xl font-bold">{vi.admin.deleteUser}: {deleting.email || deleting.displayName || deleting.id}</h2><p className="mt-3 text-sm text-danger">{vi.admin.deleteUserNotice}</p><p className="mt-3 text-sm text-ink-muted">{vi.admin.deleteUserPrompt}</p><label htmlFor="confirm-delete-user" className="mt-4 block text-sm font-medium">{vi.admin.deleteUserConfirm}</label><input id="confirm-delete-user" value={deleteConfirmation} onChange={event => setDeleteConfirmation(event.target.value)} className="mt-2 min-h-11 w-full rounded-control border border-line bg-bg px-3" autoComplete="off"/><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setDeleting(null)} className="min-h-11 rounded-control border border-line px-4">{vi.admin.cancel}</button><button type="button" disabled={deleteConfirmation !== 'DELETE' || deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleting.id)} className="min-h-11 rounded-control bg-danger px-4 font-semibold text-white disabled:opacity-40">{deleteMutation.isPending ? vi.system.loading : vi.admin.confirmDeleteUser}</button></div></section></div>}
  </div>
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value))
}
