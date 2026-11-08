import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { HelmetProvider } from 'react-helmet-async'
import PrivacyPage from './PrivacyPage'

describe('PrivacyPage required disclosure', () => {
  it('includes data types, purposes, retention, rights, processors, AI sharing and localStorage', () => {
    const helmetContext: Record<string, unknown> = {}
    const html = renderToStaticMarkup(<HelmetProvider context={helmetContext}><PrivacyPage /></HelmetProvider>)
    for (const phrase of ['email', 'tên hiển thị', 'lịch trình', 'địa điểm đã lưu', 'nhật ký kỹ thuật', '90 ngày', 'xóa chuyến đi', 'xóa tài khoản', 'Supabase', 'Vercel', 'OpenStreetMap', 'nhà cung cấp LLM', 'sở thích, ngày đi và phong cách', 'localStorage']) {
      expect(html).toContain(phrase)
    }
  })
})
