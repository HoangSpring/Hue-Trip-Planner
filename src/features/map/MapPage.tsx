
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { placeMapQuerySchema } from '@shared/schemas/placeQueries'
import { getMapPlaces } from '@/lib/api'
import { categoryColor, MapView } from './MapView'
import { vi } from '@/lib/strings/vi'

const categoryEntries = Object.entries(vi.placeCategories) as Array<
  [keyof typeof vi.placeCategories, string]
>

export default function MapPage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')

  const selectedPlaceId = params.get('place')

  const parsed = placeMapQuerySchema.safeParse({
    category: params.get('category') ?? undefined,
  })

  const category = parsed.success ? parsed.data.category : undefined

  const places = useQuery({
    queryKey: ['map-places', category],
    queryFn: () =>
      getMapPlaces(category ? { category } : {}),
  })

  const visiblePlaces = useMemo(() => {
    const items = places.data?.items ?? []
    const keyword = search.trim().toLocaleLowerCase('vi')

    if (!keyword) return items

    return items.filter((place) =>
      [
        place.name,
        place.slug,
        vi.placeCategories[place.category],
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('vi')
        .includes(keyword),
    )
  }, [places.data, search])

  const chooseCategory = (value?: string) => {
    const next = new URLSearchParams(params)

    if (value) {
      next.set('category', value)
    } else {
      next.delete('category')
    }

    setParams(next)
  }

  const selectPlace = (place: { id: string } | null) => {
    const next = new URLSearchParams(params)

    if (place) {
      next.set('place', place.id)
    } else {
      next.delete('place')
    }

    setParams(next, { replace: true })
  }

  return (
    <main className="bg-[#f8f4eb] text-[#29231f]">
      <div className="mx-auto max-w-[1800px] px-3 py-4 md:px-5 md:py-5">
        {/* Page heading */}
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#247466]">
              Cố Đô · Hue Trip Planner
            </p>

            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#35204f] md:text-4xl">
              Bản đồ khám phá Huế
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#62584f]">
              Tìm những điểm đến yêu thích, khám phá nét đẹp Cố Đô
              và bắt đầu hành trình theo cách của riêng bạn.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e9e0d2] bg-white/80 px-4 py-3">
            <p className="text-xs text-[#62584f]">
              Địa điểm đang hiển thị
            </p>

            <p className="mt-1 font-serif text-2xl font-semibold text-[#59348a]">
              {places.data ? visiblePlaces.length : '—'}
              <span className="ml-1 text-sm font-normal text-[#62584f]">
                địa điểm
              </span>
            </p>
          </div>
        </header>

        {/* Main split layout */}
        <div className="grid min-h-[680px] overflow-hidden rounded-[24px] border border-[#e8dfd1] bg-white shadow-[0_8px_35px_rgba(70,49,31,0.06)] lg:h-[min(78vh,900px)] lg:grid-cols-[minmax(340px,410px)_minmax(0,1fr)]">
          {/* Left sidebar */}
          <aside className="flex min-h-0 flex-col border-b border-[#eee6d9] bg-[#fbf8f1] lg:border-b-0 lg:border-r">
            <div className="border-b border-[#eee6d9] p-4 md:p-5">
              {/* Search */}
              <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-transparent bg-[#f0ebe2] px-4 transition focus-within:border-[#69429a] focus-within:bg-white">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="size-5 shrink-0 text-[#756b80]"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m16 16 4 4" />
                </svg>

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm địa điểm, di sản, ẩm thực..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#958b9a]"
                  aria-label="Tìm kiếm địa điểm"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-sm text-[#69429a]"
                    aria-label="Xóa tìm kiếm"
                  >
                    ✕
                  </button>
                )}
              </label>

              {/* Category filters */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => chooseCategory()}
                  aria-pressed={!category}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${!category
                      ? 'bg-[#59348a] text-white shadow-sm'
                      : 'border border-[#e6ded1] bg-white text-[#635a64] hover:border-[#b9a5d0]'
                    }`}
                >
                  Tất cả
                  {places.data ? ` (${places.data.items.length})` : ''}
                </button>

                {categoryEntries.map(([value, label]) => {
                  const active = category === value

                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => chooseCategory(value)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition ${active
                          ? 'border-[#59348a] bg-[#59348a] text-white'
                          : 'border-[#e6ded1] bg-white text-[#635a64] hover:border-[#b9a5d0]'
                        }`}
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{
                          backgroundColor: active
                            ? '#ffffff'
                            : categoryColor[value],
                        }}
                      />
                      {label}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                <span className="text-[#62584f]">
                  {search ? 'Kết quả tìm kiếm' : 'Khám phá quanh Huế'}
                </span>

                <span className="font-semibold text-[#59348a]">
                  {visiblePlaces.length} kết quả
                </span>
              </div>
            </div>

            {/* Place list */}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 md:p-4">
              {places.isPending && (
                <div role="status" className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-36 animate-pulse rounded-2xl bg-[#f0ebe2]"
                    />
                  ))}

                  <p className="text-center text-xs text-[#62584f]">
                    Đang tìm những điểm đến dành cho bạn...
                  </p>
                </div>
              )}

              {places.isError && (
                <div
                  role="alert"
                  className="rounded-2xl border border-[#eadfd0] bg-white p-6 text-center"
                >
                  <p className="font-serif text-lg text-[#35204f]">
                    Chưa thể tải bản đồ
                  </p>

                  <p className="mt-2 text-sm text-[#62584f]">
                    Đã có lỗi khi tải danh sách địa điểm.
                  </p>

                  <button
                    type="button"
                    onClick={() => void places.refetch()}
                    className="mt-4 rounded-xl bg-[#59348a] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {places.isSuccess &&
                visiblePlaces.map((place, index) => {
                  const isSelected = selectedPlaceId === place.id

                  return (
                    <article
                      key={place.id}
                      onClick={() => selectPlace(place)}
                      className={`group cursor-pointer rounded-2xl border p-3 transition duration-200 ${isSelected
                          ? 'border-[#59348a] bg-[#f5effb] shadow-md'
                          : 'border-[#eee7dc] bg-white hover:-translate-y-0.5 hover:border-[#d7c5e8] hover:shadow-[0_8px_24px_rgba(70,49,31,0.08)]'
                        }`}
                    >
                      <div className="flex gap-3">
                        {/* Place image */}
                        <div className="relative size-[100px] shrink-0 overflow-hidden rounded-xl bg-[#eee6d9] sm:size-[112px]">
                          {place.coverImageUrl ? (
                            <img
                              src={place.coverImageUrl}
                              alt={place.name}
                              loading="lazy"
                              className="size-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="grid size-full place-items-center text-3xl text-[#a99b87]">
                              ✧
                            </div>
                          )}

                          <span
                            className="absolute left-2 top-2 grid size-6 place-items-center rounded-full text-[11px] font-bold text-white shadow-sm"
                            style={{
                              backgroundColor:
                                categoryColor[place.category],
                            }}
                          >
                            {index + 1}
                          </span>
                        </div>

                        {/* Place information */}
                        <div className="flex min-w-0 flex-1 flex-col">
                          <h2 className="line-clamp-2 font-serif text-lg font-semibold leading-snug text-[#35204f]">
                            {place.name}
                          </h2>

                          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#247466]">
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  categoryColor[place.category],
                              }}
                            />
                            {vi.placeCategories[place.category]}
                          </p>

                          <div className="mt-auto flex flex-wrap gap-2 pt-3">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                selectPlace(place)
                              }}
                              className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-[#f2ede5] px-2.5 py-1.5 text-[11px] font-semibold text-[#59348a] transition hover:bg-[#e8def3]"
                              aria-label={`Xem trên bản đồ: ${place.name}`}
                            >
                              <span aria-hidden="true">⌖</span>
                              Xem trên bản đồ
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}

              {places.isSuccess && visiblePlaces.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#d9cbbb] bg-white p-8 text-center">
                  <p className="font-serif text-xl text-[#35204f]">
                    Chưa tìm thấy điểm đến
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#62584f]">
                    Thử một từ khóa khác hoặc chọn danh mục khác để
                    tiếp tục khám phá Huế.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      chooseCategory()
                    }}
                    className="mt-4 rounded-xl bg-[#59348a] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Xem tất cả địa điểm
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-[#eee6d9] px-4 py-3 text-[11px] leading-5 text-[#62584f]">
              <span className="text-[#247466]">✦</span>{' '}
              Mỗi điểm đến là một câu chuyện đang chờ bạn khám phá.
            </div>
          </aside>

          {/* Right map */}
          <section className="relative min-h-[480px] bg-[#eae4d8]">
            <div className="absolute left-4 top-4 z-10 rounded-2xl border border-white/70 bg-[#fffdf8]/95 px-4 py-3 shadow-lg backdrop-blur-sm md:left-6 md:top-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#247466]">
                Hue heritage map
              </p>

              <p className="mt-1 font-serif text-base font-semibold text-[#35204f]">
                Dạo bước giữa lòng Cố Đô
              </p>

              <p className="mt-1 text-xs text-[#62584f]">
                {visiblePlaces.length} điểm đến đang hiển thị
              </p>
            </div>

            {places.isSuccess && visiblePlaces.length > 0 ? (
              <MapView
                places={visiblePlaces}
                height="100%"
                selectedPlaceId={selectedPlaceId}
                onSelectPlace={selectPlace}
              />
            ) : (
              <div className="grid h-full min-h-[480px] place-items-center p-6 text-center">
                <div className="max-w-xs rounded-2xl bg-[#fffdf8]/90 p-6 shadow-sm">
                  <span className="text-3xl text-[#59348a]">⌖</span>

                  <h2 className="mt-3 font-serif text-xl text-[#35204f]">
                    Bản đồ hành trình Huế
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#62584f]">
                    Chọn một địa điểm hoặc danh mục để bắt đầu khám phá.
                  </p>
                </div>
              </div>
            )}

            <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3 md:bottom-6 md:left-6 md:right-6">
              <div className="rounded-xl bg-[#fffdf8]/95 px-3 py-2 text-xs text-[#51485a] shadow-md backdrop-blur-sm">
                <span className="mr-2 text-[#247466]">◎</span>
                Khám phá Huế theo nhịp riêng của bạn
              </div>

              <div className="rounded-lg bg-[#fffdf8]/90 px-3 py-2 text-[10px] text-[#62584f] shadow-sm">
                Bản đồ © OpenStreetMap contributors
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
