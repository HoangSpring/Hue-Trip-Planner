
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { placeMapItemSchema } from '@shared/schemas/placeApi'
import { getPlaceBySlug, ApiRequestError } from '@/lib/api'
import { brand } from '@/lib/brand'
import { paths } from '@/app/paths'
import { vi } from '@/lib/strings/vi'
import { ImageCredit } from '@/components/ui/ImageCredit'
import { PlaceCard } from '@/components/ui/PlaceCard'
import { MapView } from '@/features/map/MapView'
import { PlacePhoto } from '@/components/ui/PlacePhoto'
import { SavedPlaceButton } from '@/features/saved/SavedPlaceButton'
import { AddToTripDialog } from '@/features/trip-editor/components/AddToTripDialog'
import { placeSummarySchema } from '@shared/schemas/place'

export default function PlacePage() {
  const { slug = '' } = useParams()
  const [addingToTrip, setAddingToTrip] = useState(false)

  const query = useQuery({
    queryKey: ['place', slug],
    queryFn: () => getPlaceBySlug(slug),
    retry: false,
  })

  const place = query.data?.place

  useEffect(() => {
    if (!place) return

    document.title = `${place.name} · ${brand.name}`

    let description =
      document.querySelector<HTMLMetaElement>(
        'meta[name="description"]',
      )

    if (!description) {
      description = document.createElement('meta')
      description.name = 'description'
      document.head.append(description)
    }

    description.content =
      place.shortDescription ||
      place.description ||
      `${place.name} · ${brand.description}`

    return () => {
      description?.removeAttribute('content')
    }
  }, [place])

  if (query.isPending) {
    return (
      <div
        role="status"
        aria-label={vi.place.loading}
        className="mx-auto max-w-[1440px] animate-pulse px-4 py-10 md:px-8"
      >
        <div className="h-5 w-48 rounded-full bg-[#eae3d7]" />
        <div className="mt-6 grid gap-3 lg:grid-cols-[1.8fr_1fr]">
          <div className="aspect-[16/10] rounded-[20px] bg-[#eae3d7]" />
          <div className="hidden gap-3 lg:grid">
            <div className="rounded-[20px] bg-[#eae3d7]" />
            <div className="rounded-[20px] bg-[#eae3d7]" />
          </div>
        </div>
        <div className="mt-8 h-10 w-2/3 rounded bg-[#eae3d7]" />
        <div className="mt-5 h-32 rounded-[20px] bg-[#eae3d7]" />
      </div>
    )
  }

  if (query.isError) {
    if (
      query.error instanceof ApiRequestError &&
      query.error.status === 404
    ) {
      return (
        <div className="mx-auto max-w-content px-4 py-24 text-center">
          <p className="text-sm font-semibold text-primary">404</p>
          <h1 className="mt-3 font-serif text-3xl text-[#29202d]">
            {vi.place.notFoundTitle}
          </h1>
          <p className="mt-3 text-ink-muted">
            {vi.place.notFoundBody}
          </p>
          <Link
            to={paths.explore}
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-white transition hover:opacity-90"
          >
            {vi.place.explore}
          </Link>
        </div>
      )
    }

    return (
      <div className="mx-auto max-w-content px-4 py-24 text-center">
        <h1 className="font-serif text-3xl text-[#29202d]">
          {vi.place.errorTitle}
        </h1>
        <p className="mt-3 text-ink-muted">
          {vi.place.errorBody}
        </p>
        <button
          onClick={() => void query.refetch()}
          className="mt-6 min-h-12 rounded-xl bg-primary px-6 font-semibold text-white transition hover:opacity-90"
        >
          {vi.explore.retry}
        </button>
      </div>
    )
  }

  if (!place) return null

  const mapItem = placeMapItemSchema.parse({
    id: place.id,
    slug: place.slug,
    name: place.name,
    category: place.category,
    lat: place.lat,
    lng: place.lng,
    coverImageUrl: place.coverImageUrl,
  })

  const images = place.images.length
    ? place.images
    : place.coverImageUrl
      ? [
        {
          url: place.coverImageUrl,
          alt: place.coverImageAlt,
          credit: place.imageCredit ?? '',
          license: place.imageLicense ?? '',
          sourceUrl: place.imageSourceUrl ?? null,
        },
      ]
      : []

  const price =
    place.ticketPriceVnd != null
      ? `${new Intl.NumberFormat('vi-VN').format(
        place.ticketPriceVnd,
      )} ₫`
      : place.priceNote

  const timeLabel = (
    slot: keyof typeof vi.place.timeLabels,
  ) => vi.place.timeLabels[slot] ?? slot

  const directionsUrl =
    `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${place.lat}%2C${place.lng}%3B${place.lat}%2C${place.lng}`

  const categoryLabel = vi.placeCategories[place.category]

  return (
    <article className="min-h-screen bg-[#fcf8f0] text-[#302536]">
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pt-7">

        {/* Breadcrumb và thao tác */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs text-[#857a82]"
          >
            <Link
              to={paths.home}
              className="transition hover:text-primary"
            >
              Trang chủ
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              to={paths.explore}
              className="transition hover:text-primary"
            >
              {vi.place.breadcrumb}
            </Link>
            <span aria-hidden="true">/</span>
            <span>{categoryLabel}</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-primary">
              {place.name}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to={paths.explore}
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#e9e1d6] bg-white px-3 text-xs font-medium transition hover:border-primary/40 hover:text-primary"
            >
              <span aria-hidden="true">←</span>
              Quay lại
            </Link>

            <div className="rounded-full border border-[#e9e1d6] bg-white px-1">
              <SavedPlaceButton place={place} />
            </div>
          </div>
        </div>

        {/* Bộ sưu tập ảnh */}
        <section
          aria-label={`Hình ảnh ${place.name}`}
          className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1.8fr_1fr]"
        >
          {images.length > 0 ? (
            <>
              <figure className="group relative min-w-0 overflow-hidden rounded-[20px] border border-[#e9e1d6] bg-[#e9e3d9]">
                <PlacePhoto
                  src={images[0].url}
                  alt={images[0].alt ?? place.name}
                  loading="eager"
                  className="aspect-[16/10] h-full min-h-[250px] transition duration-700 group-hover:scale-[1.015] md:min-h-[380px] lg:min-h-[460px]"
                />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent p-4 pt-16">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#50347b]">
                    <span aria-hidden="true">✦</span>
                    {categoryLabel}
                  </span>
                  <p className="mt-3 font-serif text-xl text-white sm:text-2xl">
                    {place.name}
                  </p>
                  {place.address && (
                    <p className="mt-1 text-xs text-white/85">
                      {place.address}
                    </p>
                  )}
                </div>

                <div className="border-t border-white/30 bg-white">
                  <ImageCredit
                    credit={images[0].credit || null}
                    license={images[0].license || null}
                    sourceUrl={images[0].sourceUrl}
                  />
                </div>
              </figure>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:grid-rows-2">
                {[images[1], images[2]].map((image, index) =>
                  image ? (
                    <figure
                      key={`${image.url}-${index}`}
                      className="group relative min-w-0 overflow-hidden rounded-[18px] border border-[#e9e1d6] bg-[#e9e3d9]"
                    >
                      <PlacePhoto
                        src={image.url}
                        alt={image.alt ?? place.name}
                        loading="lazy"
                        className="aspect-[4/3] h-full min-h-[145px] transition duration-700 group-hover:scale-[1.03] md:aspect-auto md:min-h-[190px]"
                      />

                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3 pt-10">
                        <p className="line-clamp-2 text-xs font-medium text-white">
                          {image.alt || place.name}
                        </p>
                      </div>

                      <div className="border-t border-white/30 bg-white">
                        <ImageCredit
                          credit={image.credit || null}
                          license={image.license || null}
                          sourceUrl={image.sourceUrl}
                        />
                      </div>
                    </figure>
                  ) : null,
                )}

                {images.length === 1 && (
                  <div className="flex min-h-[145px] items-center justify-center rounded-[18px] border border-dashed border-[#d9cebd] bg-[#f3eee5] p-5 text-center md:min-h-0">
                    <p className="max-w-40 font-serif text-sm leading-6 text-[#897b88]">
                      Khám phá những câu chuyện của vùng đất Cố đô
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <figure className="overflow-hidden rounded-[20px] border border-[#e9e1d6] bg-white">
              <PlacePhoto
                src={null}
                alt={vi.place.placeholderAlt}
                className="aspect-[16/9] min-h-[280px]"
              />
              <ImageCredit
                credit={null}
                license={null}
                placeholder
              />
            </figure>
          )}
        </section>

        {/* Thông tin địa điểm và cột tiện ích */}
        <div className="mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_350px] xl:gap-10">

          {/* Nội dung chính */}
          <div className="min-w-0">

            {/* Tên và thông tin tổng quan */}
            <section>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-[#d9f2e8] px-3 py-1 text-xs font-medium text-[#286c59]">
                  {categoryLabel}
                </span>

                {place.area && (
                  <span className="rounded-full bg-[#f0ebe2] px-3 py-1 text-xs text-[#6f625d]">
                    {place.area}
                  </span>
                )}

                {place.tags.map((tag) => (
                  <span
                    key={tag.slug}
                    className="rounded-full bg-white px-3 py-1 text-xs text-[#766b72] ring-1 ring-[#eae2d7]"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>

              <h1 className="mt-4 break-words font-serif text-3xl font-semibold leading-tight tracking-tight text-[#29202d] sm:text-4xl lg:text-[42px]">
                {place.name}
              </h1>

              {place.shortDescription && (
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[#756b74] sm:text-base">
                  {place.shortDescription}
                </p>
              )}

              {place.address && (
                <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-[#756b74]">
                  <span className="mt-0.5 text-primary" aria-hidden="true">
                    ♧
                  </span>
                  <span>{place.address}</span>
                </p>
              )}
            </section>

            {/* Các thông tin nhanh */}
            <section
              aria-label="Thông tin tham quan"
              className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4"
            >
              {(place.openTime || place.closeTime) && (
                <QuickInfo
                  icon="◷"
                  label={vi.place.openHours}
                  value={`${place.openTime ?? ''}${place.openTime && place.closeTime ? ' – ' : ''}${place.closeTime ?? ''}`}
                  note={
                    place.closedDays.length
                      ? `${vi.place.closedDays}: ${place.closedDays.map((day) => vi.place.days[day - 1]).join(', ')}`
                      : 'Thời gian tham quan'
                  }
                />
              )}

              {(price || (place.priceLevel != null)) && (
                <QuickInfo
                  icon="♧"
                  label={vi.place.price}
                  value={
                    price ||
                    vi.place.priceLevels[place.priceLevel!]
                  }
                  note="Chi phí dự kiến"
                />
              )}

              {place.visitDurationMin != null && (
                <QuickInfo
                  icon="⌛"
                  label={vi.place.duration}
                  value={`~${place.visitDurationMin} phút`}
                  note="Thời gian tham quan"
                />
              )}

              {place.bestTime.length > 0 && (
                <QuickInfo
                  icon="☼"
                  label={vi.place.bestTime}
                  value={place.bestTime.map(timeLabel).join(', ')}
                  note="Thời điểm gợi ý"
                />
              )}
            </section>

            {/* Lưu ý tham quan */}
            {place.openingNote && (
              <aside className="mt-5 flex gap-3 rounded-[18px] border border-[#eadfc9] bg-[#f3ecdf] p-4 sm:p-5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e9d7b4] text-lg text-[#77522c]" aria-hidden="true">
                  !
                </span>
                <div>
                  <h2 className="font-serif text-lg font-semibold text-[#49362d]">
                    {vi.place.note}
                  </h2>
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[#75675d]">
                    {place.openingNote}
                  </p>
                </div>
              </aside>
            )}

            {/* Nội dung giới thiệu */}
            <section className="mt-9">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-serif text-2xl font-semibold text-[#302536] sm:text-3xl">
                  {vi.place.introTitle}
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Khám phá · Trải nghiệm
                </span>
              </div>

              {place.description ? (
                <div className="mt-4 whitespace-pre-line text-sm leading-7 text-[#665d65] sm:text-[15px] sm:leading-8">
                  {place.description}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-[#857982]">
                  {place.shortDescription || place.name}
                </p>
              )}

              <p className="mt-5 border-l-2 border-[#bda4d9] pl-4 text-xs leading-6 text-[#8b7e88]">
                {vi.place.visitNote}
                {place.lastVerifiedAt &&
                  ` Cập nhật gần nhất: ${new Date(place.lastVerifiedAt).toLocaleDateString('vi-VN')}.`}
              </p>
            </section>

            {/* Địa điểm lân cận */}
            {query.data.nearby.length > 0 && (
              <section className="mt-12">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                      Tiếp tục hành trình
                    </p>
                    <h2 className="mt-2 font-serif text-2xl font-semibold text-[#302536] sm:text-3xl">
                      {vi.place.nearbyTitle}
                    </h2>
                  </div>

                  <Link
                    to={paths.explore}
                    className="text-xs font-medium text-primary transition hover:underline"
                  >
                    Khám phá thêm →
                  </Link>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {query.data.nearby.slice(0, 4).map((nearby) => (
                    <div
                      key={nearby.id}
                      className="min-w-0 overflow-hidden rounded-[17px] border border-[#eee6da] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#5d4272]/[0.07]"
                    >
                      <PlaceCard place={nearby} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar tiện ích */}
          <aside className="space-y-4 lg:sticky lg:top-24">

            {/* Thẻ lập lịch trình */}
            <section className="rounded-[20px] border border-[#eee6da] bg-white p-5 shadow-[0_8px_24px_rgba(66,47,51,0.045)]">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#d9f2e8] px-3 py-1.5 text-xs font-medium text-[#286c59]">
                  <span className="size-1.5 rounded-full bg-[#36977b]" />
                  Thông tin tham quan
                </span>
                <span className="text-[10px] text-[#8b7e88]">
                  {place.lastVerifiedAt
                    ? `Cập nhật ${new Date(place.lastVerifiedAt).toLocaleDateString('vi-VN')}`
                    : 'Địa điểm Huế'}
                </span>
              </div>

              <h2 className="mt-4 font-serif text-xl font-semibold text-[#302536]">
                Đưa vào hành trình
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#827681]">
                Lưu địa điểm này vào kế hoạch khám phá Huế của bạn.
              </p>

              <button
                type="button"
                onClick={() => setAddingToTrip(true)}
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(91,54,139,0.18)] transition hover:bg-primary-hover active:scale-[0.99]"
              >
                <span aria-hidden="true">＋</span>
                {vi.saved.addToTrip}
              </button>

              <div className="mt-3 flex justify-center rounded-xl border border-[#eee6da] bg-[#faf7f1] px-3 py-2">
                <SavedPlaceButton place={place} />
              </div>

              <div className="my-5 border-t border-dashed border-[#e9e0d5]" />

              {/* Bản đồ */}
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-serif text-lg font-semibold text-[#302536]">
                  {vi.place.locationTitle}
                </h3>
                <span className="text-xs text-[#8b7e88]">
                  Vị trí địa lý
                </span>
              </div>

              <div className="mt-3 overflow-hidden rounded-[15px] border border-[#eee6da] bg-[#f3edf5]">
                <MapView places={[mapItem]} height="250px" />
              </div>

              {place.address && (
                <p className="mt-3 text-xs leading-5 text-[#756b74]">
                  <span className="font-semibold text-[#49365e]">
                    Địa chỉ:
                  </span>{' '}
                  {place.address}
                </p>
              )}

              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e4d7ee] bg-[#f6f0fb] px-3 text-sm font-medium text-primary transition hover:bg-[#eee3f8]"
              >
                <span aria-hidden="true">↗</span>
                {vi.place.directions}
              </a>
            </section>

            {/* Gợi ý theo dữ liệu thực tế */}
            {(place.bestTime.length > 0 ||
              place.visitDurationMin != null ||
              place.openingNote) && (
                <section className="rounded-[18px] border border-[#eee6da] bg-[#f4efe6] p-5">
                  <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-[#49362d]">
                    <span className="text-[#997044]" aria-hidden="true">
                      ✦
                    </span>
                    Gợi ý tham quan
                  </h2>

                  <div className="mt-4 space-y-4 text-sm">
                    {place.bestTime.length > 0 && (
                      <div>
                        <p className="text-xs text-[#8b7e88]">
                          Thời điểm phù hợp
                        </p>
                        <p className="mt-1 font-medium text-[#49362d]">
                          {place.bestTime.map(timeLabel).join(', ')}
                        </p>
                      </div>
                    )}

                    {place.visitDurationMin != null && (
                      <div>
                        <p className="text-xs text-[#8b7e88]">
                          Thời lượng dự kiến
                        </p>
                        <p className="mt-1 font-medium text-[#49362d]">
                          Khoảng {place.visitDurationMin} phút
                        </p>
                      </div>
                    )}

                    {place.openingNote && (
                      <div className="border-t border-[#e3d8c8] pt-3">
                        <p className="whitespace-pre-line text-xs leading-6 text-[#75675d]">
                          {place.openingNote}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

            {/* Trích dẫn */}
            <section className="rounded-[18px] bg-[#eee8df] px-5 py-6 text-center">
              <span className="font-serif text-3xl text-[#8d6bac]">
                “
              </span>
              <p className="font-serif text-lg italic leading-7 text-[#513c68]">
                Có những vùng đất không cần vội vàng, chỉ cần chậm lại để cảm nhận.
              </p>
              <div className="mx-auto mt-4 h-px w-10 bg-[#cbb9d9]" />
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b7e88]">
                Cảm hứng từ đất Cố đô
              </p>
            </section>
          </aside>
        </div>
      </div>

      {/* Hộp thoại thêm địa điểm vào chuyến đi */}
      {addingToTrip && (
        <AddToTripDialog
          place={placeSummarySchema.parse(place)}
          onClose={() => setAddingToTrip(false)}
        />
      )}
    </article>
  )
}

function QuickInfo({
  icon,
  label,
  value,
  note,
}: {
  icon: string
  label: string
  value: string
  note: string
}) {
  return (
    <div className="min-w-0 rounded-[16px] border border-[#eee6da] bg-[#f5f1e9] p-4 transition hover:border-[#d8c7e6]">
      <span className="flex size-8 items-center justify-center rounded-xl bg-white text-lg text-primary shadow-sm">
        {icon}
      </span>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8b7e88]">
        {label}
      </p>
      <p className="mt-2 break-words font-serif text-base font-semibold text-[#302536]">
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-5 text-[#8b7e88]">
        {note}
      </p>
    </div>
  )
}
