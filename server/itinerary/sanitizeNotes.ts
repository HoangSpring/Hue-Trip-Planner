/** Removes control characters and markup-like fragments before notes enter a JSON user field. */
export function sanitizeNotes(notes: string | null | undefined): string | null {
  if (!notes) return null
  const cleaned = notes
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[`*_~#>\[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300)
    .trim()
  return cleaned || null
}
