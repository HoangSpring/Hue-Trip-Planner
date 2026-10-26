import { placeListQuerySchema } from '@shared/schemas/placeQueries'

export function parseExploreQuery(search: string) {
  const params = new URLSearchParams(search)
  return placeListQuerySchema.safeParse({
    category: params.get('category') ?? undefined,
    tag: params.getAll('tag').length ? params.getAll('tag') : undefined,
    q: params.get('q') ?? undefined,
    sort: params.get('sort') ?? undefined,
    page: params.get('page') ?? undefined,
    pageSize: 24,
  })
}

export function normalizeHueSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi')
}
