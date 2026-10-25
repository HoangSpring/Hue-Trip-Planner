import { vi } from '@/lib/strings/vi'

export function ImageCredit({ credit, license, sourceUrl, placeholder = false }: { credit: string | null; license: string | null; sourceUrl?: string | null; placeholder?: boolean }) {
  if (!credit && !license && placeholder) return <p className="px-3 py-2 text-xs text-ink-muted">{vi.explore.placeholderCredit}</p>
  if (!credit && !license) return <p className="px-3 py-2 text-xs text-warning">Chưa có thông tin ghi công ảnh</p>
  const caption = `${vi.components.imageCredit}: ${credit ?? 'Không rõ'}${license ? ` · ${license}` : ''}`
  return <p className="px-3 py-2 text-xs leading-5 text-ink-muted">{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2">{caption}</a> : caption}</p>
}
