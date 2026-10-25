import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router-dom'
import type { SupabaseClient } from '@supabase/supabase-js'
import { uuidSchema } from '@shared/schemas'
import { AuthProvider } from './authState'
import { RequireAdmin } from './guards/RequireAdmin'
import { RequireAuth } from './guards/RequireAuth'
import { RequireGuest } from './guards/RequireGuest'
import { RequireTripDraft, RequireWizardDraft } from './guards/StoredDraftGuards'
import { AccountLayout } from './layouts/AccountLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { FlowLayout } from './layouts/FlowLayout'
import { PublicLayout } from './layouts/PublicLayout'
import { TripLayout } from './layouts/TripLayout'
import { paths } from './paths'
import { ErrorPage } from '@/features/static/ErrorPage'
import { ForbiddenPage } from '@/features/static/ForbiddenPage'
import { NotFoundPage } from '@/features/static/NotFoundPage'
import { vi } from '@/lib/strings/vi'
import { supabaseClient } from '@/lib/supabase'

const PlaceholderPage = lazy(() => import('@/features/static/PlaceholderPage'))
const ExplorePage = lazy(() => import('@/features/explore/ExplorePage'))
const ComponentGalleryPage = lazy(() => import('@/features/dev/ComponentGalleryPage').then(module => ({ default: module.ComponentGalleryPage })))
const DevAuthPage = lazy(() => import('@/features/dev/DevAuthPage'))
const loading = <p className="p-8 text-center text-ink-muted" role="status">{vi.system.loading}</p>
const page = (title: string, noindex = false) => <Suspense fallback={loading}><PlaceholderPage title={title} noindex={noindex} /></Suspense>

function TripIdPage() {
  const { id = '' } = useParams()
  return uuidSchema.safeParse(id).success ? page(vi.pages.trip, true) : <NotFoundPage />
}

export const routePaths = [
  paths.home, paths.explore, paths.placePattern, paths.map, paths.about, paths.privacy,
  paths.planNew, paths.planGenerating, paths.tripDraft, paths.tripPattern, paths.sharedTripPattern,
  paths.login, paths.register, paths.forgotPassword, paths.resetPassword, paths.authCallback,
  paths.account, paths.accountTrips, paths.accountSaved, paths.accountSettings,
  paths.admin, paths.adminPlaces, paths.adminPlaceNew, paths.adminPlacePattern, paths.adminImport,
  paths.devComponents, paths.devAuth, paths.forbidden, '*',
]

export function createAppRoutes(authClient: SupabaseClient | null = supabaseClient) {
  return [{
  element: <AuthProvider client={authClient}><Outlet /></AuthProvider>, errorElement: <ErrorPage />,
  children: [
    { element: <PublicLayout />, children: [
      { index: true, element: page(vi.pages.home) },
      { path: paths.explore, element: <Suspense fallback={loading}><ExplorePage /></Suspense> },
      { path: paths.placePattern, element: page(vi.pages.place) },
      { path: paths.map, element: page(vi.pages.map) },
      { path: paths.about, element: page(vi.pages.about) },
      { path: paths.privacy, element: page(vi.pages.privacy) },
      ...(import.meta.env.DEV ? [
        { path: paths.devComponents, element: <Suspense fallback={loading}><ComponentGalleryPage /></Suspense> },
        { path: paths.devAuth, element: <Suspense fallback={loading}><DevAuthPage /></Suspense> },
      ] : []),
    ] },
    { element: <FlowLayout />, children: [
      { path: paths.planNew, element: page(vi.pages.plan) },
      { path: paths.planGenerating, element: <RequireWizardDraft />, children: [{ index: true, element: page(vi.pages.generating, true) }] },
    ] },
    { element: <TripLayout />, children: [
      { path: paths.tripDraft, element: <RequireTripDraft />, children: [{ index: true, element: page(vi.pages.draft, true) }] },
      { path: paths.tripPattern, element: <RequireAuth />, children: [{ index: true, element: <TripIdPage /> }] },
      { path: paths.sharedTripPattern, element: page(vi.pages.sharedTrip, true) },
    ] },
    { element: <AuthLayout />, children: [
      { element: <RequireGuest />, children: [
        { path: paths.login, element: page(vi.pages.login, true) },
        { path: paths.register, element: page(vi.pages.register, true) },
        { path: paths.forgotPassword, element: page(vi.pages.forgotPassword, true) },
      ] },
      { path: paths.resetPassword, element: page(vi.pages.resetPassword, true) },
      { path: paths.authCallback, element: page(vi.pages.authCallback, true) },
    ] },
    { path: paths.account, element: <RequireAuth />, children: [{ element: <AccountLayout />, children: [
      { index: true, element: <Navigate to={paths.accountTrips} replace /> },
      { path: paths.accountTrips, element: page(vi.pages.trips, true) },
      { path: paths.accountSaved, element: page(vi.pages.saved, true) },
      { path: paths.accountSettings, element: page(vi.pages.accountSettings, true) },
    ] }] },
    { path: paths.admin, element: <RequireAdmin />, children: [{ element: <AdminLayout />, children: [
      { index: true, element: <Navigate to={paths.adminPlaces} replace /> },
      { path: paths.adminPlaces, element: page(vi.pages.places, true) },
      { path: paths.adminPlaceNew, element: page(vi.pages.addPlace, true) },
      { path: paths.adminPlacePattern, element: page(vi.pages.editPlace, true) },
      { path: paths.adminImport, element: page(vi.pages.csvImport, true) },
    ] }] },
    { path: paths.forbidden, element: <ForbiddenPage /> },
    { path: '*', element: <NotFoundPage /> },
  ],
}]
}

export const router = createBrowserRouter(createAppRoutes())
