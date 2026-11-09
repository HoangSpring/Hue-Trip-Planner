
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  placeStatusSchema,
  tripInputSchema,
  tripSchema,
  type Trip,
} from '@shared/schemas'
import type { Database, Json, Tables } from '../../src/types/supabase'
import { mapPlaceSummary, type PlaceTag } from '../mappers/place'
import type { TripPlace, TripRepository } from './tripService'
import { AppError } from '../lib/errors'

type TripRow = Tables<'trips'>
type DayRow = Tables<'trip_days'>
type ItemRow = Tables<'trip_items'>

type TripItemPlace = Trip['days'][number]['items'][number]['place']

type PlaceTagRow = {
  id: string
  slug: string
  name: string
}

type PlaceTagLinkRow = {
  place_id: string
  tag_id: string
}

const createTripResultSchema = z
  .object({
    id: z.string().uuid(),
    created: z.boolean(),
  })
  .strict()

function jsonValue(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json
}

export class TripRepositoryError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'TripRepositoryError'
  }
}

function assertNoError(
  error: { code: string; message: string } | null,
): void {
  if (!error) return

  if (/^PT(?:409|404|422|401)$/.test(error.code)) {
    throw new TripRepositoryError(error.code, error.message)
  }

  if (['23505', '23503', '23514'].includes(error.code)) {
    throw new TripRepositoryError(error.code, error.message)
  }

  throw new AppError(
    503,
    'SERVICE_UNAVAILABLE',
    'Dịch vụ chuyến đi chưa sẵn sàng.',
  )
}

export class SupabaseTripRepository implements TripRepository {
  constructor(private readonly client: SupabaseClient<Database>) { }

  async list(): Promise<Trip[]> {
    const { data, error } = await this.client
      .from('trips')
      .select('*')
      .order('updated_at', { ascending: false })

    assertNoError(error)

    const trips = await Promise.all(
      (data ?? []).map((row: TripRow) => this.get(row.id)),
    )

    return trips.filter((trip): trip is Trip => trip !== null)
  }

  async get(id: string): Promise<Trip | null> {
    const { data: row, error } = await this.client
      .from('trips')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    assertNoError(error)

    if (!row) return null

    const [
      { data: dayRows, error: dayError },
      { data: itemRows, error: itemError },
    ] = await Promise.all([
      this.client
        .from('trip_days')
        .select('*')
        .eq('trip_id', id)
        .order('day_index'),
      this.client
        .from('trip_items')
        .select('*')
        .eq('trip_id', id)
        .order('position'),
    ])

    assertNoError(dayError)
    assertNoError(itemError)

    const days: DayRow[] = (dayRows ?? []) as DayRow[]
    const items: ItemRow[] = (itemRows ?? []) as ItemRow[]

    const placeIds: string[] = [
      ...new Set(
        items.map((item: ItemRow) => item.place_id),
      ),
    ]

    const { data: placeRows, error: placeError } = placeIds.length
      ? await this.client
        .from('places')
        .select('*')
        .in('id', placeIds)
      : { data: [], error: null }

    assertNoError(placeError)

    const { data: links, error: linksError } = placeIds.length
      ? await this.client
        .from('place_tags')
        .select('place_id,tag_id')
        .in('place_id', placeIds)
      : { data: [], error: null }

    assertNoError(linksError)

    const typedLinks: PlaceTagLinkRow[] =
      (links ?? []) as PlaceTagLinkRow[]

    const tagIds: string[] = [
      ...new Set(
        typedLinks.map(
          (link: PlaceTagLinkRow) => link.tag_id,
        ),
      ),
    ]

    const { data: tagRows, error: tagsError } = tagIds.length
      ? await this.client
        .from('tags')
        .select('id,slug,name')
        .in('id', tagIds)
      : { data: [], error: null }

    assertNoError(tagsError)

    const typedTags: PlaceTagRow[] =
      (tagRows ?? []) as PlaceTagRow[]

    const tagsById = new Map<string, PlaceTag>(
      typedTags.map(
        (tag: PlaceTagRow): [string, PlaceTag] => [
          tag.id,
          {
            slug: tag.slug,
            name: tag.name,
          },
        ],
      ),
    )

    const tagsByPlace = new Map<string, PlaceTag[]>()

    for (const link of typedLinks) {
      const tag = tagsById.get(link.tag_id)

      if (tag) {
        const currentTags =
          tagsByPlace.get(link.place_id) ?? []

        tagsByPlace.set(link.place_id, [
          ...currentTags,
          tag,
        ])
      }
    }

    const typedPlaces = (placeRows ?? []) as Tables<'places'>[]

    const placeMap = new Map<string, TripItemPlace>(
      typedPlaces.map(
        (place): [string, TripItemPlace] => [
          place.id,
          mapPlaceSummary(
            place,
            tagsByPlace.get(place.id) ?? [],
          ),
        ],
      ),
    )

    const mappedDays = days.map((day: DayRow) =>
      mapDay(
        day,
        items.filter(
          (item: ItemRow) => item.trip_day_id === day.id,
        ),
        placeMap,
      ),
    )

    return mapTrip(row, mappedDays)
  }

