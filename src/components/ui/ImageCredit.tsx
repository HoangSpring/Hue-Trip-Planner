import { vi } from '@/lib/strings/vi'

export function ImageCredit({ credit, license, sourceUrl, placeholder = false }: { credit: string | null; license: string | null; sourceUrl?: string | null; placeholder?: boolean }) {
  if (!credit && !license && placeholder) return <p className="px-3 py-2 text-xs text-ink-muted">{vi.explore.placeholderCredit}</p>
  const caption = `${vi.components.imageCredit}: ${credit ?? vi.components.unknownPhotoCredit} · ${license ?? vi.components.unknownPhotoLicense}`
  const className = `px-3 py-2 text-xs leading-5 ${!credit || !license ? 'text-warning' : 'text-ink-muted'}`
  return <p className={className}>{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2">{caption}</a> : caption}</p>
}
