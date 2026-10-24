import { describe, expect, it } from 'vitest'
import { tripInputSchema, type TripInput } from './tripInput'

const validInput = {
  numDays: 2,
  startDate: '2026-12-20',
  companion: 'couple',
  groupSize: 2,
  interests: ['heritage', 'cuisine', 'river'],
  pace: 'moderate',
  budget: 'mid',
  transport: 'motorbike',
  start: { label: 'Gần Đại Nội', lat: 16.4698, lng: 107.5786 },
  notes: 'Muốn dậy muộn',
} satisfies TripInput

describe('tripInputSchema', () => {
  it('accepts a valid wizard input', () => {
    expect(tripInputSchema.safeParse(validInput).success).toBe(true)
  })

  it.each([0, 6, 1.5])('rejects invalid numDays %s', (numDays) => {
    expect(tripInputSchema.safeParse({ ...validInput, numDays }).success).toBe(false)
  })

  it('requires between two and six interests', () => {
    expect(tripInputSchema.safeParse({ ...validInput, interests: ['heritage'] }).success).toBe(false)
    expect(tripInputSchema.safeParse({ ...validInput, interests: Array.from({ length: 7 }, () => 'heritage') }).success).toBe(false)
  })

  it('limits notes to 300 characters', () => {
    expect(tripInputSchema.safeParse({ ...validInput, notes: 'a'.repeat(301) }).success).toBe(false)
  })

  it('rejects invalid dates and unknown fields', () => {
    expect(tripInputSchema.safeParse({ ...validInput, startDate: '2026-02-30' }).success).toBe(false)
    expect(tripInputSchema.safeParse({ ...validInput, unexpected: true }).success).toBe(false)
  })
})
