import { vi } from '@/lib/strings/vi'

export interface InterestTagItem {
  slug: string
  name: string
  icon?: string | null
  imageUrl?: string | null
  subtitle?: string
}

interface Step3InterestsProps {
  interests: string[]
  availableTags: InterestTagItem[]
  loading?: boolean
  onToggleInterest: (slug: string) => void
  error?: string | null
}

const defaultInterestDetails: Record<string, { icon: string; subtitle: string; bgClass: string }> = {
  heritage: {
    icon: '🏛️',
    subtitle: 'Đại Nội, Cấm Thành, Ngọ Môn',
    bgClass: 'from-[#432173] via-[#5B3A8C] to-[#C8963E]/40',
  },
  history: {
    icon: '📜',
    subtitle: 'Lăng Tự Đức, Khải Định, Minh Mạng',
    bgClass: 'from-[#281900] via-[#563587] to-[#8C6D3F]/40',
  },
  spiritual: {
    icon: '🛕',
    subtitle: 'Chùa Thiên Mụ, Từ Hiếu, Huyền Không',
    bgClass: 'from-[#193F35] via-[#2F6F5E] to-[#609F8C]/40',
  },
  river: {
    icon: '⛵',
    subtitle: 'Du thuyền rồng, hoàng hôn bến Vân Lâu',
    bgClass: 'from-[#1B2F4E] via-[#2C5282] to-[#795290]/40',
  },
  cuisine: {
    icon: '🍲',
    subtitle: 'Bún bò, bánh bèo nậm lọc, cơm hến',
    bgClass: 'from-[#651D12] via-[#9C4221] to-[#D97706]/40',
  },
  cafe: {
    icon: '☕',
    subtitle: 'Cà phê muối, nhà rường ven sông',
    bgClass: 'from-[#382314] via-[#5C3A21] to-[#A27B5C]/40',
  },
  photography: {
    icon: '📷',
    subtitle: 'Cầu Trường Tiền, làng hương Thủy Xuân',
    bgClass: 'from-[#3A104E] via-[#6B21A8] to-[#EC4899]/30',
  },
  nature: {
    icon: '🌿',
    subtitle: 'Đồi Vọng Cảnh, đồi Thiên An, Rú Chá',
    bgClass: 'from-[#143E2C] via-[#2D6A4F] to-[#74C69D]/40',
  },
  'local-life': {
    icon: '🚲',
    subtitle: 'Chợ Đông Ba, phố cổ Bao Vinh, đời thường',
    bgClass: 'from-[#422006] via-[#78350F] to-[#B45309]/40',
  },
  shopping: {
    icon: '🎁',
    subtitle: 'Mè xửng, nón bài thơ, trà sen cung đình',
    bgClass: 'from-[#4C1D95] via-[#6D28D9] to-[#C8963E]/40',
  },
}

export function Step3Interests({
  interests,
  availableTags,
  loading = false,
  onToggleInterest,
  error,
}: Step3InterestsProps) {
  const selectedCount = interests.length
  const isSatisfied = selectedCount >= 2 && selectedCount <= 6

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink md:text-3xl">
              {vi.wizard.step3Title}
            </h2>
            <p className="text-sm leading-relaxed text-ink-muted">
              {vi.wizard.step3Subtitle}
            </p>
          </div>

          <div
            className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-all md:self-end ${
              isSatisfied
                ? 'bg-secondary/15 text-secondary border border-secondary/30'
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}
          >
            <span>🏷️</span>
            <span>{vi.wizard.selectedBadge(selectedCount)}</span>
          </div>
        </div>

        {error && (
          <p className="rounded-control bg-danger/10 px-3 py-2 text-xs font-medium text-danger border border-danger/20" role="alert">
            {error}
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-card bg-line/40" />
          ))}
        </div>
      ) : (
        <div
          role="group"
          aria-label={vi.wizard.step3Title}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          {availableTags.map((tag) => {
            const isSelected = interests.includes(tag.slug)
            const details = defaultInterestDetails[tag.slug] ?? {
              icon: '✦',
              subtitle: 'Điểm đến độc đáo ở Huế',
              bgClass: 'from-[#432173] to-[#5B3A8C]',
            }

            return (
              <button
                key={tag.slug}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                onClick={() => onToggleInterest(tag.slug)}
                className={`group relative flex h-40 flex-col justify-end overflow-hidden rounded-card p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'ring-2 ring-primary shadow-md scale-[1.01]'
                    : 'border border-line shadow-sm hover:shadow-md hover:scale-[1.01]'
                }`}
              >
                {/* Visual Gradient Background (placeholder art) */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${details.bgClass} transition-opacity duration-300 ${
                    isSelected ? 'opacity-95' : 'opacity-85 group-hover:opacity-95'
                  }`}
                />

                {/* Subtle Geometric Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />

                {/* Top Corner Selection Indicator Badge */}
                <div
                  className={`absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-full text-xs font-bold shadow-sm transition-all ${
                    isSelected
                      ? 'bg-white text-primary ring-2 ring-primary'
                      : 'bg-black/30 backdrop-blur-sm text-white/90 group-hover:bg-black/45'
                  }`}
                  aria-hidden="true"
                >
                  {isSelected ? '✓' : '+'}
                </div>

                {/* Card Content at Bottom */}
                <div className="relative z-10 flex flex-col">
                  <span className="text-xl mb-1 drop-shadow-sm" aria-hidden="true">
                    {tag.icon || details.icon}
                  </span>
                  <h3 className="font-serif text-sm font-semibold leading-tight text-white drop-shadow-md">
                    {tag.name}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-[11px] leading-tight text-white/80">
                    {tag.subtitle || details.subtitle}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
