import type { Slot } from '@shared/schemas'

const defaultStartTimes: Record<Slot, string> = {
  morning: '09:00',
  noon: '12:00',
  afternoon: '14:00',
  evening: '18:00',
}

export function defaultStartTimeForSlot(slot: Slot): string {
  return defaultStartTimes[slot]
}
