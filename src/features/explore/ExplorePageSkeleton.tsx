import { vi } from '@/lib/strings/vi'

const skeleton = 'animate-pulse rounded bg-[#eae3d8] motion-reduce:animate-none'

function PlaceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#eee6dc] bg-white shadow-sm" aria-hidden="true">
      <div className={`${skeleton} aspect-[4/3]`} />
      <div className="space-y-3 p-4">
        <div className={`${skeleton} h-4 w-1/3 rounded-full`} />
        <div className={`${skeleton} h-5 w-4/5`} />
        <div className={`${skeleton} h-3 w-full`} />
        <div className={`${skeleton} h-3 w-2/3`} />
        <div className={`${skeleton} h-9 rounded-xl`} />
      </div>
    </div>
  )
}

export function ExplorePageSkeleton() {
  return (
    <div aria-busy="true" aria-label={vi.explore.loading} className="min-h-screen bg-[#fbf7ef] text-[#30263b]">
      <section className="relative overflow-hidden border-b border-[#eee6d9] bg-[#f7f2e9]">
        <div className="mx-auto max-w-[1600px] px-4 pb-7 pt-7 md:px-8 md:pb-9 md:pt-10">
          <nav aria-label="Đường dẫn" className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#62584f]">
            <span className="font-semibold uppercase tracking-wide text-[#79541c]">◉ Danh bạ Cố Đô</span><span aria-hidden="true">/</span><span>Khám phá toàn diện</span>
          </nav>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#247466]">Hành trình di sản · Văn hóa · Ẩm thực</p>
              <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#25231e] sm:text-4xl md:text-5xl">Khám phá Cố Đô Huế</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f675f] md:text-base">Khám phá những di tích lịch sử, danh lam thắng cảnh, ẩm thực truyền thống và không gian văn hóa đặc sắc bên dòng Hương Giang.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#62584f]"><span className="rounded-full bg-white/80 px-3 py-2">Cập nhật địa điểm</span><span className="rounded-full bg-white/80 px-3 py-2">Di sản và văn hóa Huế</span></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 pt-5 md:px-8 md:pt-7">
        <div className="rounded-2xl border border-[#eee6dc] bg-white p-3 shadow-[0_4px_18px_rgba(65,45,25,0.05)] md:p-4">
          <section className="mt-8 rounded-card border border-line bg-white p-4 shadow-card md:p-6" aria-hidden="true">
            <div className="h-4 w-40 rounded bg-[#eee8df]" />
            <div className="mt-2 flex min-h-12 gap-3"><div className={`${skeleton} flex-1`} /><div className={`${skeleton} w-36`} /></div>
            <div className="mt-4 flex flex-wrap gap-2">{Array.from({ length: 5 }, (_, index) => <div key={`category-${index}`} className={`${skeleton} h-10 w-24 rounded-full`} />)}</div>
            <div className="mt-4 flex flex-wrap gap-2">{Array.from({ length: 10 }, (_, index) => <div key={`tag-${index}`} className={`${skeleton} h-9 w-28 rounded-full`} />)}</div>
          </section>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0ebe3] pt-3"><div className={`${skeleton} h-5 w-80 max-w-full`} /></div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 pb-12 pt-7 md:px-8 md:pb-16 md:pt-9">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#247466]">Hành trình của bạn</p><h2 className="mt-2 font-serif text-2xl font-bold text-[#30263b] md:text-3xl">Khám phá điểm đến</h2><p className="mt-2 text-sm text-[#62584f]">{vi.explore.loadingCount}</p></div>
        </div>
        <div role="status" className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 24 }, (_, index) => <PlaceCardSkeleton key={index} />)}
        </div>
      </section>
    </div>
  )
}
