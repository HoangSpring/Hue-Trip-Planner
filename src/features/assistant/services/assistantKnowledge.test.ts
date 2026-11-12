import { describe, expect, it } from 'vitest'
import {
  INITIAL_GREETING,
  QUICK_SUGGESTIONS,
  getAssistantResponse,
} from './assistantKnowledge'

describe('assistantKnowledge', () => {
  it('has initial greeting and quick suggestions', () => {
    expect(INITIAL_GREETING.text).toContain('Trợ lý Cố Đô')
    expect(INITIAL_GREETING.actions?.length).toBeGreaterThan(0)
    expect(QUICK_SUGGESTIONS.length).toBeGreaterThan(0)
  })

  it('answers queries about bun bo hue with restaurant recommendations', () => {
    const res = getAssistantResponse('Cho mình xin quán bún bò ngon ở Huế')
    expect(res.text.toLowerCase()).toContain('bún bò')
    expect(res.text).toContain('O Cương Điệp')
  })

  it('answers queries about lăng tẩm', () => {
    const res = getAssistantResponse('Nên đi lăng vua nào?')
    expect(res.text).toContain('Khải Định')
    expect(res.text).toContain('Tự Đức')
  })

  it('answers queries about Đại Nội', () => {
    const res = getAssistantResponse('Kinh nghiệm tham quan Đại Nội Huế')
    expect(res.text).toContain('Đại Nội')
    expect(res.text).toContain('Ngọ Môn')
  })

  it('answers queries about tạo lịch trình', () => {
    const res = getAssistantResponse('Làm sao để tạo lịch trình du lịch?')
    expect(res.text).toContain('lịch trình')
    expect(res.actions?.some((a) => a.to === '/plan/new')).toBe(true)
  })

  it('answers queries about 1 ngày ở Huế', () => {
    const res = getAssistantResponse('Gợi ý lịch trình 1 ngày')
    expect(res.text).toContain('1 ngày')
  })

  it('answers queries about thời tiết', () => {
    const res = getAssistantResponse('Huế mùa nào đẹp nhất, có hay mưa không?')
    expect(res.text).toContain('Tháng 1')
  })

  it('answers greetings nicely', () => {
    const res = getAssistantResponse('Xin chào!')
    expect(res.text).toContain('xin chào')
  })

  it('provides a helpful fallback with action links for unknown queries', () => {
    const res = getAssistantResponse('abcdefgh xyz 12345')
    expect(res.text).toContain('Cố Đô')
    expect(res.actions?.length).toBeGreaterThan(0)
  })
})
