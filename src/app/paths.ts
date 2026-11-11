export const paths = {
  home: '/', explore: '/explore', place: (slug: string) => `/place/${encodeURIComponent(slug)}`,
  placePattern: '/place/:slug', map: '/map', about: '/about', privacy: '/privacy',
  planNew: '/plan/new', planGenerating: '/plan/generating', tripDraft: '/trip/draft',
  trip: (id: string) => `/trip/${encodeURIComponent(id)}`, tripPattern: '/trip/:id',
  sharedTrip: (token: string) => `/s/${encodeURIComponent(token)}`, sharedTripPattern: '/s/:shareToken',
  login: '/login', register: '/register', forgotPassword: '/forgot-password',
  resetPassword: '/reset-password', authCallback: '/auth/callback', account: '/account',
  accountTrips: '/account/trips', accountSaved: '/account/saved', accountSettings: '/account/settings',
  admin: '/admin', adminDashboard: '/admin/dashboard', adminUsers: '/admin/users', adminPlaces: '/admin/places', adminPlaceNew: '/admin/places/new',
  adminPlace: (id: string) => `/admin/places/${encodeURIComponent(id)}`,
  adminPlacePattern: '/admin/places/:id', adminImport: '/admin/import', forbidden: '/403',
  devComponents: '/dev/components', devAuth: '/dev/auth',
} as const

export function safeNextPath(next: string | null, fallback = paths.accountTrips): string {
  if (!next) return fallback
  const candidate = next.trim()
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('://') || candidate.includes('\\') || /[\u0000-\u001f\u007f]/.test(candidate)) return fallback
  try {
    const resolved = new URL(candidate, 'https://internal.invalid')
    return resolved.origin === 'https://internal.invalid' ? candidate : fallback
  } catch {
    return fallback
  }
}
