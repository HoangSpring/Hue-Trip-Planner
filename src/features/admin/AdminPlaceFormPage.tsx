import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminPlaceInputSchema, type AdminPlaceInput } from '@shared/schemas/adminPlace'
import { paths } from '@/app/paths'
import { MapView } from '@/features/map/MapView'
import { useSession } from '@/features/auth/hooks/useSession'
import { getPublicMeta } from '@/lib/api'
import { ApiRequestError } from '@/lib/api'
import { getSupabaseClient } from '@/lib/supabase'
import { vi } from '@/lib/strings/vi'
import { changeAdminStatus, getAdminAudit, getAdminPlace, saveAdminPlace, verifyAdminPlace } from './adminApi'
import { adminPlaceWarnings, isAdminImageAllowed } from './adminWarnings'

const center = { lat: 16.4637, lng: 107.5909 }
const clean: AdminPlaceInput = { slug: '', name: '', category: 'heritage', shortDescription: null, description: null, address: null, area: null, lat: center.lat, lng: center.lng, openTime: null, closeTime: null, closedDays: [], openingNote: null, visitDurationMin: null, priceLevel: null, ticketPriceVnd: null, priceNote: null, bestTime: [], mealType: [], suitableFor: [], walkingIntensity: null, phone: null, website: null, coverImageUrl: null, coverImageAlt: null, imageCredit: null, imageLicense: null, imageSourceUrl: null, source: 'manual', sourceUrl: null, osmId: null, googlePlaceId: null, featured: false, sortOrder: 0, status: 'draft', tags: [] }
const days = [[1, 'Thứ 2'], [2, 'Thứ 3'], [3, 'Thứ 4'], [4, 'Thứ 5'], [5, 'Thứ 6'], [6, 'Thứ 7'], [7, 'Chủ nhật']] as const
const slots = [['morning', 'Sáng'], ['noon', 'Trưa'], ['afternoon', 'Chiều'], ['evening', 'Tối']] as const
const meals = [['breakfast', 'Bữa sáng'], ['lunch', 'Bữa trưa'], ['dinner', 'Bữa tối'], ['snack', 'Ăn nhẹ']] as const
const suitable = [['solo', 'Đi một mình'], ['couple', 'Cặp đôi'], ['family_kids', 'Gia đình có trẻ nhỏ'], ['friends', 'Bạn bè'], ['seniors', 'Người lớn tuổi']] as const
const categories = [['heritage', 'Di sản'], ['food', 'Ẩm thực'], ['cafe', 'Cà phê'], ['sightseeing', 'Tham quan'], ['shopping', 'Mua sắm']] as const

