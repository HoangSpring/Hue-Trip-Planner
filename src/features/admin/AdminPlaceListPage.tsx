
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paths } from '@/app/paths'
import { useSession } from '@/features/auth/hooks/useSession'
import { vi } from '@/lib/strings/vi'
import {
  bulkAdminPlaces,
  listAdminPlaces,
  type AdminPlace,
} from './adminApi'

const categories = [
  'heritage',
  'food',
  'cafe',
  'sightseeing',
  'shopping',
] as const

const missingKeys = [
  'hours',
  'duration',
  'image',
  'coords',
  'meal_type',
  'best_time',
] as const

const labels: Record<string, string> = {
  heritage: 'Di sản & Cung đình',
  food: 'Ẩm thực Huế',
  cafe: 'Cà phê & Thư giãn',
  sightseeing: 'Tham quan',
  shopping: 'Quà & Mua sắm',
  draft: vi.admin.statusDraft,
  published: vi.admin.statusPublished,
  archived: vi.admin.statusArchived,
}

const actions = [
  { id: 'publish', label: 'Xuất bản', icon: '↗' },
  { id: 'unpublish', label: 'Gỡ xuất bản', icon: '⊘' },
  { id: 'verify', label: 'Duyệt thông tin', icon: '✓' },
  { id: 'archive', label: 'Lưu trữ', icon: '▤' },
  { id: 'unverify', label: 'Bỏ duyệt', icon: '↶' },
] as const

