import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { previewPlaceCsv, commitPlaceCsv } = vi.hoisted(() => ({ previewPlaceCsv: vi.fn(), commitPlaceCsv: vi.fn() }))
vi.mock('./adminImportApi', () => ({ previewPlaceCsv, commitPlaceCsv }))
vi.mock('@/features/auth/hooks/useSession', () => ({ useSession: () => ({ session: { access_token: 'test-admin-token' } }) }))
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('AdminImportPage', () => {
  afterEach(() => { vi.clearAllMocks(); document.body.replaceChildren() })

  it('previews selected CSV, confirms commit and displays the outcome with downloadable error rows', async () => {
    previewPlaceCsv.mockResolvedValue({ summary: { total: 2, valid: 1, warnings: 0, errors: 1 }, rows: [
      { line: 2, slug: 'valid-place', status: 'valid', action: 'create', messages: [] },
      { line: 3, slug: 'bad-place', status: 'error', action: 'skip', messages: ['Thiếu tên'] },
    ] })
    commitPlaceCsv.mockResolvedValue({ created: 1, updated: 0, skipped: 0, errors: [{ line: 3, message: 'Thiếu tên' }], errorCsv: 'line,slug,reason\r\n3,bad-place,Thiếu tên\r\n' })
    const { default: AdminImportPage } = await import('./AdminImportPage')
    const container = document.createElement('div')
    document.body.append(container)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const root = createRoot(container)
    await act(async () => root.render(<QueryClientProvider client={client}><MemoryRouter><AdminImportPage /></MemoryRouter></QueryClientProvider>))
    try {
      const input = container.querySelector('input[type="file"]')
      expect(input).not.toBeNull()
      const file = new File(['slug,name\nvalid-place,Valid'], 'places.csv', { type: 'text/csv' })
      await act(async () => {
        Object.defineProperty(input, 'files', { configurable: true, value: [file] })
        input?.dispatchEvent(new Event('change', { bubbles: true }))
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
      const previewButton = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Xem trước'))
      expect(previewButton).toBeDefined()
      await act(async () => { previewButton?.click(); await new Promise((resolve) => setTimeout(resolve, 0)) })
      expect(container.textContent).toContain('bad-place')
      expect(container.textContent).toContain('Thiếu tên')
      const overwrite = container.querySelector('input[type="checkbox"]') as HTMLInputElement
      await act(async () => { overwrite.click() })
      const commitButton = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Import các dòng hợp lệ'))
      await act(async () => { commitButton?.click(); await new Promise((resolve) => setTimeout(resolve, 0)) })
      expect(container.textContent).toContain('Đã xử lý tệp CSV')
      expect(container.textContent).toContain('Tạo mới')
      expect(commitPlaceCsv).toHaveBeenCalledWith('slug,name\nvalid-place,Valid', true, 'test-admin-token')
    } finally {
      await act(async () => root.unmount())
      client.clear()
    }
  })
})
