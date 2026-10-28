import { useState } from 'react'
import { vi } from '@/lib/strings/vi'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'

export interface StartPointPreset {
  slug: string
  name: string
  lat: number
  lng: number
  description?: string
}

interface Step5StartProps {
  start: { label: string; lat: number; lng: number } | null
  notes: string
  startPoints: StartPointPreset[]
  onChangeStart: (start: { label: string; lat: number; lng: number } | null) => void
  onChangeNotes: (notes: string) => void
  error?: string | null
}

const defaultPresets: StartPointPreset[] = [
  {
    slug: 'dai-noi',
    name: 'Gần Đại Nội (Bờ Bắc)',
    lat: 16.4691,
    lng: 107.5794,
    description: 'Khu vực cổ kính, không gian yên bình, gần các di tích hoàng cung',
  },
  {
    slug: 'bo-nam',
    name: 'Trung tâm bờ Nam (đường Lê Lợi, Ga Huế)',
    lat: 16.4619,
    lng: 107.5884,
    description: 'Ngay trung tâm sôi động, tiện dạo mát bờ sông Hương và ẩm thực đêm',
  },
  {
    slug: 'pho-tay',
    name: 'Khu phố Tây (Phạm Ngũ Lão, Chu Văn An)',
    lat: 16.4665,
    lng: 107.5960,
    description: 'Nhiều quán pub, nhà hàng đa dạng, cà phê nhộn nhịp về đêm',
  },
]