export default function AdminPlaceListPage() {
  const session = useSession()
  const token = session.session?.access_token ?? ''

  const [params, setParams] = useSearchParams()
  const [selected, setSelected] = useState<string[]>([])
  const [searchInput, setSearchInput] = useState(
    params.get('q') ?? '',
  )

  const query = useMemo(
    () => new URLSearchParams(params),
    [params],
  )

  const places = useQuery({
    queryKey: ['admin-places', query.toString()],
    queryFn: () => listAdminPlaces(token, query),
    enabled: Boolean(token),
  })

  const client = useQueryClient()

  const bulk = useMutation({
    mutationFn: (action: typeof actions[number]['id']) =>
      bulkAdminPlaces(selected, action, token),
    onSuccess: () => {
      setSelected([])
      void client.invalidateQueries({
        queryKey: ['admin-places'],
      })
    },
  })

  const rows = places.data?.items ?? []
  const total = places.data?.total ?? 0
  const page = Number(query.get('page') ?? 1)
  const pageSize = places.data?.pageSize ?? 25
  const pages = Math.max(1, Math.ceil(total / pageSize))

  // These counts describe the currently loaded page, not the entire database.
  const publishedCount = rows.filter(
    (place) => place.status === 'published',
  ).length

  const draftCount = rows.filter(
    (place) => place.status === 'draft',
  ).length

  const incompleteCount = rows.filter(
    (place) => place.missingFields.length > 0,
  ).length

  const allSelected =
    rows.length > 0 &&
    rows.every((place) => selected.includes(place.id))

  const setFilter = (key: string, value: string) => {
    setParams((current) => {
      const next = new URLSearchParams(current)

      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }

      next.delete('page')
      return next
    })
  }

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFilter('q', searchInput.trim())
  }

  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    )
  }

  const togglePage = (checked: boolean) => {
    setSelected((current) => {
      if (checked) {
        return [...new Set([...current, ...rows.map((row) => row.id)])]
      }

      return current.filter(
        (id) => !rows.some((row) => row.id === id),
      )
    })
  }

  const clearFilters = () => {
    setSearchInput('')
    setParams({})
  }

  const hasFilters = [
    'q',
    'status',
    'verified',
    'category',
    'missing',
  ].some((key) => Boolean(params.get(key)))

  return (
    <section
      className="min-w-0 space-y-6 pb-8 text-[#3A0F34]"
      aria-labelledby="admin-places-title"
    >
      {/* PAGE HEADING */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6B6269]">
            <span className="size-2 rounded-full bg-[#EAAA00]" />
            Cơ sở dữ liệu trung tâm · Di sản cố đô
          </p>

          <h1
            id="admin-places-title"
            className="font-serif text-3xl font-semibold tracking-tight text-[#3A0F34] sm:text-[34px]"
          >
            Quản lý địa điểm
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6269]">
            Quản trị cơ sở dữ liệu di sản, ẩm thực và danh thắng
            Cố đô Huế. Tổng số{' '}
            <strong className="font-semibold text-[#3A0F34]">
              {total} địa điểm
            </strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={paths.adminPlaceNew}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#3A0F34] px-5 text-sm font-semibold text-white shadow-[0_3px_8px_rgba(58,15,52,0.15)] transition-all hover:-translate-y-0.5 hover:bg-[#511747] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A0F34] focus-visible:ring-offset-2"
          >
            <span aria-hidden="true" className="text-lg">＋</span>
            {vi.admin.add}
          </Link>
        </div>
      </div>

      {/* STATISTICS */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng địa điểm"
          value={total}
          note="Toàn bộ dữ liệu"
          icon="⌂"
          tone="purple"
        />

        <StatCard
          label="Đã xuất bản"
          value={publishedCount}
          note="Trên trang hiện tại"
          icon="✓"
          tone="green"
        />

        <StatCard
          label="Bản nháp"
          value={draftCount}
          note="Trên trang hiện tại"
          icon="≡"
          tone="amber"
        />

        <StatCard
          label="Cần hoàn thiện"
          value={incompleteCount}
          note="Trên trang hiện tại"
          icon="!"
          tone="red"
        />
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-[#D1CECB] bg-white p-4 shadow-[0_4px_18px_rgba(58,15,52,0.035)] sm:p-5">
        <form
          onSubmit={submitSearch}
          className="flex flex-col gap-3 xl:flex-row xl:items-end"
        >
          <label className="min-w-0 flex-1">
            <span className="mb-1.5 block text-xs font-semibold text-[#6B6269]">
              Tìm kiếm địa điểm
            </span>
            <div className="flex h-11 items-center gap-2 rounded-xl border border-[#D1CECB] bg-[#F7F6F5] px-3 transition-colors focus-within:border-[#76566F] focus-within:ring-2 focus-within:ring-[#3A0F34]/10">
              <span aria-hidden="true" className="text-lg text-[#6B6269]">
                ⌕
              </span>
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8A8288]"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tên địa điểm, slug..."
                aria-label={vi.admin.search}
              />
              <button
                type="submit"
                className="rounded-lg bg-[#3A0F34] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#511747]"
              >
                Tìm
              </button>
            </div>
          </label>

          <FilterSelect
            label="Trạng thái"
            value={query.get('status') ?? ''}
            onChange={(value) => setFilter('status', value)}
            options={[
              ['draft', labels.draft],
              ['published', labels.published],
              ['archived', labels.archived],
            ]}
          />

          <FilterSelect
            label="Phân loại"
            value={query.get('category') ?? ''}
            onChange={(value) => setFilter('category', value)}
            options={categories.map(
              (value) => [value, labels[value]] as const,
            )}
          />

          <FilterSelect
            label="Kiểm duyệt"
            value={query.get('verified') ?? ''}
            onChange={(value) => setFilter('verified', value)}
            options={[
              ['true', 'Đã duyệt'],
              ['false', 'Chưa duyệt'],
            ]}
          />

          <FilterSelect
            label="Dữ liệu thiếu"
            value={query.get('missing') ?? ''}
            onChange={(value) => setFilter('missing', value)}
            options={missingKeys.map(
              (value) =>
                [
                  value,
                  String(vi.admin[value]),
                ] as const,
            )}
          />
        </form>

        {hasFilters && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#D1CECB] pt-3">
            <p className="text-xs text-[#6B6269]">
              Đang áp dụng bộ lọc
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[#3A0F34] transition-colors hover:bg-[#F0E7EE]"
            >
              <span aria-hidden="true">×</span>
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* BULK ACTIONS */}
      {selected.length > 0 && (
        <div className="rounded-2xl border border-[#3A0F34] bg-[#3A0F34] p-4 text-white shadow-[0_8px_20px_rgba(58,15,52,0.15)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg">
                ✓
              </span>

              <div>
                <p className="text-sm font-semibold">
                  Đã chọn {selected.length} địa điểm
                </p>
                <p className="mt-0.5 text-xs text-white/65">
                  Áp dụng thay đổi hàng loạt cho các mục đã chọn.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  disabled={bulk.isPending}
                  onClick={() => bulk.mutate(action.id)}
                  className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${action.id === 'publish'
                      ? 'bg-[#EAAA00] text-[#3A0F34] hover:bg-[#D69A00]'
                      : action.id === 'unpublish'
                        ? 'bg-[#FFF3CC] text-[#6B6269] hover:bg-[#F5D978]'
                        : action.id === 'archive'
                          ? 'bg-[#F0E7EE] text-[#3A0F34] hover:bg-[#E5D5E1]'
                          : action.id === 'verify'
                            ? 'bg-white/15 text-white hover:bg-white/25'
                            : 'bg-[#B3261E] text-white hover:bg-[#8E1B17]'
                    }`}
                >
                  <span aria-hidden="true">{action.icon}</span>
                  {action.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setSelected([])}
                aria-label="Bỏ chọn tất cả"
                className="flex size-10 items-center justify-center rounded-xl text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>

          {bulk.isError && (
            <p role="alert" className="mt-3 text-sm text-red-200">
              Không thể thực hiện thao tác hàng loạt. Vui lòng thử lại.
            </p>
          )}

          {bulk.data && (
            <div
              className="mt-4 space-y-1 border-t border-white/15 pt-3 text-xs text-white/85"
              role="status"
            >
              {bulk.data.results.map((result) => (
                <p key={result.id}>
                  {rows.find((row) => row.id === result.id)?.name ??
                    result.id}
                  :{' '}
                  {result.success
                    ? 'Thành công'
                    : result.reason ?? 'Không thực hiện được'}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-[#D1CECB] bg-white shadow-[0_5px_22px_rgba(58,15,52,0.04)]">
        <div className="flex flex-col gap-2 border-b border-[#D1CECB] bg-[#F7F6F5] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-[#3A0F34]">
              Danh sách địa điểm
            </h2>
            <p className="mt-1 text-xs text-[#6B6269]">
              Quản lý thông tin, trạng thái xuất bản và chất lượng dữ liệu.
            </p>
          </div>

          {places.data && (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D1CECB] bg-white px-3 py-1.5 text-xs text-[#6B6269]">
              <span className="size-1.5 rounded-full bg-[#EAAA00]" />
              {total} địa điểm
            </span>
          )}
        </div>

        {places.isPending && (
          <div
            role="status"
            className="p-12 text-center text-sm text-[#6B6269]"
          >
            <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-[#D1CECB] border-t-[#3A0F34]" />
            {vi.admin.loading}
          </div>
        )}

        {places.isError && (
          <div className="p-10 text-center" role="alert">
            <p className="text-sm text-[#B3261E]">
              {places.error.message}
            </p>
            <button
              type="button"
              className="mt-4 min-h-10 rounded-xl bg-[#3A0F34] px-4 text-sm font-semibold text-white hover:bg-[#511747]"
              onClick={() => void places.refetch()}
            >
              {vi.admin.retry}
            </button>
          </div>
        )}

        {places.isSuccess && rows.length === 0 && (
          <div className="px-5 py-16 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#F0E7EE] text-2xl text-[#3A0F34]">
              ⌕
            </span>
            <p className="mt-4 font-semibold text-[#3A0F34]">
              {vi.admin.empty}
            </p>
            <p className="mt-1 text-sm text-[#6B6269]">
              Thử thay đổi từ khóa hoặc bộ lọc.
            </p>
          </div>
        )}

        {places.isSuccess && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#E5E4E2] text-[11px] font-semibold uppercase tracking-wide text-[#6B6269]">
                  <th className="w-12 px-4 py-4">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả địa điểm trên trang"
                      checked={allSelected}
                      onChange={(event) =>
                        togglePage(event.target.checked)
                      }
                      className="size-4 cursor-pointer accent-[#3A0F34]"
                    />
                  </th>
                  <th className="px-3 py-4">Ảnh</th>
                  <th className="px-3 py-4">Tên địa điểm</th>
                  <th className="px-3 py-4">Phân loại</th>
                  <th className="px-3 py-4">Trạng thái</th>
                  <th className="px-3 py-4">Kiểm duyệt</th>
                  <th className="px-3 py-4">Chất lượng dữ liệu</th>
                  <th className="px-3 py-4 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#D1CECB]">
                {rows.map((place) => (
                  <PlaceRow
                    key={place.id}
                    place={place}
                    selected={selected.includes(place.id)}
                    onToggle={() => toggle(place.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {places.data && rows.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-[#D1CECB] bg-[#F7F6F5] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-[#6B6269]">
              Hiển thị{' '}
              <strong className="text-[#3A0F34]">
                {(page - 1) * pageSize + 1}–
                {(page - 1) * pageSize + rows.length}
              </strong>{' '}
              trong tổng số{' '}
              <strong className="text-[#3A0F34]">{total}</strong>{' '}
              địa điểm
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="min-h-9 rounded-lg border border-[#D1CECB] bg-white px-3 text-xs font-medium text-[#6B6269] transition-colors hover:border-[#A99AA5] hover:text-[#3A0F34] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setFilter('page', String(page - 1))}
              >
                ← Trước
              </button>

              <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#3A0F34] px-3 text-xs font-semibold text-white">
                {page}
              </span>

              <span className="px-1 text-xs text-[#6B6269]">
                / {pages}
              </span>

              <button
                type="button"
                className="min-h-9 rounded-lg border border-[#D1CECB] bg-white px-3 text-xs font-medium text-[#6B6269] transition-colors hover:border-[#A99AA5] hover:text-[#3A0F34] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={page >= pages}
                onClick={() => setFilter('page', String(page + 1))}
              >
                Tiếp →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function StatCard({
  label,
  value,
  note,
  icon,
  tone,
}: {
  label: string
  value: number
  note: string
  icon: string
  tone: 'purple' | 'green' | 'amber' | 'red'
}) {
  const styles = {
    purple: {
      icon: 'bg-[#F0E7EE] text-[#3A0F34]',
      number: 'text-[#3A0F34]',
      border: 'bg-[#E5D5E1]',
      note: 'bg-[#F0E7EE] text-[#3A0F34]',
    },
    green: {
      icon: 'bg-[#FFF3CC] text-[#3A0F34]',
      number: 'text-[#3A0F34]',
      border: 'bg-[#EAAA00]',
      note: 'bg-[#FFF3CC] text-[#3A0F34]',
    },
    amber: {
      icon: 'bg-[#FFF3CC] text-[#8A6500]',
      number: 'text-[#8A6500]',
      border: 'bg-[#EAAA00]',
      note: 'bg-[#FFF3CC] text-[#8A6500]',
    },
    red: {
      icon: 'bg-[#F8E8E6] text-[#B3261E]',
      number: 'text-[#B3261E]',
      border: 'bg-[#E5B6B1]',
      note: 'bg-[#F8E8E6] text-[#B3261E]',
    },
  }[tone]

  return (
    <article className="relative overflow-hidden rounded-2xl border border-[#D1CECB] bg-white p-5 pb-6 shadow-[0_3px_14px_rgba(58,15,52,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(58,15,52,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-[#6B6269]">{label}</p>
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-lg ${styles.icon}`}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
        <p className={`font-serif text-3xl font-semibold ${styles.number}`}>
          {value.toLocaleString('vi-VN')}
        </p>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${styles.note}`}>
          {note}
        </span>
      </div>

      <div className={`absolute inset-x-0 bottom-0 h-1 ${styles.border}`} />
    </article>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly (readonly [string, string])[]
}) {
  return (
    <label className="block min-w-0 xl:w-[155px]">
      <span className="mb-1.5 block text-xs font-semibold text-[#6B6269]">
        {label}
      </span>
      <select
        className="h-11 w-full cursor-pointer rounded-xl border border-[#D1CECB] bg-[#F7F6F5] px-3 text-sm text-[#3A0F34] outline-none transition-colors hover:border-[#A99AA5] focus:border-[#76566F] focus:ring-2 focus:ring-[#3A0F34]/10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{vi.admin.all}</option>
        {options.map(([key, title]) => (
          <option value={key} key={key}>
            {title}
          </option>
        ))}
      </select>
    </label>
  )
}

function PlaceRow({
  place,
  selected,
  onToggle,
}: {
  place: AdminPlace
  selected: boolean
  onToggle: () => void
}) {
  const statusStyle =
    place.status === 'published'
      ? 'bg-[#EAAA00] text-[#3A0F34]'
      : place.status === 'draft'
        ? 'bg-[#FFF3CC] text-[#6B6269]'
        : 'bg-[#F0E7EE] text-[#6B6269]'

  return (
    <tr
      className={`align-middle transition-colors hover:bg-[#F0E7EE] ${selected ? 'bg-[#F0E7EE]' : 'bg-white'
        }`}
    >
      <td className="px-4 py-3.5">
        <input
          type="checkbox"
          aria-label={`Chọn ${place.name}`}
          checked={selected}
          onChange={onToggle}
          className="size-4 cursor-pointer accent-[#3A0F34]"
        />
      </td>

      <td className="px-3 py-3.5">
        {place.coverImageUrl ? (
          <div className="w-[62px]">
            <img
              className="h-12 w-[62px] rounded-lg object-cover"
              src={place.coverImageUrl}
              alt={place.coverImageAlt ?? place.name}
              loading="lazy"
            />
            {(place.imageCredit || place.imageLicense) && (
              <p
                className="mt-1 max-w-[90px] truncate text-[9px] text-[#6B6269]"
                title={`${place.imageCredit ?? ''} ${place.imageLicense ?? ''}`}
              >
                {place.imageCredit}
              </p>
            )}
          </div>
        ) : (
          <div className="flex h-12 w-[62px] items-center justify-center rounded-lg border border-dashed border-[#D1CECB] bg-[#E5E4E2] px-1 text-center text-[9px] text-[#6B6269]">
            Chưa có ảnh
          </div>
        )}
      </td>

      <td className="max-w-[270px] px-3 py-3.5">
        <Link
          className="font-semibold leading-5 text-[#3A0F34] transition-colors hover:text-[#3A0F34] hover:underline"
          to={paths.adminPlace(place.id)}
        >
          {place.name}
        </Link>
        <p className="mt-1 break-all text-[11px] leading-4 text-[#6B6269]">
          /{place.slug}
        </p>
      </td>

      <td className="px-3 py-3.5">
        <span className="inline-flex max-w-[150px] rounded-full bg-[#E5E4E2] px-2.5 py-1.5 text-[10px] font-medium leading-4 text-[#3A0F34]">
          {labels[place.category] ?? place.category}
        </span>
      </td>

      <td className="px-3 py-3.5">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold ${statusStyle}`}>
          <span className="size-1.5 rounded-full bg-current" />
          {labels[place.status] ?? place.status}
        </span>
      </td>

      <td className="px-3 py-3.5">
        {place.verified ? (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-[#3A0F34]">
            <span aria-hidden="true">✓</span>
            Đã duyệt
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-[#8A6500]">
            <span aria-hidden="true">◷</span>
            Chờ duyệt
          </span>
        )}
      </td>

      <td className="px-3 py-3.5">
        {place.missingFields.length > 0 ? (
          <div className="flex max-w-[170px] flex-wrap gap-1.5">
            {place.missingFields.slice(0, 2).map((field) => (
              <span
                key={field}
                className="inline-flex items-center gap-1 rounded-md bg-[#F8E8E6] px-2 py-1 text-[10px] leading-4 text-[#B3261E]"
              >
                <span aria-hidden="true">!</span>
                {String(vi.admin[field as keyof typeof vi.admin] ?? field)}
              </span>
            ))}
            {place.missingFields.length > 2 && (
              <span className="rounded-md bg-[#E5E4E2] px-2 py-1 text-[10px] text-[#6B6269]">
                +{place.missingFields.length - 2}
              </span>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF3CC] px-2 py-1 text-[10px] font-medium text-[#3A0F34]">
            <span aria-hidden="true">✓</span>
            Đủ dữ liệu
          </span>
        )}
      </td>

      <td className="px-3 py-3.5 text-right">
        <Link
          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#D1CECB] bg-white px-3 text-xs font-semibold text-[#3A0F34] transition-colors hover:border-[#3A0F34] hover:bg-[#F0E7EE]"
          to={paths.adminPlace(place.id)}
        >
          Chỉnh sửa
        </Link>
      </td>
    </tr>
  )
}
