import { useState, useRef, useEffect, useId } from 'react'
import {
  X,
  Send,
  RotateCcw,
  Sparkles,
  Compass,
} from 'lucide-react'
import {
  INITIAL_GREETING,
  QUICK_SUGGESTIONS,
  getAssistantResponse,
  type AssistantAction,
} from '../services/assistantKnowledge'
import { AssistantMessageItem } from './AssistantMessageItem'

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  actions?: AssistantAction[]
  timestamp: string
}

function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const STORAGE_KEY_POS = 'hue_assistant_pos'
const STORAGE_KEY_CHAT = 'hue_assistant_chat_v1'
const BUTTON_SIZE = 58

export function AssistantChatbox() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const inputId = useId()

  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POS)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed
        }
      }
    } catch {
      // fallback
    }
    // Default: bottom-right (fallback for SSR/initial)
    const initialWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
    const initialHeight = typeof window !== 'undefined' ? window.innerHeight : 768
    return {
      x: Math.max(16, initialWidth - BUTTON_SIZE - 24),
      y: Math.max(16, initialHeight - BUTTON_SIZE - 28),
    }
  })

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_CHAT)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'init-msg',
        sender: 'assistant',
        text: INITIAL_GREETING.text,
        actions: INITIAL_GREETING.actions,
        timestamp: formatTime(),
      },
    ]
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<{
    startX: number
    startY: number
    startPosX: number
    startPosY: number
    hasMoved: boolean
  } | null>(null)

  // Clamp on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.max(12, Math.min(window.innerWidth - BUTTON_SIZE - 12, prev.x)),
        y: Math.max(12, Math.min(window.innerHeight - BUTTON_SIZE - 12, prev.y)),
      }))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' })
    }
  }, [messages, isTyping, isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  // Persist chat to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(messages))
    } catch {
      // ignore
    }
  }, [messages])

  // Keyboard close with Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Dragging logic
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
      hasMoved: false,
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY

    if (Math.hypot(dx, dy) > 6) {
      dragRef.current.hasMoved = true
    }

    if (dragRef.current.hasMoved) {
      const maxX = Math.max(12, window.innerWidth - BUTTON_SIZE - 12)
      const maxY = Math.max(12, window.innerHeight - BUTTON_SIZE - 12)
      const nextX = Math.max(12, Math.min(maxX, dragRef.current.startPosX + dx))
      const nextY = Math.max(12, Math.min(maxY, dragRef.current.startPosY + dy))
      setPosition({ x: nextX, y: nextY })
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return
    const hasMoved = dragRef.current.hasMoved
    dragRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }

    if (!hasMoved) {
      setIsOpen((prev) => !prev)
    } else {
      try {
        localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(position))
      } catch {
        // ignore
      }
    }
  }

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim()
    if (!text || isTyping) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: formatTime(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setIsTyping(true)

    // Simulate smart thinking delay
    setTimeout(() => {
      const reply = getAssistantResponse(text)
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: reply.text,
        actions: reply.actions,
        timestamp: formatTime(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      setIsTyping(false)
    }, 380)
  }

  const handleResetChat = () => {
    const initMsg: ChatMessage = {
      id: `init-${Date.now()}`,
      sender: 'assistant',
      text: INITIAL_GREETING.text,
      actions: INITIAL_GREETING.actions,
      timestamp: formatTime(),
    }
    setMessages([initMsg])
  }

  return (
    <>
      {/* Floating circular draggable trigger */}
      <div
        className="fixed z-50 select-none touch-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label={isOpen ? 'Đóng trợ lý Cố Đô' : 'Mở trợ lý Cố Đô'}
          aria-expanded={isOpen}
          title="Trợ lý Cố Đô (Kéo để di chuyển)"
          className={`relative group flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-transform active:scale-95 cursor-grab active:cursor-grabbing ${
            isOpen
              ? 'bg-primary text-accent border-2 border-accent'
              : 'bg-gradient-to-tr from-primary via-[#511747] to-primary text-white border-2 border-accent/80 hover:border-accent hover:shadow-accent/20'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white transition-transform duration-200" />
          ) : (
            <div className="relative flex items-center justify-center">
              {/* Royal Assistant Avatar */}
              <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center border border-accent/40">
                <Sparkles className="w-5 h-5 text-accent animate-pulse" />
              </div>
              {/* Online pulsing indicator badge */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
              </span>
            </div>
          )}

          {/* Hover Tooltip when closed */}
          {!isOpen && (
            <span className="pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-medium text-white bg-primary/95 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Trợ lý Cố Đô · Kéo để chuyển vị trí
            </span>
          )}
        </button>
      </div>

      {/* Assistant Chat Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Khung trò chuyện với Trợ lý Cố Đô"
          className="fixed z-50 bottom-24 right-4 sm:right-6 md:right-8 w-[calc(100vw-32px)] sm:w-[380px] h-[520px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-line flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-primary to-[#511747] text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-accent/25 border border-accent/60 flex items-center justify-center text-accent">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide flex items-center gap-1.5 font-serif text-white">
                  Trợ lý Cố Đô
                  <span className="text-[10px] px-1.5 py-0.2 bg-accent/30 text-accent font-sans rounded-full font-normal">
                    Huế AI
                  </span>
                </h3>
                <p className="text-[11px] text-white/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Sẵn sàng tư vấn du lịch Huế
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                title="Làm mới cuộc trò chuyện"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                aria-label="Làm mới cuộc trò chuyện"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Đóng"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                aria-label="Đóng khung chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAF9F7]">
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant'
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${
                    isAssistant ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-full bg-primary text-accent flex-shrink-0 flex items-center justify-center text-xs border border-accent/40 shadow-xs mt-0.5">
                      🌸
                    </div>
                  )}

                  <div className="max-w-[85%] space-y-1">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                        isAssistant
                          ? 'bg-white text-ink border border-line/60 rounded-tl-sm'
                          : 'bg-primary text-white rounded-tr-sm ml-auto'
                      }`}
                    >
                      {isAssistant ? (
                        <AssistantMessageItem
                          text={msg.text}
                          actions={msg.actions}
                          onActionClick={(act) => {
                            if (act.prompt) {
                              handleSendMessage(act.prompt)
                            }
                          }}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>

                    <span
                      className={`block text-[10px] text-ink-muted/80 px-1 ${
                        isAssistant ? 'text-left' : 'text-right'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary text-accent flex items-center justify-center text-xs">
                  🌸
                </div>
                <div className="bg-white px-3.5 py-2 rounded-2xl border border-line/60 shadow-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                  <span className="text-xs text-ink-muted ml-1 font-sans">Đang soạn...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Pills (Scrollable) */}
          <div className="px-3 py-2 bg-white border-t border-line/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] text-ink-muted flex-shrink-0 font-medium mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-accent" /> Gợi ý:
            </span>
            {QUICK_SUGGESTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSendMessage(item.prompt)}
                disabled={isTyping}
                className="flex-shrink-0 px-2.5 py-1 text-xs bg-surface text-ink hover:bg-primary-tint/60 hover:text-primary rounded-full border border-line text-nowrap transition-colors cursor-pointer disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="p-3 bg-white border-t border-line flex items-center gap-2"
          >
            <label htmlFor={inputId} className="sr-only">
              Nhập tin nhắn cho trợ lý Cố Đô
            </label>
            <input
              id={inputId}
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Hỏi về bún bò, lăng tẩm, lịch trình..."
              disabled={isTyping}
              className="flex-1 px-3.5 py-2 text-sm bg-surface border border-line rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-ink placeholder:text-ink-muted/70"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              aria-label="Gửi tin nhắn"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
