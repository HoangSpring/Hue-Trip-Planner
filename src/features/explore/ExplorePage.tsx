import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { placeListQuerySchema } from '@shared/schemas'
import { getPlaces, getPublicMeta } from '@/lib/api'
import { vi } from '@/lib/strings/vi'
import { PlaceCard } from '@/components/ui/PlaceCard'
import { parseExploreQuery } from './query'

const categoryEntries = Object.entries(vi.placeCategories) as Array<[keyof typeof vi.placeCategories, string]>

export default function ExplorePage() {
  const [params, setParams] = useSearchParams()
  const parsed = useMemo(() => parseExploreQuery(params.toString()), [params])
  const filters = parsed.success ? parsed.data : placeListQuerySchema.parse({})
  const meta = useQuery({ queryKey: ['places-meta'], queryFn: getPublicMeta })
  const places = useQuery({ queryKey: ['places', filters], queryFn: () => getPlaces(filters), retry: 1 })
  const patchQuery = (key: string, value: string | string[] | undefined) => {
    const next = new URLSearchParams(params)
    next.delete(key)
    if (Array.isArray(value)) value.forEach((item) => next.append(key, item))
    else if (value) next.set(key, value)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: false })
  }
  const clearFilters = () => setParams(new URLSearchParams())
  const tagSlugs = params.getAll('tag')

  return <div className="mx-auto max-w-content px-4 pb-16 pt-10 md:px-8 md:pt-16">
    <header className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-secondary">Tạp chí khám phá Huế</p><h1 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">Đi chậm, thấy nhiều hơn</h1><p className="mt-3 max-w-2xl text-base leading-7 text-ink-muted">Tìm một góc di sản, một món ngon hay khoảng lặng bên dòng Hương theo nhịp riêng của bạn.</p></header>
    <section className="mt-8 rounded-card border border-line bg-white p-4 shadow-card md:p-6" aria-label="Bộ lọc địa điểm">
      <label className="block text-sm font-semibold" htmlFor="place-search">Bạn muốn khám phá điều gì?</label>
      <div className="mt-2 flex flex-col gap-3 md:flex-row"><input id="place-search" value={params.get('q') ?? ''} onChange={(event) => patchQuery('q', event.target.value.trim() ? event.target.value : undefined)} placeholder="Thử “lăng tẩm”, “ẩm thực”…" className="min-h-12 min-w-0 flex-1 rounded-control border border-line px-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary-tint" /><select aria-label="Sắp xếp" value={filters.sort} onChange={(event) => patchQuery('sort', event.target.value)} className="min-h-12 rounded-control border border-line bg-white px-4"><option value="featured">Gợi ý</option><option value="name">Tên A–Z</option></select></div>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Lọc theo loại">{categoryEntries.map(([value, label]) => <button key={value} type="button" aria-pressed={filters.category === value} onClick={() => patchQuery('category', filters.category === value ? undefined : value)} className={`min-h-10 rounded-full border px-4 text-sm ${filters.category === value ? 'border-primary bg-primary text-white' : 'border-line bg-bg text-ink hover:border-primary'}`}>{label}</button>)}</div>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Lọc theo chủ đề">{meta.data?.tags.map((tag) => <button key={tag.slug} type="button" aria-pressed={tagSlugs.includes(tag.slug)} onClick={() => patchQuery('tag', tagSlugs.includes(tag.slug) ? tagSlugs.filter((item) => item !== tag.slug) : [...tagSlugs, tag.slug])} className={`min-h-9 rounded-full border px-3 text-xs ${tagSlugs.includes(tag.slug) ? 'border-secondary bg-secondary text-white' : 'border-line bg-white text-ink-muted'}`}>{tag.name}</button>)}</div>
      {!parsed.success && <p className="mt-3 text-sm text-warning" role="status">Bộ lọc trong đường dẫn không hợp lệ; đang hiển thị tất cả địa điểm.</p>}
    </section>
    <div className="mt-8 flex items-end justify-between gap-4"><div><p className="text-sm text-ink-muted">{places.data ? `${places.data.total} địa điểm` : 'Đang tìm địa điểm'}</p><h2 className="mt-1 font-serif text-2xl">Góc Huế dành cho bạn</h2></div>{(filters.category || filters.tag?.length || filters.q) && <button onClick={clearFilters} className="min-h-11 rounded-control px-3 text-sm font-semibold text-primary underline underline-offset-4">Xóa bộ lọc</button>}</div>
    {places.isPending ? <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="animate-pulse overflow-hidden rounded-card border border-line bg-white"><div className="aspect-[4/3] bg-[#eee9df]"/><div className="space-y-3 p-4"><div className="h-4 w-1/3 rounded bg-[#eee9df]"/><div className="h-6 w-2/3 rounded bg-[#eee9df]"/></div></div>)}</div>
      : places.isError ? <div className="mt-6 rounded-card border border-line bg-white p-8 text-center"><h3 className="font-serif text-xl">Chưa thể tải địa điểm</h3><p className="mt-2 text-sm text-ink-muted">Kiểm tra kết nối rồi thử lại nhé.</p><button onClick={() => void places.refetch()} className="mt-4 min-h-11 rounded-control bg-primary px-5 font-semibold text-white">Thử lại</button></div>
      : places.data.items.length === 0 ? <div className="mt-6 rounded-card border border-line bg-white p-8 text-center"><h3 className="font-serif text-xl">Chưa tìm thấy địa điểm phù hợp</h3><p className="mt-2 text-sm text-ink-muted">Thử đổi từ khóa hoặc bỏ bớt bộ lọc.</p><button onClick={clearFilters} className="mt-4 min-h-11 rounded-control border border-primary px-5 font-semibold text-primary">Xóa bộ lọc</button></div>
      : <><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{places.data.items.map((place) => <PlaceCard key={place.id} place={place}/>)}</div><nav className="mt-8 flex items-center justify-center gap-3" aria-label="Phân trang"><button disabled={filters.page <= 1} onClick={() => patchQuery('page', String(filters.page - 1))} className="min-h-11 rounded-control border border-line px-4 disabled:opacity-40">Trước</button><span className="text-sm text-ink-muted">Trang {places.data.page} / {Math.max(1, Math.ceil(places.data.total / 24))}</span><button disabled={places.data.page * 24 >= places.data.total} onClick={() => patchQuery('page', String(filters.page + 1))} className="min-h-11 rounded-control border border-line px-4 disabled:opacity-40">Tiếp</button></nav></>}
  </div>
}
