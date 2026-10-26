import type { Slot, TripInput } from '@shared/schemas'
import type { ScoredCandidate } from './types'

const reasonByInterest: Readonly<Record<string, string>> = {
  heritage: 'Bạn thích di sản, nên ghé {name} để có thêm thời gian tìm hiểu các công trình xưa.',
  history: 'Bạn quan tâm lịch sử, {name} là một điểm dừng phù hợp trong lịch trình.',
  spiritual: 'Bạn thích không gian tâm linh, {name} có thể là điểm dừng nhẹ nhàng.',
  cuisine: 'Bạn thích ẩm thực Huế, bữa ăn tại {name} là một lựa chọn hợp gu.',
  river: 'Bạn thích cảnh sông nước, {name} hợp làm điểm dừng ngắm cảnh.',
  photography: 'Bạn thích chụp ảnh, {name} là một điểm dừng để khám phá khung cảnh.',
  nature: 'Bạn thích thiên nhiên, {name} giúp lịch trình có thêm khoảng thư giãn.',
  cafe: 'Bạn thích cà phê, {name} là nơi phù hợp để nghỉ chân.',
  'local-life': 'Bạn muốn khám phá đời sống địa phương, {name} là một lựa chọn phù hợp.',
  shopping: 'Bạn muốn dành thời gian mua sắm, {name} có thể là điểm dừng trong ngày.',
}

export function buildReason(candidate: ScoredCandidate, input: TripInput, slot: Slot): string {
  const place = candidate.place
  if (input.companion === 'family_kids' && place.suitableFor.includes('family_kids')) {
    return 'Địa điểm này được đánh dấu phù hợp khi đi cùng trẻ nhỏ.'
  }
  if (slot === 'noon' && place.category === 'food') {
    return reasonByInterest.cuisine.replace('{name}', place.name)
  }
  const matched = input.interests.find((interest) => place.tags.some((tag) => tag.slug === interest) && reasonByInterest[interest])
  if (matched) return reasonByInterest[matched].replace('{name}', place.name)
  if (place.bestTime.includes(slot)) return `${place.name} phù hợp với khung ${slot === 'evening' ? 'buổi tối' : slot === 'afternoon' ? 'buổi chiều' : slot === 'noon' ? 'buổi trưa' : 'buổi sáng'}.`
  return `${place.name} được chọn để lịch trình có thêm trải nghiệm đa dạng.`
}
