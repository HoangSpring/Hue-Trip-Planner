import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paths } from '@/app/paths'
import { useSession } from '@/features/auth/hooks/useSession'
import { vi } from '@/lib/strings/vi'
import { bulkAdminPlaces, listAdminPlaces, type AdminPlace } from './adminApi'

const categories = ['heritage', 'food', 'cafe', 'sightseeing', 'shopping'] as const
const missingKeys = ['hours', 'duration', 'image', 'coords', 'meal_type', 'best_time'] as const
const labels: Record<string, string> = { heritage: 'Di sản', food: 'Ẩm thực', cafe: 'Cà phê', sightseeing: 'Tham quan', shopping: 'Mua sắm', draft: vi.admin.statusDraft, published: vi.admin.statusPublished, archived: vi.admin.statusArchived }
const actions = [{ id: 'publish', label: 'Xuất bản' }, { id: 'unpublish', label: 'Gỡ xuất bản' }, { id: 'archive', label: 'Lưu trữ' }, { id: 'verify', label: 'Duyệt' }, { id: 'unverify', label: 'Bỏ duyệt' }] as const

export default function AdminPlaceListPage() {
  const session = useSession()
  const token = session.session?.access_token ?? ''
  const [params, setParams] = useSearchParams()
  const [selected, setSelected] = useState<string[]>([])
  const query = useMemo(() => new URLSearchParams(params), [params])
  const places = useQuery({ queryKey: ['admin-places', query.toString()], queryFn: () => listAdminPlaces(token, query), enabled: Boolean(token) })
  const client = useQueryClient()
  const bulk = useMutation({ mutationFn: (action: typeof actions[number]['id']) => bulkAdminPlaces(selected, action, token), onSuccess: () => { setSelected([]); void client.invalidateQueries({ queryKey: ['admin-places'] }) } })
  const setFilter = (key: string, value: string) => setParams((current) => { const next = new URLSearchParams(current); if (value) next.set(key, value); else next.delete(key); next.delete('page'); return next })
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])
  const rows = places.data?.items ?? []
  const page = Number(query.get('page') ?? 1)
  const pages = Math.max(1, Math.ceil((places.data?.total ?? 0) / (places.data?.pageSize ?? 25)))
  return <section className="space-y-5" aria-labelledby="admin-places-title">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-secondary">Quản trị nội dung</p><h1 id="admin-places-title" className="mt-1 font-serif text-3xl">{vi.admin.title}</h1></div><Link className="inline-flex min-h-11 items-center rounded-control bg-primary px-4 font-semibold text-white" to={paths.adminPlaceNew}>＋ {vi.admin.add}</Link></div>
    <div className="grid gap-3 rounded-card border border-line bg-surface p-4 shadow-card sm:grid-cols-2 xl:grid-cols-5">
      <label className="text-sm">{vi.admin.search}<input className="admin-input mt-1" value={query.get('q') ?? ''} onChange={(event) => setFilter('q', event.target.value)} placeholder={vi.admin.search}/></label>
      <FilterSelect label={vi.admin.status} value={query.get('status') ?? ''} onChange={(value) => setFilter('status', value)} options={['draft', 'published', 'archived'].map((value) => [value, labels[value]])}/>
      <FilterSelect label={vi.admin.verified} value={query.get('verified') ?? ''} onChange={(value) => setFilter('verified', value)} options={ [['true', 'Đã duyệt'], ['false', 'Chưa duyệt']] }/>
      <FilterSelect label={vi.admin.category} value={query.get('category') ?? ''} onChange={(value) => setFilter('category', value)} options={categories.map((value) => [value, labels[value]])}/>
      <FilterSelect label={vi.admin.missing} value={query.get('missing') ?? ''} onChange={(value) => setFilter('missing', value)} options={missingKeys.map((value) => [value, vi.admin[value]])}/>
    </div>
    {selected.length > 0 && <div className="flex flex-wrap items-center gap-2 rounded-card border border-primary/20 bg-primary-tint p-3"><strong className="mr-2 text-sm">Đã chọn {selected.length}</strong>{actions.map((action) => <button key={action.id} className="min-h-10 rounded-control border border-line bg-white px-3 text-sm font-semibold" onClick={() => bulk.mutate(action.id)} disabled={bulk.isPending}>{action.label}</button>)}{bulk.data && <p className="basis-full text-sm" role="status">{bulk.data.results.filter((item) => item.success).length} thành công · {bulk.data.results.filter((item) => !item.success).length} chưa thực hiện</p>}</div>}
    {places.isPending && <p role="status" className="rounded-card bg-surface p-8 text-center">{vi.admin.loading}</p>}
    {places.isError && <div className="rounded-card border border-danger/30 bg-surface p-6 text-center" role="alert"><p>{places.error.message}</p><button className="mt-3 min-h-11 rounded-control bg-primary px-4 text-white" onClick={() => void places.refetch()}>{vi.admin.retry}</button></div>}
    {places.isSuccess && rows.length === 0 && <p className="rounded-card bg-surface p-10 text-center text-ink-muted">{vi.admin.empty}</p>}
    {places.isSuccess && rows.length > 0 && <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card"><div className="overflow-x-auto"><table className="w-full min-w-[1050px] border-collapse text-left text-sm"><thead className="bg-bg text-xs uppercase text-ink-muted"><tr><th className="p-3"><input aria-label="Chọn tất cả trang" type="checkbox" checked={rows.length > 0 && rows.every((row) => selected.includes(row.id))} onChange={(event) => setSelected(event.target.checked ? [...new Set([...selected, ...rows.map((row) => row.id)])] : selected.filter((id) => !rows.some((row) => row.id === id)))}/></th><th>Ảnh</th><th>Tên địa điểm</th><th>Loại</th><th>Trạng thái</th><th>Duyệt</th><th>Thiếu dữ liệu</th><th>Cập nhật</th><th>Thao tác</th></tr></thead><tbody>{rows.map((place) => <PlaceRow key={place.id} place={place} selected={selected.includes(place.id)} onToggle={() => toggle(place.id)}/>)}</tbody></table></div></div>}
    {places.data && <div className="flex items-center justify-between text-sm"><span>{places.data.total} địa điểm · trang {page}/{pages}</span><div className="flex gap-2"><button className="min-h-11 rounded-control border border-line px-3 disabled:opacity-40" disabled={page <= 1} onClick={() => setFilter('page', String(page - 1))}>Trước</button><button className="min-h-11 rounded-control border border-line px-3 disabled:opacity-40" disabled={page >= pages} onClick={() => setFilter('page', String(page + 1))}>Tiếp</button></div></div>}
  </section>
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: (readonly [string, string])[] }) {
  return <label className="text-sm">{label}<select className="admin-input mt-1" value={value} onChange={(event) => onChange(event.target.value)}><option value="">{vi.admin.all}</option>{options.map(([key, title]) => <option value={key} key={key}>{title}</option>)}</select></label>
}

