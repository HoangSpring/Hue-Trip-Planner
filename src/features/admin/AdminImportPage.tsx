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

  const preview = useMutation({
    mutationFn: (value: string) => previewPlaceCsv(value, token),
    onSuccess: () => {
      setStep('preview')
      setError('')
    },
    onError: reason => {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Không xem trước được tệp CSV.',
      )
    },
  })

  const commit = useMutation({
    mutationFn: () => commitPlaceCsv(csv, overwrite, token),
    onSuccess: () => {
      setStep('result')
      setError('')
    },
    onError: reason => {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Không import được tệp CSV.',
      )
    },
  })

  const loadFile = async (file?: File) => {
    if (!file) return

    if (
      !file.name.toLowerCase().endsWith('.csv') ||
      file.size > 2 * 1024 * 1024
    ) {
      setError('Chọn tệp CSV không quá 2 MB.')
      return
    }

    try {
      setCsv(await file.text())
      setFilename(file.name)
      setStep('upload')
      setError('')
    } catch {
      setError('Không đọc được tệp. Hãy chọn tệp CSV mã hóa UTF-8.')
    }
  }

  const downloadErrors = () => {
    const blob = new Blob(
      ['\uFEFF', commit.data?.errorCsv ?? ''],
      { type: 'text/csv;charset=utf-8' },
    )

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = 'places-import-errors.csv'
    anchor.click()

    URL.revokeObjectURL(url)
  }

  const steps: { key: Step; title: string; description: string }[] = [
    {
      key: 'upload',
      title: 'Tải CSV',
      description: 'Chọn tệp dữ liệu',
    },
    {
      key: 'preview',
      title: 'Xem trước',
      description: 'Kiểm tra nội dung',
    },
    {
      key: 'result',
      title: 'Kết quả',
      description: 'Xem dữ liệu đã xử lý',
    },
  ]

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-line bg-surface p-6">
        <p className="text-sm font-semibold text-secondary">
          {vi.layout.admin}
        </p>

        <h1 className="mt-2 font-serif text-3xl font-bold text-ink">
          {vi.admin.importTitle}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
          Nhập danh sách địa điểm bằng tệp CSV. Hệ thống sẽ kiểm tra dữ liệu
          trước khi import để bạn có thể xem và xử lý các dòng không hợp lệ.
        </p>

        <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-4">
          <p className="text-sm leading-6 text-ink">
            <strong>Lưu ý:</strong> Địa điểm đã duyệt được giữ nguyên theo mặc
            định. Chỉ bật ghi đè khi bạn thực sự muốn cập nhật dữ liệu đã duyệt.
          </p>
        </div>
      </header>

      <nav aria-label="Các bước import">
        <ol className="grid gap-3 sm:grid-cols-3">
          {steps.map((item, index) => {
            const active = step === item.key
            const completed =
              steps.findIndex(current => current.key === step) > index

            return (
              <li
                key={item.key}
                aria-current={active ? 'step' : undefined}
                className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${active
                    ? 'border-primary bg-primary-tint'
                    : 'border-line bg-surface'
                  }`}
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${active
                      ? 'bg-primary text-white'
                      : completed
                        ? 'bg-success/10 text-success'
                        : 'bg-surface-high text-ink-muted'
                    }`}
                >
                  {completed ? '✓' : index + 1}
                </span>

                <span className="min-w-0">
                  <span
                    className={`block text-sm font-semibold ${active ? 'text-primary' : 'text-ink'
                      }`}
                  >
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs text-ink-muted">
                    {item.description}
                  </span>
                </span>
              </li>
            )
          })}
        </ol>
      </nav>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4"
        >
          <span className="font-bold text-danger" aria-hidden="true">
            !
          </span>
          <p className="text-sm leading-6 text-danger">{error}</p>
        </div>
      )}

      {step === 'upload' && (
        <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <div className="border-b border-line p-5">
            <h2 className="font-semibold text-ink">Tải lên dữ liệu</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Hỗ trợ tệp CSV có dung lượng tối đa 2 MB.
            </p>
          </div>

          <div className="space-y-5 p-5">
            <div
              className="rounded-xl border-2 border-dashed border-line bg-bg px-5 py-10 text-center transition-colors hover:border-primary/50"
              onDragOver={event => event.preventDefault()}
              onDrop={event => {
                event.preventDefault()
                void loadFile(event.dataTransfer.files[0])
              }}
            >
              <div
                className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-tint text-2xl text-primary"
                aria-hidden="true"
              >
                ↑
              </div>

              <h3 className="mt-4 font-semibold text-ink">
                Kéo và thả tệp CSV vào đây
              </h3>

              <p className="mt-2 text-sm text-ink-muted">
                Hoặc chọn tệp từ thiết bị của bạn
              </p>

              <button
                type="button"
                className="admin-button mt-4"
                onClick={() => inputRef.current?.click()}
              >
                {vi.admin.chooseFile}
              </button>

              <input
                ref={inputRef}
                className="sr-only"
                type="file"
                accept=".csv,text/csv"
                onChange={event => {
                  void loadFile(event.target.files?.[0])
                  event.target.value = ''
                }}
              />

              {filename && (
                <div className="mx-auto mt-5 flex max-w-md items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-sm font-bold text-success"
                    aria-hidden="true"
                  >
                    CSV
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {filename}
                    </p>
                    <p className="mt-1 text-xs text-success">
                      Đã đọc tệp thành công
                    </p>
                  </div>

                  <button
                    type="button"
                    className="rounded-lg px-3 py-2 text-xs font-medium text-ink-muted hover:bg-surface-high hover:text-ink"
                    onClick={() => {
                      setCsv('')
                      setFilename('')
                      setError('')
                    }}
                  >
                    Xóa
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <a
                className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4"
                href={sampleCsvUrl}
                download="places.sample.csv"
              >
                Tải CSV mẫu
              </a>

              <button
                type="button"
                className="admin-button min-h-11"
                disabled={!csv || preview.isPending}
                onClick={() => preview.mutate(csv)}
              >
                {preview.isPending
                  ? 'Đang kiểm tra dữ liệu...'
                  : vi.admin.preview}
              </button>
            </div>
          </div>
        </section>
      )}

      {step === 'preview' && preview.data && (
        <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <div className="border-b border-line p-5">
            <h2 className="font-semibold text-ink">Kiểm tra dữ liệu</h2>
            <p className="mt-1 break-all text-sm text-ink-muted">
              Tệp: {filename || 'CSV đã tải lên'}
            </p>
          </div>

          <div className="space-y-5 p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: 'Tổng dòng',
                  count: preview.data.summary.total,
                  style: 'bg-surface-high text-ink',
                },
                {
                  label: 'Hợp lệ',
                  count: preview.data.summary.valid,
                  style: 'bg-success/10 text-success',
                },
                {
                  label: 'Cảnh báo',
                  count: preview.data.summary.warnings,
                  style: 'bg-warning/10 text-ink',
                },
                {
                  label: 'Lỗi',
                  count: preview.data.summary.errors,
                  style: 'bg-danger/10 text-danger',
                },
              ].map(item => (
                <div
                  key={item.label}
                  className={`rounded-xl p-4 ${item.style}`}
                >
                  <p className="text-sm opacity-80">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums">
                    {item.count}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 accent-current"
                  checked={overwrite}
                  onChange={event => setOverwrite(event.target.checked)}
                />

                <span className="text-sm leading-6 text-ink">
                  <strong className="block">{vi.admin.overwrite}</strong>
                  <span className="mt-1 block text-ink-muted">
                    Chỉ bật khi bạn chủ động muốn cập nhật dữ liệu địa điểm đã
                    duyệt.
                  </span>
                </span>
              </label>
            </div>

            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-ink">Chi tiết từng dòng</h3>
                <p className="text-xs text-ink-muted">
                  {preview.data.rows.length} dòng hiển thị
                </p>
              </div>

              <div className="max-h-[50vh] overflow-auto rounded-xl border border-line">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-surface-high text-xs uppercase tracking-wide text-ink-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Dòng
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Slug
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Trạng thái
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Hành động
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Lý do / cảnh báo
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-line">
                    {preview.data.rows.map(row => (
                      <tr
                        key={row.line}
                        className={`transition-colors hover:bg-surface-high/40 ${row.status === 'error'
                            ? 'bg-danger/5'
                            : row.status === 'warning'
                              ? 'bg-warning/10'
                              : ''
                          }`}
                      >
                        <td className="px-4 py-3 tabular-nums text-ink-muted">
                          {row.line}
                        </td>

                        <td className="px-4 py-3 font-medium text-ink">
                          {row.slug ?? '—'}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === 'valid'
                                ? 'bg-success/10 text-success'
                                : row.status === 'warning'
                                  ? 'bg-warning/20 text-ink'
                                  : 'bg-danger/10 text-danger'
                              }`}
                          >
                            {row.status === 'valid'
                              ? 'Hợp lệ'
                              : row.status === 'warning'
                                ? 'Cảnh báo'
                                : 'Lỗi'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-ink">
                          {row.action === 'create'
                            ? 'Tạo mới'
                            : row.action === 'update'
                              ? 'Cập nhật'
                              : 'Bỏ qua'}
                        </td>

                        <td className="max-w-sm whitespace-normal px-4 py-3 leading-6 text-ink-muted">
                          {row.messages.length
                            ? row.messages.join(' · ')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className="admin-button min-h-11 border border-line bg-surface text-ink"
                onClick={() => {
                  setStep('upload')
                  setError('')
                }}
              >
                Chọn tệp khác
              </button>

              <button
                type="button"
                className="admin-button min-h-11"
                disabled={
                  commit.isPending ||
                  preview.data.summary.valid +
                  preview.data.summary.warnings ===
                  0
                }
                onClick={() => commit.mutate()}
              >
                {commit.isPending ? 'Đang import...' : vi.admin.commit}
              </button>
            </div>
          </div>
        </section>
      )}

      {step === 'result' && commit.data && (
        <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <div className="border-b border-line p-6">
            <div className="flex size-12 items-center justify-center rounded-full bg-success/10 text-xl font-bold text-success">
              ✓
            </div>

            <h2 className="mt-4 font-serif text-2xl font-bold text-ink">
              Đã xử lý tệp CSV
            </h2>

            <p className="mt-2 text-sm leading-6 text-ink-muted">
              Hệ thống đã hoàn tất quá trình xử lý. Kiểm tra số liệu bên dưới
              để biết kết quả import.
            </p>
          </div>

          <div className="space-y-5 p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: 'Tạo mới',
                  count: commit.data.created,
                  style: 'bg-success/10 text-success',
                },
                {
                  label: 'Cập nhật',
                  count: commit.data.updated,
                  style: 'bg-primary-tint text-primary',
                },
                {
                  label: 'Bỏ qua',
                  count: commit.data.skipped,
                  style: 'bg-surface-high text-ink',
                },
                {
                  label: 'Lỗi',
                  count: commit.data.errors.length,
                  style: 'bg-danger/10 text-danger',
                },
              ].map(item => (
                <div
                  key={item.label}
                  className={`rounded-xl p-4 ${item.style}`}
                >
                  <p className="text-sm">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums">
                    {item.count}
                  </p>
                </div>
              ))}
            </div>

            {commit.data.errors.length > 0 && (
              <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
                <p className="font-semibold text-ink">
                  Có {commit.data.errors.length} lỗi cần kiểm tra
                </p>
                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  Tải danh sách các dòng lỗi để xem lại và chỉnh sửa trước khi
                  import lại.
                </p>

                <button
                  type="button"
                  className="mt-4 min-h-11 rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-primary transition hover:bg-surface-high"
                  onClick={downloadErrors}
                >
                  Tải CSV các dòng lỗi
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                className="admin-button inline-flex min-h-11 items-center justify-center"
                to={`${paths.adminPlaces}?status=draft`}
              >
                Xem địa điểm nháp
              </Link>

              <button
                type="button"
                className="admin-button min-h-11 border border-line bg-surface text-ink"
                onClick={() => {
                  setStep('upload')
                  setCsv('')
                  setFilename('')
                  setOverwrite(false)
                  setError('')
                }}
              >
                Import tệp khác
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
