/** Calendar helpers use date-only UTC arithmetic and explicit Vietnam time. */
export function dateAtOffset(startDate: string, offset: number): string {
  const date = new Date(`${startDate}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

export function vietnamDate(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const part = (type: 'year' | 'month' | 'day') => parts.find((entry) => entry.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function isoWeekday(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const value = new Date(`${date}T00:00:00.000Z`)
  if (Number.isNaN(value.valueOf()) || value.toISOString().slice(0, 10) !== date) return null
  return value.getUTCDay() || 7
}