function PlaceRow({ place, selected, onToggle }: { place: AdminPlace; selected: boolean; onToggle: () => void }) {
  return <tr className="border-t border-line align-top hover:bg-bg/60"><td className="p-3"><input aria-label={`Chọn ${place.name}`} type="checkbox" checked={selected} onChange={onToggle}/></td><td className="p-3">{place.coverImageUrl ? <img className="size-14 rounded-control object-cover" src={place.coverImageUrl} alt={place.coverImageAlt ?? ''} loading="lazy"/> : <span className="grid size-14 place-items-center rounded-control bg-primary-tint text-xs text-primary">Chưa có ảnh</span>}</td><td className="max-w-64 p-3"><Link className="font-semibold text-primary underline" to={paths.adminPlace(place.id)}>{place.name}</Link><p className="mt-1 break-all text-xs text-ink-muted">{place.slug}</p></td><td className="p-3">{labels[place.category] ?? place.category}</td><td className="p-3"><span className="rounded-full bg-bg px-2.5 py-1 text-xs">{labels[place.status]}</span></td><td className="p-3">{place.verified ? '✓ Đã duyệt' : 'Chưa duyệt'}</td><td className="max-w-52 p-3">{place.missingFields.length ? <div className="flex flex-wrap gap-1">{place.missingFields.map((field) => <span className="rounded-full bg-warning/10 px-2 py-1 text-xs text-warning" key={field}>{vi.admin[field as keyof typeof vi.admin] ?? field}</span>)}</div> : <span className="text-secondary">Đủ dữ liệu</span>}</td><td className="whitespace-nowrap p-3 text-xs text-ink-muted">{new Date(place.updatedAt).toLocaleDateString('vi-VN')}</td><td className="p-3"><Link className="min-h-10 inline-flex items-center rounded-control border border-line px-3 text-primary" to={paths.adminPlace(place.id)}>Sửa</Link></td></tr>
}
