import type { Transport } from '@shared/schemas'
import { vi } from '@/lib/strings/vi'

interface TravelConnectorProps {
  travelMin: number | null
  travelDistanceM: number | null
  transport?: Transport | null
}

export function TravelConnector({
  travelMin,
  travelDistanceM,
  transport,
}: TravelConnectorProps) {
  if (travelMin == null || travelDistanceM == null) {
    return null
  }

  const transportIcon =
    transport === 'taxi' || transport === 'tour'
      ? '🚗'
      : transport === 'walk_bike'
      ? '🚶'
      : '🛵'

  return (
    <div className="relative pl-10 sm:pl-12 py-2">
      {/* Vertical dotted connector line */}
      <div className="absolute left-[19px] sm:left-[23px] top-0 bottom-0 w-0.5 bg-line-dark/60" />

      {/* Pill Badge */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-high border border-line px-3 py-1 text-xs text-ink-muted shadow-xs">
        <span aria-hidden="true" className="text-xs">{transportIcon}</span>
        <span className="font-medium text-ink">
          {vi.tripEditor.travelConnect(travelMin, travelDistanceM)}
        </span>
      </div>
    </div>
  )
}