  async findByClientDraftId(id: string): Promise<Trip | null> {
    const { data, error } = await this.client
      .from('trips')
      .select('id')
      .eq('client_draft_id', id)
      .maybeSingle()

    assertNoError(error)

    return data ? this.get(data.id) : null
  }

  async getPlaces(ids: string[]): Promise<TripPlace[]> {
    if (!ids.length) return []

    const { data, error } = await this.client
      .from('places')
      .select('id,status,lat,lng')
      .in('id', ids)

    assertNoError(error)

    return (data ?? []).map((row) => ({
      id: row.id,
      status: placeStatusSchema.parse(row.status),
      lat: row.lat,
      lng: row.lng,
    }))
  }

  async count(): Promise<number> {
    const { count, error } = await this.client
      .from('trips')
      .select('id', { count: 'exact', head: true })

    assertNoError(error)

    return count ?? 0
  }

  async create(
    payload: unknown,
  ): Promise<{ id: string; created: boolean }> {
    const { data, error } = await this.client.rpc(
      'create_trip_from_payload',
      {
        p_payload: jsonValue(payload),
      },
    )

    assertNoError(error)

    return createTripResultSchema.parse(data)
  }

  async save(
    id: string,
    payload: unknown,
    expectedUpdatedAt: string,
  ): Promise<void> {
    const { error } = await this.client.rpc('save_trip', {
      p_trip_id: id,
      p_payload: jsonValue(payload),
      p_expected_updated_at: expectedUpdatedAt,
    })

    assertNoError(error)
  }

  async delete(id: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('trips')
      .delete()
      .eq('id', id)
      .select('id')

    assertNoError(error)

    return (data?.length ?? 0) > 0
  }
}

function mapTrip(row: TripRow, days: Trip['days']): Trip {
  const input = tripInputSchema.parse(row.input)

  return tripSchema.parse({
    id: row.id,
    clientDraftId: row.client_draft_id,
    title: row.title,
    startDate: row.start_date,
    numDays: row.num_days,
    input,
    generatedBy: row.generated_by,
    llmModel: row.llm_model,
    start: input.start,
    isShared: row.is_shared,
    shareToken: row.share_token,
    days,
    createdAt: row.created_at
      ? new Date(row.created_at).toISOString()
      : row.created_at,
    updatedAt: row.updated_at
      ? new Date(row.updated_at).toISOString()
      : row.updated_at,
  })
}

function mapDay(
  day: DayRow,
  items: ItemRow[],
  places: Map<string, TripItemPlace>,
): Trip['days'][number] {
  return {
    id: day.id,
    dayIndex: day.day_index,
    date: day.date,
    note: day.note,
    items: items.map((item: ItemRow) => ({
      id: item.id,
      placeId: item.place_id,
      place: places.get(item.place_id),
      position: item.position,
      slot:
        item.slot as Trip['days'][number]['items'][number]['slot'],
      startTime: item.start_time?.slice(0, 5) ?? null,
      durationMin: item.duration_min,
      travelMinFromPrev: item.travel_min_from_prev,
      travelDistanceM: item.travel_distance_m,
      reason: item.reason,
      note: item.note,
      isLocked: item.is_locked,
      addedBy:
        item.added_by as Trip['days'][number]['items'][number]['addedBy'],
    })),
  }
}
