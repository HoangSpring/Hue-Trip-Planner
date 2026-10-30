import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({ signUp: vi.fn(), signIn: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabaseClient: { auth: { signUp: authMocks.signUp, signInWithPassword: authMocks.signIn } } }))

import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

function mount(element: React.ReactNode, entry: string) {
  const container = document.createElement('div')
  const root: Root = createRoot(container)
  act(() => root.render(<MemoryRouter initialEntries={[entry]}>{element}</MemoryRouter>))
  return { container, unmount: () => act(() => root.unmount()) }
}

function setInput(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  act(() => {
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function submit(container: HTMLElement) {
  await act(async () => {
    container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

describe('auth pages', () => {
  let warn: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    authMocks.signUp.mockReset()
    authMocks.signIn.mockReset()
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })
  afterEach(() => warn.mockRestore())

  it('shows a mapped signup error and keeps unsafe next destinations internal', async () => {
    authMocks.signUp.mockResolvedValue({ data: { session: null }, error: { code: 'signup_disabled', status: 400 } })
    const page = mount(<RegisterPage />, '/register?next=%2F%2Fevil.example')
    const inputs = page.container.querySelectorAll('input')
    setInput(inputs[0], 'Người dùng')
    setInput(inputs[1], 'person@example.test')
    setInput(inputs[2], 'GoodPass123')
    await submit(page.container)
    expect(page.container.querySelector('[role="alert"]')?.textContent).toBe('Hiện chưa mở đăng ký tài khoản mới.')
    expect(page.container.querySelector('a[href^="/login?"]')?.getAttribute('href')).toBe('/login?next=%2Faccount%2Ftrips')
    expect(page.container.querySelector('a a')).toBeNull()
    expect(JSON.stringify(warn.mock.calls)).not.toContain('person@example.test')
    expect(JSON.stringify(warn.mock.calls)).not.toContain('GoodPass123')
    page.unmount()
  })

  it('shows a mapped login error without revealing whether an email exists', async () => {
    authMocks.signIn.mockResolvedValue({ error: { code: 'email_not_confirmed', status: 400, message: 'person@example.test exists' } })
    const page = mount(<LoginPage />, '/login?next=%2F%2Fevil.example')
    const inputs = page.container.querySelectorAll('input')
    setInput(inputs[0], 'person@example.test')
    setInput(inputs[1], 'GoodPass123')
    await submit(page.container)
    const alert = page.container.querySelector('[role="alert"]')
    expect(alert?.textContent).toBe('Bạn cần xác nhận email trước khi đăng nhập.')
    expect(alert?.textContent).not.toContain('person@example.test')
    expect(page.container.querySelector('a[href^="/register?"]')?.getAttribute('href')).toBe('/register?next=%2Faccount%2Ftrips')
    page.unmount()
  })
})
