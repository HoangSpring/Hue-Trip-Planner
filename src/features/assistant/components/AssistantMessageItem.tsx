import { Link } from 'react-router-dom'
import type { AssistantAction } from '../services/assistantKnowledge'

interface AssistantMessageItemProps {
  text: string
  actions?: AssistantAction[]
  onActionClick?: (action: AssistantAction) => void
}

/**
 * Parses simple markdown (bold **text**, italic *text*, linebreaks, lists)
 * and renders action buttons or links.
 */
export function AssistantMessageItem({ text, actions, onActionClick }: AssistantMessageItemProps) {
  const lines = text.split('\n')

  const renderFormattedLine = (line: string, index: number) => {
    // Basic regex for **bold** and *italic*
    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g)

    const rendered = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="font-semibold text-ink">{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={pIdx} className="italic text-ink-muted">{part.slice(1, -1)}</em>
      }
      return part
    })

    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      return (
        <li key={index} className="ml-4 list-disc text-sm text-ink leading-relaxed">
          {rendered}
        </li>
      )
    }

    if (/^\d+\.\s/.test(line.trim())) {
      return (
        <li key={index} className="ml-4 list-decimal text-sm text-ink leading-relaxed">
          {rendered}
        </li>
      )
    }

    if (!line.trim()) {
      return <div key={index} className="h-1.5" />
    }

    return (
      <p key={index} className="text-sm text-ink leading-relaxed">
        {rendered}
      </p>
    )
  }

  return (
    <div className="space-y-1">
      <div className="space-y-0.5">
        {lines.map((line, idx) => renderFormattedLine(line, idx))}
      </div>

      {actions && actions.length > 0 && (
        <div className="pt-2 flex flex-wrap gap-1.5">
          {actions.map((act, i) => {
            if (act.to) {
              return (
                <Link
                  key={i}
                  to={act.to}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary-tint/70 text-primary hover:bg-primary-tint rounded-full border border-primary/20 transition-colors"
                  onClick={() => onActionClick?.(act)}
                >
                  {act.label}
                </Link>
              )
            }
            return (
              <button
                key={i}
                type="button"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-900 hover:bg-amber-100 rounded-full border border-amber-200 transition-colors cursor-pointer"
                onClick={() => onActionClick?.(act)}
              >
                {act.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
