import { describe, expect, it } from 'vitest'
import { authErrorMessage, safeAuthErrorDetails } from './authError'

describe('authErrorMessage', () => {
  it.each([
    ['email_address_not_authorized', 'Hệ thống chưa gửi được email xác nhận lúc này. Thử lại sau ít phút.'],
    ['over_email_send_rate_limit', 'Hệ thống chưa gửi được email xác nhận lúc này. Thử lại sau ít phút.'],
    ['weak_password', 'Mật khẩu chưa đủ mạnh. Hãy dùng ít nhất 8 ký tự, có chữ và số.'],
    ['signup_disabled', 'Hiện chưa mở đăng ký tài khoản mới.'],
    ['invalid_credentials', 'Email hoặc mật khẩu chưa đúng.'],
    ['email_not_confirmed', 'Bạn cần xác nhận email trước khi đăng nhập.'],
  ])('maps %s to a safe Vietnamese message', (code, message) => {
    expect(authErrorMessage({ code })).toBe(message)
  })

  it('supports error_code and uses a generic message for unknown codes', () => {
    expect(authErrorMessage({ error_code: 'unknown', message: 'user@example.test exists' })).toBe('Chưa thể xử lý yêu cầu lúc này. Bạn thử lại sau nhé.')
  })

  it('uses a network message for rejected requests and never exposes personal details', () => {
    expect(authErrorMessage(new TypeError('Failed to fetch; user@example.test'), true)).toBe('Không kết nối được. Kiểm tra mạng rồi thử lại.')
    expect(safeAuthErrorDetails({ code: 'invalid_credentials', status: 400, email: 'user@example.test', password: 'hidden' })).toEqual({ code: 'invalid_credentials', status: 400 })
  })
})
