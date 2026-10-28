import type { Slot, TripInput } from '@shared/schemas'
import type { ScoredCandidate } from './types'

const categoryReasons: Readonly<Record<ScoredCandidate['place']['category'], readonly string[]>> = {
  heritage: [
    'Bạn có thể dành thời gian khám phá {name}.',
    '{name} là một điểm dừng thuộc nhóm di sản trong lịch trình.',
    'Bạn có thể ghé {name} như một điểm tham quan di sản.',
  ],
  food: [
    'Bạn có thể dùng bữa tại {name}.',
    '{name} là một điểm dừng ăn uống trong lịch trình.',
    'Bạn có thể dành một bữa ăn tại {name}.',
  ],
  cafe: [
    'Bạn có thể nghỉ chân tại quán cà phê {name}.',
    '{name} là một điểm dừng cà phê trong lịch trình.',
    'Bạn có thể dành thời gian thư giãn ở {name}.',
  ],
  sightseeing: [
    'Bạn có thể dành thời gian tham quan {name}.',
    '{name} là một điểm ngắm cảnh trong lịch trình.',
    'Bạn có thể ghé {name} như một điểm tham quan.',
  ],
  shopping: [
    'Bạn có thể dành thời gian mua sắm tại {name}.',
    '{name} là một điểm dừng mua sắm trong lịch trình.',
    'Bạn có thể ghé {name} trong lúc tìm mua quà.',
  ],
}

const tagLabel: Readonly<Record<string, string>> = {
  heritage: 'di sản', history: 'lịch sử', spiritual: 'không gian tâm linh', river: 'cảnh sông nước',
  cuisine: 'ẩm thực', cafe: 'cà phê', photography: 'chụp ảnh', nature: 'thiên nhiên',
  'local-life': 'đời sống địa phương', shopping: 'mua sắm',
}

export function buildReason(candidate: ScoredCandidate, input: TripInput, _slot: Slot, variantIndex = 0): string {
  const place = candidate.place
  const variants = categoryReasons[place.category]
  const categoryReason = variants[Math.abs(variantIndex) % variants.length].replace('{name}', place.name)
  if (input.companion === 'family_kids' && place.suitableFor.includes('family_kids') && variantIndex % 3 === 2) {
    return `${categoryReason} Dữ liệu đánh dấu nơi này phù hợp với gia đình có trẻ nhỏ.`
  }

  // Category wording is primary; a matching tag is only a secondary, data-backed note.
  if (variantIndex % 4 === 3) {
    const matched = input.interests
      .map((interest) => place.tags.find((tag) => tag.slug === interest))
      .find((tag): tag is NonNullable<typeof tag> => tag !== undefined)
    if (matched) return `${categoryReason} Bạn cũng quan tâm ${tagLabel[matched.slug] ?? matched.name}.`
  }
  return categoryReason
}
