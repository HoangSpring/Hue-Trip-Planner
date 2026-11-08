import { useQuery } from '@tanstack/react-query'
import { getPlaces } from '@/lib/api'
import { PlaceCard } from '@/components/ui/PlaceCard'
import { paths } from '@/app/paths'
import { Link } from 'react-router-dom'
import { vi } from '@/lib/strings/vi'
import { readStoredTripDraft, readStoredWizardDraft } from '@/features/trip-wizard/storage'

export function readResumeDraft(): { title: string; to: string } | null {
  const tripDraft = readStoredTripDraft()
  if (tripDraft) return { title: tripDraft.title, to: paths.tripDraft }

  const wizardDraft = readStoredWizardDraft()
  if (!wizardDraft) return null
  let savedTitle: unknown
  try {
    const raw = localStorage.getItem('wizard_draft_v1')
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed === 'object' && parsed !== null && 'tripName' in parsed) savedTitle = parsed.tripName
    }
  } catch {
    return null
  }
  const title = typeof savedTitle === 'string' && savedTitle.trim() ? savedTitle.trim().slice(0, 120) : vi.home.resumeWizard
  return { title, to: paths.planGenerating }
}

export default function HomePage() {
  const featured = useQuery({ queryKey: ['featured-places'], queryFn: () => getPlaces({ featured: 'true', pageSize: 8 }), retry: 1 })
  const resumeDraft = readResumeDraft()

  return <>
    <section className="mx-auto max-w-content px-4 py-16 md:px-8 md:py-20">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-secondary">{vi.home.howTitle}</p>
        <h2 className="mt-2 font-serif text-3xl">{vi.home.howIntro}</h2>
      </header>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {vi.home.steps.map((step, index) => (
          <article key={step.title} className="rounded-card border border-line bg-white p-6 shadow-card">
            <span className="grid size-10 place-items-center rounded-full bg-accent-tint font-serif text-lg font-semibold text-primary">0{index + 1}</span>
            <h3 className="mt-4 font-serif text-xl">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-muted">{step.body}</p>
          </article>
        ))}
      </div>
    </section>

    {resumeDraft && <section className="mx-auto max-w-content px-4 pb-8 md:px-8"><div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-5 shadow-card"><div><p className="text-sm text-ink-muted">{vi.home.resumeTitle}</p><h2 className="mt-1 font-serif text-xl">{resumeDraft.title}</h2></div><Link className="inline-flex min-h-11 items-center rounded-control bg-primary px-4 font-semibold text-white" to={resumeDraft.to}>{vi.home.openDraft}</Link></div></section>}

    {featured.isPending ? (
      <section aria-label={vi.home.featuredTitle} className="bg-[#f1ede6]">
        <div className="mx-auto max-w-content px-4 py-16 md:px-8">
          <header className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-secondary">{vi.home.featuredTitle}</p>
            <h2 className="mt-2 font-serif text-3xl">{vi.home.featuredIntro}</h2>
          </header>
          <div className="grid animate-pulse gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-[430px] rounded-card border border-line bg-white shadow-card">
                <div className="aspect-[4/3] rounded-t-card bg-[#e7e0d5]" />
                <div className="space-y-4 p-4"><div className="h-5 w-1/3 rounded-full bg-[#e7e0d5]" /><div className="h-6 w-4/5 rounded bg-[#e7e0d5]" /><div className="h-4 w-2/3 rounded bg-[#e7e0d5]" /><div className="mt-8 h-10 rounded-control bg-[#e7e0d5]" /></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    ) : featured.isError ? (
      <section className="mx-auto max-w-content px-4 pb-16 md:px-8">
        <div className="rounded-card border border-line bg-white p-6 text-center">
          <p className="font-semibold">{vi.home.featuredError}</p>
          <button onClick={() => void featured.refetch()} className="mt-3 font-semibold text-primary underline">{vi.home.retry}</button>
        </div>
      </section>
    ) : featured.data.items.length > 0 && (
      <section className="bg-[#f1ede6]">
        <div className="mx-auto max-w-content px-4 py-16 md:px-8">
          <header className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-secondary">{vi.home.featuredTitle}</p>
              <h2 className="mt-2 font-serif text-3xl">{vi.home.featuredIntro}</h2>
            </div>
            <Link to={paths.explore} className="hidden font-semibold text-primary underline underline-offset-4 sm:inline">{vi.home.exploreHue}</Link>
          </header>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.data.items.slice(0, 6).map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </div>
      </section>
    )}

    <section className="mx-auto max-w-content px-4 py-16 md:px-8 md:py-20">
      <div className="overflow-hidden rounded-card bg-primary p-6 text-white md:grid md:grid-cols-[.8fr_1.2fr] md:gap-8 md:p-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#e8b358]">{vi.home.sampleTitle}</p>
          <h2 className="mt-3 font-serif text-3xl">{vi.home.sampleIntro}</h2>
          <Link to={paths.planNew} className="mt-6 inline-flex min-h-11 items-center rounded-control bg-white px-4 font-semibold text-primary">{vi.home.createTrip}</Link>
        </div>
        <ol className="mt-8 space-y-4 border-l border-white/30 pl-5 md:mt-0">
          {vi.home.sampleParts.map((part, index) => (
            <li key={part} className="relative">
              <span className="absolute -left-[27px] top-1 grid size-3 place-items-center rounded-full bg-[#e8b358]" />
              <p className="text-xs text-white/70">0{index + 1} · {vi.home.sampleStep}</p>
              <p className="mt-1 font-serif text-xl">{part}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>

    <section className="mx-auto max-w-3xl px-4 pb-20 md:px-8">
      <h2 className="text-center font-serif text-3xl">{vi.home.faqTitle}</h2>
      <div className="mt-6 divide-y divide-line rounded-card border border-line bg-white px-5">
        {vi.home.faq.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="cursor-pointer list-none pr-8 font-semibold marker:hidden">
              {item.question}
              <span className="float-right text-primary group-open:rotate-45">＋</span>
            </summary>
            <p className="mt-3 text-sm leading-6 text-ink-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  </>
}
