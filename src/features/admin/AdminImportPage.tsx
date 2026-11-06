import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/useSession'
import { paths } from '@/app/paths'
import { vi } from '@/lib/strings/vi'
import sampleCsvUrl from '../../../supabase/seed/places.sample.csv?url'
import { commitPlaceCsv, previewPlaceCsv } from './adminImportApi'

type Step = 'upload' | 'preview' | 'result'
export default function AdminImportPage() {
  const token = useSession().session?.access_token ?? ''
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [csv, setCsv] = useState('')
  const [filename, setFilename] = useState('')
  const [overwrite, setOverwrite] = useState(false)
  const [error, setError] = useState('')
  const preview = useMutation({ mutationFn: (value: string) => previewPlaceCsv(value, token), onSuccess: () => { setStep('preview'); setError('') }, onError: (reason) => setError(reason instanceof Error ? reason.message : 'Không xem trước được tệp CSV.') })
  const commit = useMutation({ mutationFn: () => commitPlaceCsv(csv, overwrite, token), onSuccess: () => { setStep('result'); setError('') }, onError: (reason) => setError(reason instanceof Error ? reason.message : 'Không import được tệp CSV.') })
  const loadFile = async (file?: File) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv') || file.size > 2 * 1024 * 1024) { setError('Chọn tệp CSV không quá 2 MB.'); return }
    try { setCsv(await file.text()); setFilename(file.name); setStep('upload'); setError('') } catch { setError('Không đọc được tệp. Hãy chọn tệp CSV mã hóa UTF-8.') }
  }
  const downloadErrors = () => {
    const blob = new Blob(['\uFEFF', commit.data?.errorCsv ?? ''], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'places-import-errors.csv'; anchor.click(); URL.revokeObjectURL(url)
  }
  return <section className="space-y-5">
    <header><p className="text-sm font-semibold text-secondary">Quản trị nội dung</p><h1 className="mt-1 font-serif text-3xl">{vi.admin.importTitle}</h1><p className="mt-2 max-w-2xl text-sm text-ink-muted">Tệp được kiểm tra trước. Chỉ các dòng hợp lệ mới được import; địa điểm đã duyệt được giữ nguyên trừ khi bạn bật ghi đè.</p></header>
    <ol className="grid gap-2 sm:grid-cols-3" aria-label="Các bước import">{[['upload', '1. Tải CSV'], ['preview', '2. Xem trước'], ['result', '3. Kết quả']].map(([key, title]) => <li key={key} className={`rounded-control border p-3 text-sm ${step === key ? 'border-primary bg-primary-tint font-semibold text-primary' : 'border-line bg-surface text-ink-muted'}`} aria-current={step === key ? 'step' : undefined}>{title}</li>)}</ol>
    {error && <p role="alert" className="rounded-control bg-danger/10 p-3 text-sm text-danger">{error}</p>}
    {step === 'upload' && <section className="space-y-4 rounded-card border border-line bg-surface p-5 shadow-card"><div className="rounded-card border-2 border-dashed border-line bg-bg p-8 text-center" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void loadFile(event.dataTransfer.files[0]) }}><p className="font-semibold">Kéo thả tệp CSV vào đây</p><p className="my-2 text-sm text-ink-muted">hoặc</p><button className="admin-button" onClick={() => inputRef.current?.click()}>{vi.admin.chooseFile}</button><input ref={inputRef} className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => void loadFile(event.target.files?.[0])}/>{filename && <p className="mt-3 text-sm">Đã chọn: {filename}</p>}</div><div className="flex flex-wrap items-center justify-between gap-3"><a className="min-h-11 inline-flex items-center text-sm font-semibold text-primary underline" href={sampleCsvUrl} download="places.sample.csv">Tải CSV mẫu</a><button className="admin-button" disabled={!csv || preview.isPending} onClick={() => preview.mutate(csv)}>{preview.isPending ? 'Đang kiểm tra…' : vi.admin.preview}</button></div></section>}
    {step === 'preview' && preview.data && <section className="space-y-4 rounded-card border border-line bg-surface p-5 shadow-card"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[['Tổng dòng', preview.data.summary.total], ['Hợp lệ', preview.data.summary.valid], ['Cảnh báo', preview.data.summary.warnings], ['Lỗi', preview.data.summary.errors]].map(([label, count]) => <div className="rounded-control bg-bg p-3" key={String(label)}><p className="text-xs text-ink-muted">{label}</p><strong className="text-xl">{count}</strong></div>)}</div><label className="flex min-h-12 items-center gap-3 rounded-control border border-warning/30 bg-warning/10 p-3 text-sm"><input type="checkbox" checked={overwrite} onChange={(event) => setOverwrite(event.target.checked)}/><span><strong>{vi.admin.overwrite}</strong><br/>Chỉ bật khi bạn chủ động muốn cập nhật dữ liệu đã duyệt.</span></label><div className="max-h-[50vh] overflow-auto rounded-control border border-line"><table className="w-full min-w-[650px] text-left text-sm"><thead className="sticky top-0 bg-bg"><tr><th className="p-3">Dòng</th><th>Slug</th><th>Kiểm tra</th><th>Hành động</th><th>Lý do / cảnh báo</th></tr></thead><tbody>{preview.data.rows.map((row) => <tr key={row.line} className={`border-t border-line ${row.status === 'error' ? 'bg-danger/5' : row.status === 'warning' ? 'bg-warning/10' : ''}`}><td className="p-3">{row.line}</td><td>{row.slug ?? '—'}</td><td>{row.status === 'valid' ? 'Hợp lệ' : row.status === 'warning' ? 'Cảnh báo' : 'Lỗi'}</td><td>{row.action === 'create' ? 'Tạo mới' : row.action === 'update' ? 'Cập nhật' : 'Bỏ qua'}</td><td>{row.messages.length ? row.messages.join(' · ') : '—'}</td></tr>)}</tbody></table></div><div className="flex flex-wrap justify-between gap-2"><button className="admin-button border border-line bg-white text-ink" onClick={() => setStep('upload')}>Chọn tệp khác</button><button className="admin-button" disabled={commit.isPending || preview.data.summary.valid + preview.data.summary.warnings === 0} onClick={() => commit.mutate()}>{commit.isPending ? 'Đang import…' : vi.admin.commit}</button></div></section>}
    {step === 'result' && commit.data && <section className="space-y-4 rounded-card border border-line bg-surface p-5 shadow-card"><h2 className="font-serif text-2xl">Đã xử lý tệp CSV</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Tạo mới', commit.data.created], ['Cập nhật', commit.data.updated], ['Bỏ qua', commit.data.skipped], ['Lỗi', commit.data.errors.length]].map(([label, count]) => <div key={String(label)} className="rounded-control bg-bg p-4"><p className="text-sm text-ink-muted">{label}</p><strong className="text-2xl">{count}</strong></div>)}</div>{commit.data.errors.length > 0 && <button className="min-h-11 rounded-control border border-line px-4 font-semibold text-primary" onClick={downloadErrors}>Tải CSV các dòng lỗi</button>}<div className="flex flex-wrap gap-3"><Link className="admin-button inline-flex items-center" to={`${paths.adminPlaces}?status=draft`}>Xem địa điểm nháp</Link><button className="admin-button border border-line bg-white text-ink" onClick={() => { setStep('upload'); setCsv(''); setFilename('') }}>Import tệp khác</button></div></section>}
  </section>
}
