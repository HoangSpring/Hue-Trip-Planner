
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
      className="min-w-0 space-y-6 pb-8 text-[#30213F]"
      aria-labelledby="admin-places-title"
    >
      {/* PAGE HEADING */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#756B65]">
            <span className="size-2 rounded-full bg-[#23866D]" />
            Cơ sở dữ liệu trung tâm · Di sản cố đô
          </p>

          <h1
            id="admin-places-title"
            className="font-serif text-3xl font-semibold tracking-tight text-[#46246D] sm:text-[34px]"
          >
            Quản lý địa điểm
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#756B65]">
            Quản trị cơ sở dữ liệu di sản, ẩm thực và danh thắng
            Cố đô Huế. Tổng số{' '}
            <strong className="font-semibold text-[#30213F]">
              {total} địa điểm
            </strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={paths.adminPlaceNew}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#57347D] px-5 text-sm font-semibold text-white shadow-[0_3px_8px_rgba(87,52,125,0.15)] transition-all hover:-translate-y-0.5 hover:bg-[#462765] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#57347D] focus-visible:ring-offset-2"
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
      <div className="rounded-2xl border border-[#F0E9DE] bg-white p-4 shadow-[0_4px_18px_rgba(48,33,63,0.035)] sm:p-5">
        <form
          onSubmit={submitSearch}
          className="flex flex-col gap-3 xl:flex-row xl:items-end"
        >
          <label className="min-w-0 flex-1">
            <span className="mb-1.5 block text-xs font-semibold text-[#756B65]">
              Tìm kiếm địa điểm
            </span>
            <div className="flex h-11 items-center gap-2 rounded-xl border border-[#E9E1D6] bg-[#FCFAF6] px-3 transition-colors focus-within:border-[#8C6BB0] focus-within:ring-2 focus-within:ring-[#57347D]/10">
              <span aria-hidden="true" className="text-lg text-[#756B65]">
                ⌕
              </span>
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#A59B91]"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tên địa điểm, slug..."
                aria-label={vi.admin.search}
              />
              <button
                type="submit"
                className="rounded-lg bg-[#57347D] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#462765]"
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
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0E9DE] pt-3">
            <p className="text-xs text-[#756B65]">
              Đang áp dụng bộ lọc
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[#57347D] transition-colors hover:bg-[#F3EDF8]"
            >
              <span aria-hidden="true">×</span>
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* BULK ACTIONS */}
      {selected.length > 0 && (
        <div className="rounded-2xl border border-[#46246D] bg-[#46246D] p-4 text-white shadow-[0_8px_20px_rgba(70,36,109,0.15)]">
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
                      ? 'bg-[#A8EBD7] text-[#165D4D] hover:bg-[#8DDFC7]'
                      : action.id === 'unpublish'
                        ? 'bg-[#FFE0A8] text-[#704511] hover:bg-[#FFD48A]'
                        : action.id === 'archive'
                          ? 'bg-[#D6C6E9] text-[#46246D] hover:bg-[#C6B0E0]'
                          : action.id === 'verify'
                            ? 'bg-white/15 text-white hover:bg-white/25'
                            : 'bg-[#B91C1C] text-white hover:bg-[#991B1B]'
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
      <div className="overflow-hidden rounded-2xl border border-[#EFE7DC] bg-white shadow-[0_5px_22px_rgba(48,33,63,0.04)]">
        <div className="flex flex-col gap-2 border-b border-[#F0E9DE] bg-[#FCFAF6] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-[#30213F]">
              Danh sách địa điểm
            </h2>
            <p className="mt-1 text-xs text-[#8A8077]">
              Quản lý thông tin, trạng thái xuất bản và chất lượng dữ liệu.
            </p>
          </div>

          {places.data && (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E8E0D5] bg-white px-3 py-1.5 text-xs text-[#756B65]">
              <span className="size-1.5 rounded-full bg-[#23866D]" />
              {total} địa điểm
            </span>
          )}
        </div>

        {places.isPending && (
          <div
            role="status"
            className="p-12 text-center text-sm text-[#756B65]"
          >
            <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-[#E6DDED] border-t-[#57347D]" />
            {vi.admin.loading}
          </div>
        )}

        {places.isError && (
          <div className="p-10 text-center" role="alert">
            <p className="text-sm text-[#A61B1B]">
              {places.error.message}
            </p>
            <button
              type="button"
              className="mt-4 min-h-10 rounded-xl bg-[#57347D] px-4 text-sm font-semibold text-white hover:bg-[#462765]"
              onClick={() => void places.refetch()}
            >
              {vi.admin.retry}
            </button>
          </div>
        )}

        {places.isSuccess && rows.length === 0 && (
          <div className="px-5 py-16 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#F3EDF8] text-2xl text-[#57347D]">
              ⌕
            </span>
            <p className="mt-4 font-semibold text-[#30213F]">
              {vi.admin.empty}
            </p>
            <p className="mt-1 text-sm text-[#8A8077]">
              Thử thay đổi từ khóa hoặc bộ lọc.
            </p>
          </div>
        )}

        {places.isSuccess && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#F7F3EC] text-[11px] font-semibold uppercase tracking-wide text-[#756B65]">
                  <th className="w-12 px-4 py-4">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả địa điểm trên trang"
                      checked={allSelected}
                      onChange={(event) =>
                        togglePage(event.target.checked)
                      }
                      className="size-4 cursor-pointer accent-[#57347D]"
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

              <tbody className="divide-y divide-[#F0E9DE]">
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
          <div className="flex flex-col gap-4 border-t border-[#EFE7DC] bg-[#FCFAF6] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-[#756B65]">
              Hiển thị{' '}
              <strong className="text-[#30213F]">
                {(page - 1) * pageSize + 1}–
                {(page - 1) * pageSize + rows.length}
              </strong>{' '}
              trong tổng số{' '}
              <strong className="text-[#30213F]">{total}</strong>{' '}
              địa điểm
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="min-h-9 rounded-lg border border-[#E7DED2] bg-white px-3 text-xs font-medium text-[#756B65] transition-colors hover:border-[#C8B4DA] hover:text-[#57347D] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setFilter('page', String(page - 1))}
              >
                ← Trước
              </button>

              <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#57347D] px-3 text-xs font-semibold text-white">
                {page}
              </span>

              <span className="px-1 text-xs text-[#756B65]">
                / {pages}
              </span>

              <button
                type="button"
                className="min-h-9 rounded-lg border border-[#E7DED2] bg-white px-3 text-xs font-medium text-[#756B65] transition-colors hover:border-[#C8B4DA] hover:text-[#57347D] disabled:cursor-not-allowed disabled:opacity-40"
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
      icon: 'bg-[#F0E9F5] text-[#57347D]',
      number: 'text-[#30213F]',
      border: 'bg-[#D7C7E6]',
      note: 'bg-[#F2EDF6] text-[#57347D]',
    },
    green: {
      icon: 'bg-[#DDF7EE] text-[#18745D]',
      number: 'text-[#18745D]',
      border: 'bg-[#A9E7D5]',
      note: 'bg-[#DDF7EE] text-[#18745D]',
    },
    amber: {
      icon: 'bg-[#FFF0D9] text-[#89521C]',
      number: 'text-[#71421C]',
      border: 'bg-[#F5C46E]',
      note: 'bg-[#FFF0D9] text-[#89521C]',
    },
    red: {
      icon: 'bg-[#FDE8E7] text-[#B42318]',
      number: 'text-[#B42318]',
      border: 'bg-[#F2B5B0]',
      note: 'bg-[#FDE8E7] text-[#B42318]',
    },
  }[tone]

  return (
    <article className="relative overflow-hidden rounded-2xl border border-[#F0E9DE] bg-white p-5 pb-6 shadow-[0_3px_14px_rgba(48,33,63,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(48,33,63,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-[#756B65]">{label}</p>
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
      <span className="mb-1.5 block text-xs font-semibold text-[#756B65]">
        {label}
      </span>
      <select
        className="h-11 w-full cursor-pointer rounded-xl border border-[#E9E1D6] bg-[#FCFAF6] px-3 text-sm text-[#30213F] outline-none transition-colors hover:border-[#D3C3E1] focus:border-[#8C6BB0] focus:ring-2 focus:ring-[#57347D]/10"
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
      ? 'bg-[#A8EBD7] text-[#165D4D]'
      : place.status === 'draft'
        ? 'bg-[#FFE4B8] text-[#7C4A12]'
        : 'bg-[#EAE5EE] text-[#62566D]'

  return (
    <tr
      className={`align-middle transition-colors hover:bg-[#FAF7F0] ${selected ? 'bg-[#F8F3FC]' : 'bg-white'
        }`}
    >
      <td className="px-4 py-3.5">
        <input
          type="checkbox"
          aria-label={`Chọn ${place.name}`}
          checked={selected}
          onChange={onToggle}
          className="size-4 cursor-pointer accent-[#57347D]"
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
                className="mt-1 max-w-[90px] truncate text-[9px] text-[#8A8077]"
                title={`${place.imageCredit ?? ''} ${place.imageLicense ?? ''}`}
              >
                {place.imageCredit}
              </p>
            )}
          </div>
        ) : (
          <div className="flex h-12 w-[62px] items-center justify-center rounded-lg border border-dashed border-[#D8CFC2] bg-[#F7F3EC] px-1 text-center text-[9px] text-[#8A8077]">
            Chưa có ảnh
          </div>
        )}
      </td>

      <td className="max-w-[270px] px-3 py-3.5">
        <Link
          className="font-semibold leading-5 text-[#30213F] transition-colors hover:text-[#57347D] hover:underline"
          to={paths.adminPlace(place.id)}
        >
          {place.name}
        </Link>
        <p className="mt-1 break-all text-[11px] leading-4 text-[#8A8077]">
          /{place.slug}
        </p>
      </td>

      <td className="px-3 py-3.5">
        <span className="inline-flex max-w-[150px] rounded-full bg-[#F0ECE5] px-2.5 py-1.5 text-[10px] font-medium leading-4 text-[#57347D]">
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
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-[#18745D]">
            <span aria-hidden="true">✓</span>
            Đã duyệt
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-[#8A6740]">
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
                className="inline-flex items-center gap-1 rounded-md bg-[#FDE8E7] px-2 py-1 text-[10px] leading-4 text-[#A61B1B]"
              >
                <span aria-hidden="true">!</span>
                {String(vi.admin[field as keyof typeof vi.admin] ?? field)}
              </span>
            ))}
            {place.missingFields.length > 2 && (
              <span className="rounded-md bg-[#F0ECE5] px-2 py-1 text-[10px] text-[#756B65]">
                +{place.missingFields.length - 2}
              </span>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-[#DDF7EE] px-2 py-1 text-[10px] font-medium text-[#18745D]">
            <span aria-hidden="true">✓</span>
            Đủ dữ liệu
          </span>
        )}
      </td>

      <td className="px-3 py-3.5 text-right">
        <Link
          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#E5D8EE] bg-white px-3 text-xs font-semibold text-[#57347D] transition-colors hover:border-[#57347D] hover:bg-[#F3EDF8]"
          to={paths.adminPlace(place.id)}
        >
          Chỉnh sửa
        </Link>
      </td>
    </tr>
  )
}