export function Step5Start({
  start,
  notes,
  startPoints,
  onChangeStart,
  onChangeNotes,
  error,
}: Step5StartProps) {
  const [mapModalOpen, setMapModalOpen] = useState(false)
  const [tempLat, setTempLat] = useState(16.4637)
  const [tempLng, setTempLng] = useState(107.5909)

  const presetsToUse = startPoints.length > 0 ? startPoints : defaultPresets
  const notesLength = notes.length
  const isNotesTooLong = notesLength > 300

  const handleSelectPreset = (preset: StartPointPreset) => {
    if (start?.lat === preset.lat && start?.lng === preset.lng && start?.label === preset.name) {
      onChangeStart(null)
    } else {
      onChangeStart({ label: preset.name, lat: preset.lat, lng: preset.lng })
    }
  }

  const handleConfirmPin = () => {
    onChangeStart({
      label: vi.wizard.pinnedAt(tempLat, tempLng),
      lat: tempLat,
      lng: tempLng,
    })
    setMapModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink md:text-3xl">
          {vi.wizard.step5Title}
        </h2>
        <p className="text-sm leading-relaxed text-ink-muted">
          {vi.wizard.step5Subtitle}
        </p>
      </div>

      {/* Preset Start Locations */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-serif font-semibold text-ink">
            {vi.wizard.startPresetsTitle}
          </h3>
          <span className="text-xs text-ink-muted">Tùy chọn</span>
        </div>

        <div
          role="radiogroup"
          aria-label={vi.wizard.startPresetsTitle}
          className="flex flex-col gap-3"
        >
          {presetsToUse.map((preset) => {
            const isSelected = start?.lat === preset.lat && start?.lng === preset.lng
            return (
              <div
                key={preset.slug}
                role="radio"
                tabIndex={0}
                aria-checked={isSelected}
                onClick={() => handleSelectPreset(preset)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    handleSelectPreset(preset)
                  }
                }}
                className={`group relative flex cursor-pointer items-start gap-4 rounded-card p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'bg-surface shadow-card border-2 border-primary ring-1 ring-primary/20'
                    : 'bg-surface/80 hover:bg-surface border border-line shadow-sm'
                }`}
              >
                <div
                  className={`grid size-10 shrink-0 place-items-center rounded-control text-lg transition-colors ${
                    isSelected ? 'bg-primary/10 text-primary' : 'bg-bg text-ink'
                  }`}
                  aria-hidden="true"
                >
                  📍
                </div>

                <div className="flex-1 pr-6">
                  <h4 className={`font-serif text-sm font-semibold leading-snug ${
                    isSelected ? 'text-primary' : 'text-ink'
                  }`}>
                    {preset.name}
                  </h4>
                  {preset.description && (
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                      {preset.description}
                    </p>
                  )}
                </div>

                <div
                  className={`absolute right-4 top-4 grid size-5 place-items-center rounded-full border transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-line bg-surface text-transparent'
                  }`}
                  aria-hidden="true"
                >
                  <span className="text-[10px] font-bold">✓</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Map Pinning Option */}
      <section className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card border border-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">🗺️</span>
            <h3 className="text-sm font-semibold text-ink">
              {vi.wizard.pinOnMapTitle}
            </h3>
          </div>
          <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
            Tùy biến cao
          </span>
        </div>

        {start && !presetsToUse.some(p => p.lat === start.lat && p.lng === start.lng) ? (
          <div className="flex items-center justify-between rounded-control bg-primary/5 p-3.5 border border-primary/20">
            <div className="flex items-center gap-2.5">
              <span className="text-primary text-lg" aria-hidden="true">📍</span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-primary">{start.label}</span>
                <span className="text-[11px] text-ink-muted">
                  Tọa độ: {start.lat.toFixed(4)}, {start.lng.toFixed(4)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChangeStart(null)}
              className="text-xs font-semibold text-danger hover:underline focus-visible:outline-none"
            >
              Bỏ ghim
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setMapModalOpen(true)}
            className="w-full justify-between"
          >
            <span>{vi.wizard.pinOnMapBtn}</span>
            <span aria-hidden="true">📍 →</span>
          </Button>
        )}
      </section>

      {/* Notes Textarea (Plain text only) */}
      <section className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card border border-line">
        <div className="flex items-center justify-between">
          <label htmlFor="wizard-notes-input" className="text-sm font-semibold text-ink">
            {vi.wizard.notesTitle}
          </label>
          <span className={`text-xs ${isNotesTooLong ? 'font-bold text-danger' : 'text-ink-muted'}`}>
            {vi.wizard.notesCharCount(notesLength)}
          </span>
        </div>

        <textarea
          id="wizard-notes-input"
          rows={3}
          value={notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          placeholder={vi.wizard.notesPlaceholder}
          maxLength={350}
          className={`w-full rounded-control border bg-bg p-3 text-sm text-ink transition-colors focus:outline-none focus:ring-1 ${
            isNotesTooLong
              ? 'border-danger focus:border-danger focus:ring-danger'
              : 'border-line focus:border-primary focus:ring-primary'
          }`}
        />

        {error && (
          <p className="text-xs font-medium text-danger" role="alert">
            {error}
          </p>
        )}
      </section>

      {/* Map Pinning Modal */}
      <Dialog
        open={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        title={vi.wizard.mapPickerModalTitle}
        actions={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setMapModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmPin}
            >
              {vi.wizard.mapPickerDone}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs text-ink-muted">
            Chọn vị trí khách sạn / homestay của bạn tại thành phố Huế:
          </p>
          <div className="flex flex-col gap-2 rounded-control bg-bg p-3 border border-line text-xs">
            <div className="flex items-center justify-between">
              <span>Vĩ độ (Lat):</span>
              <input
                type="number"
                step="0.0001"
                value={tempLat}
                onChange={(e) => setTempLat(parseFloat(e.target.value) || 16.4637)}
                className="w-28 rounded border border-line bg-surface px-2 py-1 text-right text-xs"
              />
            </div>
            <div className="flex items-center justify-between">
              <span>Kinh độ (Lng):</span>
              <input
                type="number"
                step="0.0001"
                value={tempLng}
                onChange={(e) => setTempLng(parseFloat(e.target.value) || 107.5909)}
                className="w-28 rounded border border-line bg-surface px-2 py-1 text-right text-xs"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => { setTempLat(16.4691); setTempLng(107.5794) }}
              className="rounded-full bg-line/40 px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-line/70"
            >
              Đại Nội (16.4691, 107.5794)
            </button>
            <button
              type="button"
              onClick={() => { setTempLat(16.4619); setTempLng(107.5884) }}
              className="rounded-full bg-line/40 px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-line/70"
            >
              Bờ Nam (16.4619, 107.5884)
            </button>
            <button
              type="button"
              onClick={() => { setTempLat(16.4665); setTempLng(107.5960) }}
              className="rounded-full bg-line/40 px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-line/70"
            >
              Phố Tây (16.4665, 107.5960)
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
