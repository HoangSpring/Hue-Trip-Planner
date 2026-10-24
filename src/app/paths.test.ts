import { describe, expect, it } from 'vitest'
import { paths, safeNextPath } from './paths'
import { routePaths } from './router'

describe('route paths', () => {
  it('keeps all documented MVP routes registered', () => {
    const documented = [
      paths.home, paths.explore, paths.placePattern, paths.map, paths.about, paths.privacy,
      paths.planNew, paths.planGenerating, paths.tripDraft, paths.tripPattern, paths.sharedTripPattern,
      paths.login, paths.register, paths.forgotPassword, paths.resetPassword, paths.authCallback,
      paths.account, paths.accountTrips, paths.accountSaved, paths.accountSettings,
      paths.admin, paths.adminPlaces, paths.adminPlaceNew, paths.adminPlacePattern, paths.adminImport, paths.forbidden,
    ]
    expect(routePaths).toEqual(expect.arrayContaining(documented))
  })

  it('allows only internal next paths', () => {
    expect(safeNextPath('/account/trips?tab=recent')).toBe('/account/trips?tab=recent')
    expect(safeNextPath(null)).toBe(paths.accountTrips)
    expect(safeNextPath('//example.com')).toBe(paths.accountTrips)
    expect(safeNextPath('/\\\\example.com')).toBe(paths.accountTrips)
    expect(safeNextPath('/https://example.com')).toBe(paths.accountTrips)
  })
})
