import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AssistantChatbox } from './AssistantChatbox'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

function setInputValue(el: HTMLInputElement, val: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
  setter?.call(el, val)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('AssistantChatbox', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    localStorage.clear()
    sessionStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    container.remove()
  })

  function renderChatbox() {
    const root = createRoot(container)
    act(() => {
      root.render(
        <MemoryRouter>
          <AssistantChatbox />
        </MemoryRouter>
      )
    })
    return root
  }

  it('renders floating draggable button with accessible label', () => {
    renderChatbox()
    const trigger = container.querySelector('button[aria-label="Mở trợ lý Cố Đô"]')
    expect(trigger).not.toBeNull()
    expect(trigger?.getAttribute('aria-expanded')).toBe('false')
  })

  it('opens and closes chat window when trigger button is clicked', () => {
    renderChatbox()
    const trigger = container.querySelector('button[aria-label="Mở trợ lý Cố Đô"]') as HTMLButtonElement

    // Click trigger via pointerdown + pointerup without move
    act(() => {
      trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100, button: 0 }))
      trigger.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 100, clientY: 100, button: 0 }))
    })

    const dialog = container.querySelector('div[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog?.textContent).toContain('Trợ lý Cố Đô')

    // Close button
    const closeBtn = container.querySelector('button[aria-label="Đóng khung chat"]') as HTMLButtonElement
    act(() => {
      closeBtn.click()
    })
    expect(container.querySelector('div[role="dialog"]')).toBeNull()
  })

  it('closes dialog on Escape key', () => {
    renderChatbox()
    const trigger = container.querySelector('button[aria-label="Mở trợ lý Cố Đô"]') as HTMLButtonElement

    act(() => {
      trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100, button: 0 }))
      trigger.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 100, clientY: 100, button: 0 }))
    })

    expect(container.querySelector('div[role="dialog"]')).not.toBeNull()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(container.querySelector('div[role="dialog"]')).toBeNull()
  })

  it('sends user message and displays assistant response', () => {
    renderChatbox()
    const trigger = container.querySelector('button[aria-label="Mở trợ lý Cố Đô"]') as HTMLButtonElement

    act(() => {
      trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100, button: 0 }))
      trigger.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 100, clientY: 100, button: 0 }))
    })

    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    const form = container.querySelector('form') as HTMLFormElement

    act(() => {
      setInputValue(input, 'Quán bún bò Huế ngon')
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(container.textContent).toContain('Quán bún bò Huế ngon')

    // Advance timer for simulated assistant response
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(container.textContent).toContain('O Cương Điệp')
  })

  it('clicking a quick suggestion sends prompt and receives response', () => {
    renderChatbox()
    const trigger = container.querySelector('button[aria-label="Mở trợ lý Cố Đô"]') as HTMLButtonElement

    act(() => {
      trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100, button: 0 }))
      trigger.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 100, clientY: 100, button: 0 }))
    })

    const suggestionBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Bún bò')
    )
    expect(suggestionBtn).toBeDefined()

    act(() => {
      suggestionBtn?.click()
    })

    // Advance timer for response
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(container.textContent).toContain('O Cương Điệp')
  })

  it('dragging the button moves position and does not trigger click toggle', () => {
    renderChatbox()
    const trigger = container.querySelector('button[aria-label="Mở trợ lý Cố Đô"]') as HTMLButtonElement

    act(() => {
      // pointerdown at (100, 100)
      trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100, button: 0 }))
      // pointermove to (180, 200) - distance > 6px
      trigger.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 180, clientY: 200, button: 0 }))
      // pointerup at (180, 200)
      trigger.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 180, clientY: 200, button: 0 }))
    })

    // Dialog should NOT be opened because it was a drag gesture
    expect(container.querySelector('div[role="dialog"]')).toBeNull()
  })

  it('resets chat history when reload button is clicked', () => {
    renderChatbox()
    const trigger = container.querySelector('button[aria-label="Mở trợ lý Cố Đô"]') as HTMLButtonElement

    act(() => {
      trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100, button: 0 }))
      trigger.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 100, clientY: 100, button: 0 }))
    })

    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    const form = container.querySelector('form') as HTMLFormElement

    act(() => {
      setInputValue(input, 'Tin nhắn thử nghiệm')
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      vi.advanceTimersByTime(500)
    })

    expect(container.textContent).toContain('Tin nhắn thử nghiệm')

    const resetBtn = container.querySelector('button[aria-label="Làm mới cuộc trò chuyện"]') as HTMLButtonElement
    act(() => {
      resetBtn.click()
    })

    expect(container.textContent).not.toContain('Tin nhắn thử nghiệm')
    expect(container.textContent).toContain('Trợ lý Cố Đô')
  })
})
