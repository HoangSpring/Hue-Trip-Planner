
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { placeListQuerySchema } from '@shared/schemas'
import { getPlaces, getPublicMeta } from '@/lib/api'
import { vi } from '@/lib/strings/vi'
import { PlaceCard } from '@/components/ui/PlaceCard'
import { parseExploreQuery } from './query'
import { ExploreFilters } from './ExploreFilters'

export default function ExplorePage() {
  const [params, setParams] = useSearchParams()

  const parsed = useMemo(
    () => parseExploreQuery(params.toString()),
    [params],
  )

  const filters = parsed.success
    ? parsed.data
    : placeListQuerySchema.parse({})

  const meta = useQuery({
    queryKey: ['places-meta'],
    queryFn: getPublicMeta,
  })

  const places = useQuery({
    queryKey: ['places', filters],
    queryFn: () => getPlaces(filters),
    retry: 1,
  })

  const patchQuery = (
    key: string,
    value: string | string[] | undefined,
  ) => {
    const next = new URLSearchParams(params)

    next.delete(key)

    if (Array.isArray(value)) {
      value.forEach((item) => next.append(key, item))
    } else if (value) {
      next.set(key, value)
    }

    if (key !== 'page') {
      next.delete('page')
    }

    setParams(next, { replace: key === 'q' })
  }

  const clearFilters = () => {
    setParams(new URLSearchParams())
  }

  const total = places.data?.total ?? 0
  const currentPage = places.data?.page ?? filters.page
  const totalPages = Math.max(1, Math.ceil(total / 24))

  return (
    <main className="min-h-screen bg-[#fbf7ef] text-[#30263b]">
      {/* Hero và tiêu đề */}
      <section className="relative overflow-hidden border-b border-[#eee6d9] bg-[#f7f2e9]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-28 size-[340px] rotate-45 rounded-[70px] bg-[#e9e1ed]/50"
        />

        <div className="relative mx-auto max-w-[1600px] px-4 pb-7 pt-7 md:px-8 md:pb-9 md:pt-10">
          <nav
            aria-label="Đường dẫn"
            className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#81766d]"
          >
            <span className="font-semibold uppercase tracking-wide text-[#79541c]">
              ◉ Danh bạ Cố Đô
            </span>
            <span aria-hidden="true">/</span>
            <span>Khám phá toàn diện</span>
          </nav>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#247466]">
                Hành trình di sản · Văn hóa · Ẩm thực
              </p>

              <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#25231e] sm:text-4xl md:text-5xl">
                Khám phá Cố Đô Huế
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f675f] md:text-base">
                Khám phá những di tích lịch sử, danh lam thắng cảnh,
                ẩm thực truyền thống và không gian văn hóa đặc sắc
                bên dòng Hương Giang.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#756b62]">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2">
                <span className="size-2 rounded-full bg-[#70a78f]" />
                Cập nhật địa điểm
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2">
                <span aria-hidden="true">☀</span>
                Di sản và văn hóa Huế
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Khu vực tìm kiếm và bộ lọc */}
      <section className="mx-auto max-w-[1600px] px-4 pt-5 md:px-8 md:pt-7">
        <div className="rounded-2xl border border-[#eee6dc] bg-white p-3 shadow-[0_4px_18px_rgba(65,45,25,0.05)] md:p-4">
          <ExploreFilters
            filters={filters}
            query={params.get('q') ?? ''}
            tags={meta.data?.tags ?? []}
            onChange={patchQuery}
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0ebe3] pt-3">
            <p className="text-xs leading-5 text-[#81766d]">
              <span className="font-semibold text-[#59348a]">
                Gợi ý khám phá:
              </span>{' '}
              Di sản, ẩm thực, cà phê và cảnh đẹp xứ Huế.
            </p>

            {(filters.category || filters.tag?.length || filters.q) && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold text-[#69429a] transition hover:bg-[#f4eff8]"
              >
                <span aria-hidden="true">↺</span>
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {!parsed.success && (
          <p
            className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800"
            role="status"
          >
            {vi.explore.invalidFilter}
          </p>
        )}
      </section>

      {/* Kết quả khám phá */}
      <section className="mx-auto max-w-[1600px] px-4 pb-12 pt-7 md:px-8 md:pb-16 md:pt-9">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#247466]">
              Hành trình của bạn
            </p>

            <h2 className="mt-2 font-serif text-2xl font-bold text-[#30263b] md:text-3xl">
              Khám phá điểm đến
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#81766d]">
              <span>
                {places.data
                  ? vi.explore.placeCount(total)
                  : vi.explore.loadingCount}
              </span>

              <span aria-hidden="true" className="text-[#c8bdaE]">
                •
              </span>

              <span className="inline-flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full bg-[#70a78f]" />
                Danh sách địa điểm
              </span>
            </div>
          </div>

          {places.isSuccess && places.data.items.length > 0 && (
            <div className="flex items-center gap-2 self-start rounded-xl border border-[#e9e0d5] bg-white p-1 sm:self-auto">
              <span className="rounded-lg bg-[#59348a] px-3 py-2 text-xs font-semibold text-white">
                ▦ Lưới
              </span>

              <span className="px-3 py-2 text-xs text-[#81766d]">
                {currentPage}/{totalPages}
              </span>
            </div>
          )}
        </div>

        {/* Đang tải */}
        {places.isPending && (
          <div
            role="status"
            aria-label={vi.explore.loading}
            className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-[#eee6dc] bg-white shadow-sm"
              >
                <div className="aspect-[4/3] animate-pulse bg-[#eae3d8]" />

                <div className="space-y-3 p-4">
                  <div className="h-4 w-1/3 animate-pulse rounded-full bg-[#eee8df]" />
                  <div className="h-5 w-4/5 animate-pulse rounded bg-[#eee8df]" />
                  <div className="h-3 w-full animate-pulse rounded bg-[#f2ede6]" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-[#f2ede6]" />
                  <div className="h-9 animate-pulse rounded-xl bg-[#f2ede6]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lỗi tải dữ liệu */}
        {places.isError && (
          <div
            className="mt-6 rounded-2xl border border-[#eee3d7] bg-white px-6 py-12 text-center"
            role="alert"
          >
            <span aria-hidden="true" className="text-4xl text-[#59348a]">
              ⌖
            </span>

            <h3 className="mt-4 font-serif text-xl font-semibold text-[#30263b]">
              {vi.explore.errorTitle}
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#81766d]">
              {vi.explore.errorBody}
            </p>

            <button
              type="button"
              onClick={() => void places.refetch()}
              className="mt-5 min-h-11 rounded-xl bg-[#59348a] px-5 font-semibold text-white transition hover:bg-[#47266f]"
            >
              {vi.explore.retry}
            </button>
          </div>
        )}

        {/* Không có kết quả */}
        {places.isSuccess && places.data.items.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-[#d9cbbb] bg-white px-6 py-14 text-center">
            <span aria-hidden="true" className="text-4xl text-[#8b75a8]">
              ✧
            </span>

            <h3 className="mt-4 font-serif text-2xl font-semibold text-[#30263b]">
              {vi.explore.emptyTitle}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#81766d]">
              {vi.explore.emptyBody}
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 min-h-11 rounded-xl bg-[#59348a] px-5 font-semibold text-white transition hover:bg-[#47266f]"
            >
              {vi.explore.clearFilters}
            </button>
          </div>
        )}

        {/* Lưới địa điểm */}
        {places.isSuccess && places.data.items.length > 0 && (
          <>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {places.data.items.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>

            {/* Phân trang */}
            <nav
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
              aria-label="Phân trang địa điểm"
            >
              <button
                type="button"
                disabled={filters.page <= 1}
                onClick={() =>
                  patchQuery('page', String(filters.page - 1))
                }
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e7ded2] bg-white px-5 text-sm font-semibold text-[#59348a] transition hover:border-[#c7b2dc] hover:bg-[#f6f1fa] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← {vi.explore.previous}
              </button>

              <span className="rounded-xl bg-[#f1ece4] px-4 py-3 text-sm text-[#655b6c]">
                Trang{' '}
                <span className="font-semibold text-[#59348a]">
                  {places.data.page}
                </span>{' '}
                / {totalPages}
              </span>

              <button
                type="button"
                disabled={places.data.page * 24 >= places.data.total}
                onClick={() =>
                  patchQuery('page', String(filters.page + 1))
                }
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e7ded2] bg-white px-5 text-sm font-semibold text-[#59348a] transition hover:border-[#c7b2dc] hover:bg-[#f6f1fa] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {vi.explore.next} →
              </button>
            </nav>
          </>
        )}
      </section>
    </main>
  )
}
