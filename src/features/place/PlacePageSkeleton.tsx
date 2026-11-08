import { vi } from '@/lib/strings/vi'

const placeholder = 'animate-pulse rounded bg-[#eae3d7] motion-reduce:animate-none'

export function PlacePageSkeleton() {
  return (
    <article
      role="status"
      aria-label={vi.place.loading}
      className="min-h-[4812px] bg-[#fcf8f0] text-[#302536] lg:min-h-[2600px]"
    >
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pt-7">
        <div className={`${placeholder} h-5 w-48 rounded-full`} />
        <div className="mt-5 overflow-hidden rounded-[20px] border border-[#e9e1d6] bg-white">
          <div className={`${placeholder} aspect-[16/10] min-h-[250px] md:min-h-[380px] lg:min-h-[460px]`} />
          <div className="space-y-2 border-t border-line bg-white px-3 py-2">
            <div className={`${placeholder} h-3 w-32`} />
            <div className={`${placeholder} h-3 w-24`} />
          </div>
        </div>

        <div className="mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_350px] xl:gap-10">
          <div className="min-w-0 space-y-8">
            <section className="space-y-4">
              <div className="flex gap-2"><div className={`${placeholder} h-7 w-24 rounded-full`} /><div className={`${placeholder} h-7 w-32 rounded-full`} /></div>
              <h1 className="mt-4 break-words font-serif text-3xl font-semibold leading-tight tracking-tight text-[#29202d] sm:text-4xl lg:text-[42px]">{vi.place.loadingTitle}</h1>
              <div className={`${placeholder} h-4 w-full`} />
              <div className={`${placeholder} h-4 w-2/3`} />
              <div className={`${placeholder} h-4 w-3/4`} />
            </section>

            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 rounded-[16px] border border-[#eee6da] bg-white p-4"><div className={`${placeholder} h-3 w-2/3`} /><div className={`${placeholder} mt-4 h-5 w-full`} /><div className={`${placeholder} mt-3 h-3 w-1/2`} /></div>)}
            </section>

            <section className="space-y-4">
              <div className={`${placeholder} h-8 w-1/2`} />
              {Array.from({ length: 6 }, (_, index) => <div key={index} className={`${placeholder} h-4 w-full`} />)}
              <div className={`${placeholder} h-16 w-full`} />
            </section>

            <section className="space-y-4">
              <div className={`${placeholder} h-8 w-2/3`} />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
                {Array.from({ length: 4 }, (_, index) => <div key={index} className="overflow-hidden rounded-card border border-line bg-white"><div className={`${placeholder} aspect-[4/3]`} /><div className="space-y-3 p-4"><div className={`${placeholder} h-4 w-1/3`} /><div className={`${placeholder} h-5 w-4/5`} /><div className={`${placeholder} h-4 w-2/3`} /><div className={`${placeholder} mt-6 h-10 w-full`} /></div></div>)}
              </div>
            </section>
          </div>

          <aside className="space-y-4" aria-hidden="true">
            <section className="rounded-[20px] border border-[#eee6da] bg-white p-5">
              <div className={`${placeholder} h-6 w-2/3`} />
              <div className={`${placeholder} mt-5 h-4 w-full`} />
              <div className={`${placeholder} mt-2 h-4 w-3/4`} />
              <div className={`${placeholder} mt-5 h-12 w-full`} />
              <div className={`${placeholder} mt-5 h-[250px] w-full rounded-[15px]`} />
              <div className={`${placeholder} mt-4 h-11 w-full`} />
              <div className="mt-6 border-t border-dashed border-line pt-5">
                <div className={`${placeholder} h-5 w-1/2`} />
                <div className={`${placeholder} mt-4 h-4 w-full`} />
                <div className={`${placeholder} mt-2 h-4 w-4/5`} />
                <div className={`${placeholder} mt-6 h-4 w-full`} />
                <div className={`${placeholder} mt-2 h-4 w-2/3`} />
              </div>
            </section>
            <section className="space-y-4 rounded-[18px] bg-[#eee8df] px-5 py-6">
              <div className={`${placeholder} mx-auto h-6 w-3/4`} />
              <div className={`${placeholder} h-4 w-full`} />
              <div className={`${placeholder} h-4 w-5/6`} />
              <div className={`${placeholder} h-4 w-2/3`} />
            </section>
          </aside>
        </div>
      </div>
    </article>
  )
}
