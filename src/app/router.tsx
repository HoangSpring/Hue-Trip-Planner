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
const MapPage = lazy(() => import('@/features/map/MapPage'))
const PlacePage = lazy(() => import('@/features/place/PlacePage'))
const HomePage = lazy(() => import('@/features/home/HomePage'))
const TripWizardPage = lazy(() => import('@/features/trip-wizard/TripWizardPage'))
const GeneratingPage = lazy(() => import('@/features/trip-wizard/GeneratingPage'))
const TripEditorPage = lazy(() => import('@/features/trip-editor/TripEditorPage').then(module => ({ default: module.TripEditorPage })))
const ComponentGalleryPage = lazy(() => import('@/features/dev/ComponentGalleryPage').then(module => ({ default: module.ComponentGalleryPage })))
const DevAuthPage = lazy(() => import('@/features/dev/DevAuthPage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'))
const AuthCallbackPage = lazy(() => import('@/features/auth/pages/AuthCallbackPage'))
const MyTripsPage = lazy(() => import('@/features/account/MyTripsPage'))
const AccountSettingsPage = lazy(() => import('@/features/account/AccountSettingsPage'))
const SavedPlacesPage = lazy(() => import('@/features/saved/SavedPlacesPage'))
const SharedTripPage = lazy(() => import('@/features/share/SharedTripPage'))
const loading = <p className="p-8 text-center text-ink-muted" role="status">{vi.system.loading}</p>
const page = (title: string, noindex = false) => <Suspense fallback={loading}><PlaceholderPage title={title} noindex={noindex} /></Suspense>

function TripIdPage() {
  const { id = '' } = useParams()
  return uuidSchema.safeParse(id).success
    ? <Suspense fallback={loading}><TripEditorPage savedTripId={id} /></Suspense>
    : <NotFoundPage />
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
      { index: true, element: <Suspense fallback={loading}><HomePage /></Suspense> },
      { path: paths.explore, element: <Suspense fallback={loading}><ExplorePage /></Suspense> },
      { path: paths.placePattern, element: <Suspense fallback={loading}><PlacePage /></Suspense> },
      { path: paths.map, element: <Suspense fallback={loading}><MapPage /></Suspense> },
      { path: paths.about, element: page(vi.pages.about) },
      { path: paths.privacy, element: page(vi.pages.privacy) },
      ...(import.meta.env.DEV ? [
        { path: paths.devComponents, element: <Suspense fallback={loading}><ComponentGalleryPage /></Suspense> },
        { path: paths.devAuth, element: <Suspense fallback={loading}><DevAuthPage /></Suspense> },
      ] : []),
    ] },
    { element: <FlowLayout />, children: [
      { path: paths.planNew, element: <Suspense fallback={loading}><TripWizardPage /></Suspense> },
      { path: paths.planGenerating, element: <RequireWizardDraft />, children: [{ index: true, element: <Suspense fallback={loading}><GeneratingPage /></Suspense> }] },
    ] },
    { element: <TripLayout />, children: [
      { path: paths.tripDraft, element: <RequireTripDraft />, children: [{ index: true, element: <Suspense fallback={loading}><TripEditorPage /></Suspense> }] },
      { path: paths.tripPattern, element: <RequireAuth />, children: [{ index: true, element: <TripIdPage /> }] },
      { path: paths.sharedTripPattern, element: <Suspense fallback={loading}><SharedTripPage /></Suspense> },
    ] },
    { element: <AuthLayout />, children: [
      { element: <RequireGuest />, children: [
        { path: paths.login, element: <Suspense fallback={loading}><LoginPage /></Suspense> },
        { path: paths.register, element: <Suspense fallback={loading}><RegisterPage /></Suspense> },
        { path: paths.forgotPassword, element: <Suspense fallback={loading}><ForgotPasswordPage /></Suspense> },
      ] },
      { path: paths.resetPassword, element: <Suspense fallback={loading}><ResetPasswordPage /></Suspense> },
      { path: paths.authCallback, element: <Suspense fallback={loading}><AuthCallbackPage /></Suspense> },
    ] },
    { path: paths.account, element: <RequireAuth />, children: [{ element: <AccountLayout />, children: [
      { index: true, element: <Navigate to={paths.accountTrips} replace /> },
      { path: paths.accountTrips, element: <Suspense fallback={loading}><MyTripsPage /></Suspense> },
      { path: paths.accountSaved, element: <Suspense fallback={loading}><SavedPlacesPage /></Suspense> },
      { path: paths.accountSettings, element: <Suspense fallback={loading}><AccountSettingsPage /></Suspense> },
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
