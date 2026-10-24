export const paths = {
  home: '/', explore: '/explore', place: (slug: string) => `/place/${encodeURIComponent(slug)}`,
  placePattern: '/place/:slug', map: '/map', about: '/about', privacy: '/privacy',
  planNew: '/plan/new', planGenerating: '/plan/generating', tripDraft: '/trip/draft',
  trip: (id: string) => `/trip/${encodeURIComponent(id)}`, tripPattern: '/trip/:id',
  sharedTrip: (token: string) => `/s/${encodeURIComponent(token)}`, sharedTripPattern: '/s/:shareToken',
  login: '/login', register: '/register', forgotPassword: '/forgot-password',
  resetPassword: '/reset-password', authCallback: '/auth/callback', account: '/account',
  accountTrips: '/account/trips', accountSaved: '/account/saved', accountSettings: '/account/settings',
  admin: '/admin', adminPlaces: '/admin/places', adminPlaceNew: '/admin/places/new',
  adminPlace: (id: string) => `/admin/places/${encodeURIComponent(id)}`,
  adminPlacePattern: '/admin/places/:id', adminImport: '/admin/import', forbidden: '/403',
} as const

export function safeNextPath(next: string | null, fallback = paths.accountTrips): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('://') || next.includes('\\')) return fallback
  return next
}
