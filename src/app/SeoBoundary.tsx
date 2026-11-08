import { useLocation, Outlet } from 'react-router-dom'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { brand } from '@/lib/brand'

const titles: Record<string, string> = {
  '/': brand.tagline,
  '/explore': 'Khám phá địa điểm Huế',
  '/map': 'Bản đồ địa điểm Huế',
  '/about': 'Về dự án',
  '/privacy': 'Chính sách bảo mật',
  '/login': 'Đăng nhập',
  '/register': 'Đăng ký',
  '/forgot-password': 'Quên mật khẩu',
  '/reset-password': 'Đặt lại mật khẩu',
  '/plan/new': 'Tạo lịch trình',
  '/plan/generating': 'Đang tạo lịch trình',
  '/trip/draft': 'Chỉnh sửa lịch trình',
  '/account': 'Tài khoản',
  '/trip': 'Chuyến đi',
  '/s': 'Lịch trình được chia sẻ',
  '/admin': 'Quản trị địa điểm',
}

export function routeSeo(pathname: string, search = ''): { title: string; robots: string; canonicalPath: string } {
  const segments = pathname.split('/').filter(Boolean)
  const fallbackTitle = segments[0] === 'account' ? titles['/account']
    : segments[0] === 'admin' ? titles['/admin']
      : segments[0] === 'trip' ? titles['/trip']
        : segments[0] === 's' ? titles['/s']
          : segments[0] === 'place' ? 'Địa điểm Huế' : brand.tagline
  const title = titles[pathname] ?? fallbackTitle
  const isPrivate = pathname.startsWith('/account') || pathname.startsWith('/trip') || pathname.startsWith('/plan/generating') || pathname.startsWith('/s/') || pathname.startsWith('/admin') || ['/login', '/register', '/forgot-password', '/reset-password', '/auth/callback', '/403'].includes(pathname)
  return { title: `${title} · ${brand.name}`, robots: isPrivate || (pathname === '/explore' && Boolean(search)) ? 'noindex,follow' : 'index,follow', canonicalPath: pathname === '/explore' ? '/explore' : pathname }
}

export function SeoBoundary() {
  const location = useLocation()
  const { title, robots, canonicalPath } = routeSeo(location.pathname, location.search)
  return <HelmetProvider>
    <>
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={brand.description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={`${window.location.origin}${canonicalPath}`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={brand.description} />
      <meta property="og:url" content={`${window.location.origin}${canonicalPath}`} />
      <meta property="og:image" content={`${window.location.origin}/og-hue.svg`} />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
    <Outlet />
    </>
  </HelmetProvider>
}