export default function AdminPlaceFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id && id !== 'new')
  const session = useSession()
  const token = session.session?.access_token ?? ''
  const navigate = useNavigate()
  const client = useQueryClient()
  const [form, setForm] = useState<AdminPlaceInput>(clean)
  const [errors, setErrors] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [confirmed, setConfirmed] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const placeQuery = useQuery({ queryKey: ['admin-place', id], queryFn: () => getAdminPlace(id!, token), enabled: isEdit && Boolean(token) })
  const audit = useQuery({ queryKey: ['admin-audit', id], queryFn: () => getAdminAudit(id!, token), enabled: isEdit && Boolean(token) })
  const tags = useQuery({ queryKey: ['place-meta'], queryFn: getPublicMeta })
  useEffect(() => { if (placeQuery.data) setForm(adminPlaceInputSchema.parse(placeQuery.data)) }, [placeQuery.data])
  const save = useMutation({ mutationFn: (payload: AdminPlaceInput) => saveAdminPlace(isEdit ? id! : null, payload, token), onSuccess: async (place) => { await client.invalidateQueries({ queryKey: ['admin-places'] }); await client.invalidateQueries({ queryKey: ['admin-place'] }); await client.invalidateQueries({ queryKey: ['admin-audit'] }); setNotice(vi.admin.saveSuccess); setErrors([]); if (!isEdit) navigate(paths.adminPlace(place.id), { replace: true }) } })
  const setField = <K extends keyof AdminPlaceInput>(key: K, value: AdminPlaceInput[K]) => setForm((current) => ({ ...current, [key]: value }))
  const changeMulti = <K extends 'closedDays' | 'bestTime' | 'mealType' | 'suitableFor'>(key: K, value: AdminPlaceInput[K] extends (infer Item)[] ? Item : never, checked: boolean) => setForm((current) => {
    const currentValues = current[key] as (string | number)[]
    const next = checked ? [...currentValues, value as string | number] : currentValues.filter((item) => item !== value)
    return { ...current, [key]: next } as AdminPlaceInput
  })
  const warnings = useMemo(() => adminPlaceWarnings(form), [form])
  const submit = async (status: 'draft' | 'published') => {
    const payload = { ...form, status: 'draft' as const }
    const parsed = adminPlaceInputSchema.safeParse(payload)
    if (!parsed.success) { setErrors(parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)); return }
    try {
      const saved = await save.mutateAsync(parsed.data)
      if (status === 'published') {
        await changeAdminStatus(saved.id, 'published', token)
        setNotice('Đã xuất bản địa điểm.')
      }
    } catch (error) {
      const details = error instanceof ApiRequestError ? error.payload.error.details : undefined
      const api = Array.isArray(details) ? details.map((detail) => detail.message) : undefined
      setErrors(api?.length ? api : [error instanceof Error ? error.message : 'Không thể lưu địa điểm lúc này.'])
    }
  }
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!isAdminImageAllowed(file)) { setErrors(['Ảnh phải là WebP, JPG hoặc PNG và không quá 2 MB.']); return }
    if (!form.slug) { setErrors(['Nhập slug trước khi tải ảnh lên.']); return }
    const supabase = getSupabaseClient()
    if (!supabase) { setErrors(['Chưa cấu hình Supabase Storage.']); return }
    setUploading(true)
    const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
    const path = `${form.slug}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('place-images').upload(path, file, { contentType: file.type, upsert: false })
    if (error) setErrors(['Tải ảnh thất bại. Kiểm tra quyền ghi Storage và thử lại.'])
    else { const { data } = supabase.storage.from('place-images').getPublicUrl(path); setField('coverImageUrl', data.publicUrl); setField('coverImageAlt', form.name); setNotice('Đã tải ảnh lên. Hãy bổ sung tác giả và giấy phép ảnh.') }
    setUploading(false)
  }
  const aiFields = placeQuery.data?.aiFilledFields ?? []
  const setTag = (slug: string, checked: boolean) => setForm((current) => ({ ...current, tags: checked ? [...current.tags, { slug, weight: 2 }] : current.tags.filter((item) => item.slug !== slug) }))
  if (isEdit && placeQuery.isPending) return <p role="status" className="p-8 text-center">{vi.admin.loading}</p>
  if (isEdit && placeQuery.isError) return <div role="alert" className="rounded-card bg-surface p-8">{placeQuery.error.message}<button className="admin-button ml-3" onClick={() => void placeQuery.refetch()}>{vi.admin.retry}</button></div>
  return <section className="space-y-5">
    <div className="flex items-end justify-between gap-3"><div><Link className="text-sm text-primary underline" to={paths.adminPlaces}>← Quản lý địa điểm</Link><h1 className="mt-2 font-serif text-3xl">{isEdit ? 'Sửa địa điểm' : vi.admin.add}</h1></div>{isEdit && <span className="rounded-full bg-bg px-3 py-2 text-xs">{placeQuery.data?.verified ? 'Đã duyệt' : 'Chưa duyệt'}</span>}</div>
    {notice && <p role="status" className="rounded-control bg-secondary-tint p-3 text-secondary">{notice}</p>}{errors.length > 0 && <div role="alert" className="rounded-control border border-danger/30 bg-white p-4 text-sm text-danger"><ul className="list-disc pl-5">{errors.map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}</ul></div>}
    <FieldGroup title="Thông tin cơ bản"><div className="grid gap-4 md:grid-cols-2"><TextField label={vi.admin.name} value={form.name} onChange={(value) => setField('name', value)}/><TextField label={vi.admin.slug} value={form.slug} onChange={(value) => setField('slug', value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))}/><SelectField label={vi.admin.categoryLabel} value={form.category} options={categories} onChange={(value) => setField('category', value as AdminPlaceInput['category'])}/><TextField label={vi.admin.shortDescription} value={form.shortDescription ?? ''} onChange={(value) => setField('shortDescription', value || null)}/><TextArea label={vi.admin.description} value={form.description ?? ''} onChange={(value) => setField('description', value || null)}/><TextField label={vi.admin.address} value={form.address ?? ''} onChange={(value) => setField('address', value || null)}/><TextField label={vi.admin.area} value={form.area ?? ''} onChange={(value) => setField('area', value || null)}/></div></FieldGroup>
    <FieldGroup title={vi.admin.location}><div className="grid gap-3 sm:grid-cols-2"><NumberField label="Vĩ độ" value={form.lat} onChange={(value) => setField('lat', value)}/><NumberField label="Kinh độ" value={form.lng} onChange={(value) => setField('lng', value)}/></div><p className="my-2 text-xs text-ink-muted">Kéo ghim trên bản đồ để chọn tọa độ.</p>{form.lat !== null && form.lng !== null && <MapView places={[]} height="280px" picker={{ lat: form.lat, lng: form.lng, onChange: (lat, lng) => { setField('lat', Number(lat.toFixed(6))); setField('lng', Number(lng.toFixed(6))) } }}/>}</FieldGroup>
    <FieldGroup title={vi.admin.schedule}><div className="grid gap-4 sm:grid-cols-2"><TextField label="Giờ mở cửa" type="time" value={form.openTime ?? ''} onChange={(value) => setField('openTime', value || null)}/><TextField label="Giờ đóng cửa" type="time" value={form.closeTime ?? ''} onChange={(value) => setField('closeTime', value || null)}/><NumberField label="Thời lượng tham quan (phút)" value={form.visitDurationMin} onChange={(value) => setField('visitDurationMin', value === null ? null : Math.round(value))}/><NumberField label="Mức giá (0–3)" value={form.priceLevel} onChange={(value) => setField('priceLevel', value === null ? null : Math.round(value))}/><NumberField label="Giá vé (₫)" value={form.ticketPriceVnd} onChange={(value) => setField('ticketPriceVnd', value === null ? null : Math.round(value))}/><TextField label="Ghi chú giờ mở cửa" value={form.openingNote ?? ''} onChange={(value) => setField('openingNote', value || null)}/></div><CheckGroup label="Ngày nghỉ" options={days} values={form.closedDays} onChange={(value, checked) => changeMulti('closedDays', value, checked)}/><CheckGroup label="Nên đi vào" options={slots} values={form.bestTime} onChange={(value, checked) => changeMulti('bestTime', value, checked)}/><CheckGroup label="Loại bữa ăn" options={meals} values={form.mealType} onChange={(value, checked) => changeMulti('mealType', value, checked)}/><CheckGroup label="Phù hợp với" options={suitable} values={form.suitableFor} onChange={(value, checked) => changeMulti('suitableFor', value, checked)}/><NumberField label="Cường độ đi bộ (1–3)" value={form.walkingIntensity} onChange={(value) => setField('walkingIntensity', value === null ? null : Math.round(value))}/></FieldGroup>
    <FieldGroup title={vi.admin.tags}><div className="grid gap-2 sm:grid-cols-2">{(tags.data?.tags ?? []).map((tag) => { const item = form.tags.find((candidate) => candidate.slug === tag.slug); return <label key={tag.slug} className="flex min-h-11 items-center gap-2 rounded-control border border-line p-2 text-sm"><input type="checkbox" checked={Boolean(item)} onChange={(event) => setTag(tag.slug, event.target.checked)}/><span className="flex-1">{tag.name}</span>{item && <select aria-label={`Trọng số ${tag.name}`} className="rounded border border-line p-1" value={item.weight} onChange={(event) => setField('tags', form.tags.map((current) => current.slug === tag.slug ? { ...current, weight: Number(event.target.value) as 1 | 2 | 3 } : current))}><option value="1">1</option><option value="2">2</option><option value="3">3</option></select>}</label> })}</div>{tags.isError && <p role="alert" className="text-sm text-danger">Không tải được tag. Thử tải lại trang.</p>}</FieldGroup>
    <FieldGroup title={vi.admin.photos}><div className="grid gap-4 md:grid-cols-2"><TextField label={vi.admin.imageUrl} value={form.coverImageUrl ?? ''} onChange={(value) => setField('coverImageUrl', value || null)}/><label className="text-sm">{vi.admin.upload}<input className="admin-input mt-1" type="file" accept="image/webp,image/jpeg,image/png" onChange={(event) => void upload(event)} disabled={uploading}/></label><TextField label={vi.admin.author} value={form.imageCredit ?? ''} onChange={(value) => setField('imageCredit', value || null)}/><TextField label={vi.admin.license} value={form.imageLicense ?? ''} onChange={(value) => setField('imageLicense', value || null)}/><TextField label={vi.admin.sourceUrl} value={form.imageSourceUrl ?? ''} onChange={(value) => setField('imageSourceUrl', value || null)}/><TextField label="Mô tả ảnh" value={form.coverImageAlt ?? ''} onChange={(value) => setField('coverImageAlt', value || null)}/></div>{form.coverImageUrl && <div className="mt-4 flex items-center gap-4 rounded-control bg-bg p-3"><img src={form.coverImageUrl} alt={form.coverImageAlt ?? ''} className="size-24 rounded-control object-cover"/><p className="text-sm">{form.imageCredit || 'Chưa có tác giả'} · {form.imageLicense || 'Chưa có giấy phép'}</p></div>}</FieldGroup>
    <FieldGroup title={vi.admin.sources}><div className="grid gap-4 sm:grid-cols-2"><TextField label="Nguồn" value={form.source ?? ''} onChange={(value) => setField('source', value || null)}/><TextField label="URL nguồn dữ liệu" value={form.sourceUrl ?? ''} onChange={(value) => setField('sourceUrl', value || null)}/><TextField label="OSM ID" value={form.osmId ?? ''} onChange={(value) => setField('osmId', value || null)}/></div><label className="mt-3 flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(event) => setField('featured', event.target.checked)}/>Địa điểm nổi bật</label></FieldGroup>
    {warnings.length > 0 && <aside className="rounded-card border border-warning/30 bg-warning/10 p-4" aria-label="Cảnh báo dữ liệu"><h2 className="font-semibold text-warning">Kiểm tra thông tin</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
    <div className="flex flex-wrap gap-3 rounded-card border border-line bg-surface p-4"><button className="admin-button" onClick={() => void submit('draft')} disabled={save.isPending}>Lưu nháp</button><button className="admin-button bg-secondary" onClick={() => void submit('published')} disabled={save.isPending}>Xuất bản</button>{isEdit && !placeQuery.data?.verified && <button className="admin-button border border-secondary bg-white text-secondary" onClick={() => { setConfirmed([]); setVerifyOpen(true) }}>Duyệt thông tin</button>}</div>
    {verifyOpen && <div className="fixed inset-0 z-[1000] grid place-items-center bg-ink/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="verify-title" className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-card bg-surface p-6 shadow-card"><h2 id="verify-title" className="font-serif text-2xl">Duyệt thông tin địa điểm</h2>{aiFields.length ? <><p className="mt-2 text-sm">Chọn các trường do AI điền mà bạn đã đối chiếu:</p><div className="mt-3 space-y-2">{aiFields.map((field) => <label key={field} className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={confirmed.includes(field)} onChange={(event) => setConfirmed((current) => event.target.checked ? [...current, field] : current.filter((item) => item !== field))}/>{field}</label>)}</div></> : <p className="mt-3 text-sm">Xác nhận bạn đã kiểm tra thông tin địa điểm.</p>}<div className="mt-5 flex justify-end gap-2"><button className="admin-button border border-line bg-white text-ink" onClick={() => setVerifyOpen(false)}>Hủy</button><button className="admin-button" onClick={async () => { try { await verifyAdminPlace(id!, confirmed, token); await client.invalidateQueries({ queryKey: ['admin-place', id] }); setVerifyOpen(false); setNotice('Đã duyệt thông tin.') } catch (error) { setErrors([error instanceof Error ? error.message : 'Không thể duyệt địa điểm.']); setVerifyOpen(false) } }}>Xác nhận duyệt</button></div></section></div>}
    {isEdit && <FieldGroup title={vi.admin.audit}><div className="space-y-2">{audit.isPending ? <p>{vi.admin.loading}</p> : audit.isError ? <p role="alert">{audit.error.message}</p> : audit.data.items.length === 0 ? <p className="text-sm text-ink-muted">Chưa có lịch sử thay đổi.</p> : audit.data.items.map((item) => <article key={item.id} className="flex flex-wrap justify-between gap-2 border-b border-line py-2 text-sm"><span>{auditAction(item.action)}{formatChanged(item.changes)}</span><time className="text-xs text-ink-muted">{new Date(item.created_at).toLocaleString('vi-VN')}</time></article>)}</div></FieldGroup>}
  </section>
}

function FieldGroup({ title, children }: { title: string; children: ReactNode }) { return <section className="space-y-3 rounded-card border border-line bg-surface p-4 shadow-card sm:p-5"><h2 className="font-serif text-xl">{title}</h2>{children}</section> }
function TextField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block text-sm">{label}<input className="admin-input mt-1" type={type} value={value} onChange={(event) => onChange(event.target.value)}/></label> }
function NumberField({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) { return <label className="block text-sm">{label}<input className="admin-input mt-1" type="number" value={value ?? ''} onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}/></label> }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-sm md:col-span-2">{label}<textarea className="admin-input mt-1 min-h-28" value={value} onChange={(event) => onChange(event.target.value)}/></label> }
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: readonly (readonly [string, string])[]; onChange: (value: string) => void }) { return <label className="block text-sm">{label}<select className="admin-input mt-1" value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select></label> }
function CheckGroup<T extends string | number>({ label, options, values, onChange }: { label: string; options: readonly (readonly [T, string])[]; values: readonly T[]; onChange: (value: T, checked: boolean) => void }) { return <fieldset className="mt-3"><legend className="text-sm font-semibold">{label}</legend><div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">{options.map(([value, title]) => <label key={String(value)} className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={values.includes(value)} onChange={(event) => onChange(value, event.target.checked)}/>{title}</label>)}</div></fieldset> }
function auditAction(action: string) { return ({ create: 'Tạo địa điểm', update: 'Cập nhật', publish: 'Xuất bản', unpublish: 'Gỡ xuất bản', archive: 'Lưu trữ', verify: 'Duyệt', unverify: 'Bỏ duyệt', import: 'Import' } as Record<string, string>)[action] ?? action }
function formatChanged(changes: unknown) { if (!changes || typeof changes !== 'object' || !('changedFields' in changes) || !Array.isArray(changes.changedFields)) return ''; return ` · ${changes.changedFields.map(String).join(', ')}` }
