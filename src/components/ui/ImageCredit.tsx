import { vi } from '@/lib/strings/vi'

export function ImageCredit({ credit, license, sourceUrl }: { credit: string | null; license: string | null; sourceUrl?: string | null }) {
  if (!credit && !license) return <p className="px-3 py-2 text-xs text-ink-muted">Ảnh giữ chỗ minh họa · Không phải ảnh địa điểm</p>
  const caption = `${vi.components.imageCredit}: ${credit ?? 'Không rõ'}${license ? ` · ${license}` : ''}`
  return <p className="px-3 py-2 text-xs leading-5 text-ink-muted">{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2">{caption}</a> : caption}</p>
}
