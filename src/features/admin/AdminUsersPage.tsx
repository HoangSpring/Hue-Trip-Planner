import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/useSession'
import { vi } from '@/lib/strings/vi'
import {
  deleteAdminUser,
  listAdminUsers,
  setAdminUserSuspension,
  updateAdminUserRole,
} from './adminApi'
import type { AdminUser } from '@shared/schemas/adminUser'

export default function AdminUsersPage() {
  const auth = useSession()
  const token = auth.session?.access_token ?? ''
  const actorId = auth.user?.id
  const client = useQueryClient()

  const [page, setPage] = useState(1)
  const [roleDrafts, setRoleDrafts] = useState<
    Record<string, 'user' | 'admin'>
  >({})
  const [deleting, setDeleting] = useState<AdminUser | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const users = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => listAdminUsers(token, page),
    enabled: Boolean(token),
    retry: false,
  })

  const invalidate = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['admin-users'] }),
      client.invalidateQueries({ queryKey: ['admin-dashboard'] }),
    ])
  }

  const roleMutation = useMutation({
    mutationFn: ({
      id,
      role,
    }: {
      id: string
      role: 'user' | 'admin'
    }) => updateAdminUserRole(id, role, token),
    onSuccess: async user => {
      setRoleDrafts(current => {
        const next = { ...current }
        delete next[user.id]
        return next
      })
      await invalidate()
    },
  })

  const suspensionMutation = useMutation({
    mutationFn: ({
      id,
      suspended,
    }: {
      id: string
      suspended: boolean
    }) => setAdminUserSuspension(id, suspended, token),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminUser(id, token),
    onSuccess: async () => {
      setDeleting(null)
      setDeleteConfirmation('')

      if (users.data?.items.length === 1 && page > 1) {
        setPage(value => value - 1)
      }

      await invalidate()
    },
  })

  const actionError =
    roleMutation.error ||
    suspensionMutation.error ||
    deleteMutation.error

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-line bg-surface p-6">
        <p className="text-sm font-semibold text-secondary">
          {vi.layout.admin}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-ink">
          {vi.admin.users}
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {vi.admin.usersIntro}
        </p>
        <p className="mt-4 rounded-xl bg-danger/5 p-3 text-sm leading-6 text-ink-muted">
          {vi.admin.suspendedNotice}
        </p>
      </header>

      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger"
        >
          {actionError instanceof Error
            ? actionError.message
            : vi.admin.userActionFailed}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex flex-col justify-between gap-3 border-b border-line p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-ink">
              Danh sách người dùng
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Quản lý vai trò và trạng thái tài khoản.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void users.refetch()}
            disabled={users.isFetching}
            className="min-h-10 rounded-lg border border-line px-4 text-sm font-medium transition hover:bg-surface-high disabled:opacity-50"
          >
            {users.isFetching ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>

        {users.isPending ? (
          <div
            role="status"
            className="space-y-3 p-5"
          >
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-lg bg-surface-high"
              />
            ))}
          </div>
        ) : users.isError ? (
          <div role="alert" className="p-8 text-center">
            <p className="text-sm text-ink-muted">
              {vi.admin.userActionFailed}
            </p>
            <button
              type="button"
              onClick={() => void users.refetch()}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              {vi.admin.retry}
            </button>
          </div>
        ) : users.data.items.length === 0 ? (
          <div className="p-10 text-center text-sm text-ink-muted">
            {vi.admin.noUsers}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-surface-high text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-5 py-4">{vi.admin.user}</th>
                  <th className="px-5 py-4">{vi.admin.role}</th>
                  <th className="px-5 py-4">{vi.admin.joinedAt}</th>
                  <th className="px-5 py-4">{vi.admin.lastSignIn}</th>
                  <th className="px-5 py-4">{vi.admin.active}</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-line">
                {users.data.items.map(user => {
                  const role = roleDrafts[user.id] ?? user.role
                  const isSelf = user.id === actorId

                  return (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-surface-high/40"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-ink">
                          {user.displayName || '—'}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">
                          {user.email || '—'}
                        </p>
                        {isSelf && (
                          <span className="mt-1 inline-block text-xs text-primary">
                            Tài khoản của bạn
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            aria-label={`${vi.admin.role}: ${user.email ?? user.id} `}
                            value={role}
                            disabled={isSelf || roleMutation.isPending}
                            onChange={event =>
                              setRoleDrafts(current => ({
                                ...current,
                                [user.id]: event.target.value as
                                  | 'user'
                                  | 'admin',
                              }))
                            }
                            className="min-h-10 rounded-lg border border-line bg-bg px-2 text-sm outline-none focus:border-primary disabled:opacity-50"
                          >
                            <option value="user">
                              {vi.admin.roleUser}
                            </option>
                            <option value="admin">
                              {vi.admin.roleAdmin}
                            </option>
                          </select>

                          {role !== user.role && (
                            <button
                              type="button"
                              disabled={roleMutation.isPending}
                              onClick={() =>
                                roleMutation.mutate({
                                  id: user.id,
                                  role,
                                })
                              }
                              className="min-h-10 rounded-lg bg-primary px-3 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                            >
                              {vi.admin.saveRole}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-ink">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-ink-muted">
                        {user.lastSignInAt
                          ? formatDate(user.lastSignInAt)
                          : '—'}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline - flex items - center rounded - full px - 3 py - 1 text - xs font - semibold ${user.suspended
                            ? 'bg-danger/10 text-danger'
                            : 'bg-success/10 text-success'
                            } `}
                        >
                          {user.suspended
                            ? vi.admin.suspended
                            : vi.admin.active}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={
                              isSelf || suspensionMutation.isPending
                            }
                            onClick={() => {
                              if (
                                user.suspended ||
                                window.confirm(vi.admin.suspendedNotice)
                              ) {
                                suspensionMutation.mutate({
                                  id: user.id,
                                  suspended: !user.suspended,
                                })
                              }
                            }}
                            className="min-h-10 rounded-lg border border-line px-3 text-xs font-semibold transition hover:bg-surface-high disabled:opacity-40"
                          >
                            {user.suspended
                              ? vi.admin.unsuspend
                              : vi.admin.suspend}
                          </button>

                          <button
                            type="button"
                            title={
                              user.role === 'admin'
                                ? vi.admin.adminCannotDeleteRole
                                : undefined
                            }
                            disabled={
                              isSelf ||
                              user.role === 'admin' ||
                              deleteMutation.isPending
                            }
                            onClick={() => {
                              setDeleting(user)
                              setDeleteConfirmation('')
                            }}
                            className="min-h-10 rounded-lg border border-danger/20 px-3 text-xs font-semibold text-danger transition hover:bg-danger/5 disabled:opacity-40"
                          >
                            {vi.admin.deleteUser}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {users.data && (
        <nav
          aria-label="Phân trang người dùng"
          className="flex items-center justify-between gap-3"
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(value => value - 1)}
            className="min-h-10 rounded-lg border border-line bg-surface px-4 text-sm font-medium hover:bg-surface-high disabled:opacity-40"
          >
            {vi.admin.previousPage}
          </button>

          <span className="text-sm text-ink-muted">
            {vi.admin.page(page)}
          </span>

          <button
            type="button"
            disabled={!users.data.hasNext}
            onClick={() => setPage(value => value + 1)}
            className="min-h-10 rounded-lg border border-line bg-surface px-4 text-sm font-medium hover:bg-surface-high disabled:opacity-40"
          >
            {vi.admin.nextPage}
          </button>
        </nav>
      )}

      {deleting && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-admin-user-title"
            className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl"
          >
            <h2
              id="delete-admin-user-title"
              className="text-xl font-bold text-ink"
            >
              {vi.admin.deleteUser}
            </h2>

            <p className="mt-2 break-words text-sm font-medium text-ink">
              {deleting.email || deleting.displayName || deleting.id}
            </p>

            <p className="mt-3 text-sm leading-6 text-danger">
              {vi.admin.deleteUserNotice}
            </p>

            <p className="mt-3 text-sm text-ink-muted">
              {vi.admin.deleteUserPrompt}
            </p>

            <label
              htmlFor="confirm-delete-user"
              className="mt-4 block text-sm font-medium text-ink"
            >
              {vi.admin.deleteUserConfirm}
            </label>

            <input
              id="confirm-delete-user"
              value={deleteConfirmation}
              onChange={event =>
                setDeleteConfirmation(event.target.value)
              }
              autoComplete="off"
              className="mt-2 min-h-11 w-full rounded-lg border border-line bg-bg px-3 text-sm outline-none focus:border-primary"
            />

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  setDeleting(null)
                  setDeleteConfirmation('')
                }}
                className="min-h-10 rounded-lg border border-line px-4 text-sm font-medium hover:bg-surface-high disabled:opacity-50"
              >
                {vi.admin.cancel}
              </button>

              <button
                type="button"
                disabled={
                  deleteConfirmation !== 'DELETE' ||
                  deleteMutation.isPending
                }
                onClick={() => deleteMutation.mutate(deleting.id)}
                className="min-h-10 rounded-lg bg-danger px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                {deleteMutation.isPending
                  ? vi.system.loading
                  : vi.admin.confirmDeleteUser}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
  }).format(date)
}
