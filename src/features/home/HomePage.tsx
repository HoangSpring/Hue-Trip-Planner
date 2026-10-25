import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { tripDraftSchema, wizardDraftSchema } from '@shared/schemas'
import { getPlaces } from '@/lib/api'
import { PlaceCard } from '@/components/ui/PlaceCard'
import { brand } from '@/lib/brand'
import { paths } from '@/app/paths'
import { vi } from '@/lib/strings/vi'

function readLocalDraft(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as unknown : null
  } catch { return null }
}

export function readResumeDraft() {
  const trip = tripDraftSchema.safeParse(readLocalDraft('trip_draft_v1'))
  if (trip.success) return { title: trip.data.title, to: paths.tripDraft }
  const wizard = wizardDraftSchema.safeParse(readLocalDraft('wizard_draft_v1'))
  if (!wizard.success) return null
  const draft = wizard.data
  const possibleName = [draft.tripName, draft.title, draft.name].find((value): value is string => typeof value === 'string' && value.trim().length > 0)
  return { title: possibleName ?? vi.home.resumeWizard, to: paths.planGenerating }
}

export default function HomePage() {
  const featured = useQuery({ queryKey: ['featured-places'], queryFn: () => getPlaces({ featured: 'true', pageSize: 8 }), retry: 1 })
  const draft = useMemo(readResumeDraft, [])
  useEffect(() => {
    document.title = `${brand.tagline} · ${brand.name}`
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!description) { description = document.createElement('meta'); description.name = 'description'; document.head.append(description) }
    description.content = brand.description
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]')
    const ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]')
    if (ogTitle) ogTitle.content = `${brand.tagline} · ${brand.name}`
    if (ogDescription) ogDescription.content = brand.description
  }, [])

  return <>
    <section className="relative isolate overflow-hidden bg-[#efe9df]">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_22%,#d9c7a5_0%,transparent_36%),linear-gradient(115deg,#f7f1e5_0%,#eee6d7_58%,#e5e1d2_100%)]"/>
      <div className="mx-auto grid max-w-content items-center gap-8 px-4 py-16 md:grid-cols-[1.1fr_.9fr] md:px-8 md:py-24">
        <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-secondary">{vi.home.eyebrow}</p><h1 className="mt-4 font-serif text-4xl font-semibold leading-tight md:text-6xl">{vi.home.heroTitle}</h1><p className="mt-5 max-w-xl text-base leading-7 text-ink-muted md:text-lg">{vi.home.heroIntro}</p><div className="mt-7 flex flex-wrap gap-3"><Link to={paths.planNew} className="inline-flex min-h-12 items-center rounded-control bg-primary px-5 font-semibold text-white shadow-card">{vi.home.createTrip}</Link><Link to={paths.explore} className="inline-flex min-h-12 items-center rounded-control border border-primary bg-white/50 px-5 font-semibold text-primary">{vi.home.exploreHue}</Link></div>
          {draft && <div className="mt-7 flex max-w-md items-center justify-between gap-4 rounded-card border border-line bg-white/85 p-4 shadow-card"><div className="min-w-0"><p className="text-xs text-ink-muted">{vi.home.resumeTitle}</p><p className="mt-1 truncate font-semibold">{draft.title}</p></div><Link to={draft.to} className="min-h-10 shrink-0 rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white">{vi.home.openDraft}</Link></div>}
        </div>
        <div aria-hidden="true" className="relative mx-auto grid aspect-[4/3] w-full max-w-[520px] place-items-center overflow-hidden rounded-[34%_34%_18px_18px] border border-white/70 bg-[linear-gradient(160deg,#f9f4e8,#c5d3c8_56%,#8eaa9d)] shadow-card"><div className="absolute inset-x-0 bottom-0 h-[34%] bg-[linear-gradient(165deg,#6f9a98,#557f84)]"/><div className="absolute bottom-[27%] left-[14%] h-[43%] w-[28%] rounded-t-[48%] border-[9px] border-[#b58c57] bg-[#e8d7b4] shadow-[inset_0_0_0_5px_#f6ebd2]"/><div className="absolute bottom-[27%] left-[47%] h-[57%] w-[35%] rounded-t-[48%] border-[10px] border-[#9a784b] bg-[#ead9b8] shadow-[inset_0_0_0_6px_#f8efd9]"/><div className="absolute bottom-[27%] left-[58%] h-[38%] w-[12%] rounded-t-full bg-[#86684b]"/><span className="absolute right-6 top-6 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-primary">{vi.home.heroImageLabel}</span></div>
      </div>
    </section>

    <section className="mx-auto max-w-content px-4 py-16 md:px-8 md:py-20"><header className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-secondary">{vi.home.howTitle}</p><h2 className="mt-2 font-serif text-3xl">{vi.home.howIntro}</h2></header><div className="mt-8 grid gap-4 md:grid-cols-3">{vi.home.steps.map((step, index) => <article key={step.title} className="rounded-card border border-line bg-white p-6 shadow-card"><span className="grid size-10 place-items-center rounded-full bg-accent-tint font-serif text-lg font-semibold text-primary">0{index + 1}</span><h3 className="mt-4 font-serif text-xl">{step.title}</h3><p className="mt-2 text-sm leading-6 text-ink-muted">{step.body}</p></article>)}</div></section>

    {featured.isPending ? <section aria-label={vi.home.featuredTitle} className="mx-auto max-w-content px-4 pb-16 md:px-8"><div className="grid animate-pulse gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-72 rounded-card bg-[#eee9df]"/>)}</div></section> : featured.isError ? <section className="mx-auto max-w-content px-4 pb-16 md:px-8"><div className="rounded-card border border-line bg-white p-6 text-center"><p className="font-semibold">{vi.home.featuredError}</p><button onClick={() => void featured.refetch()} className="mt-3 font-semibold text-primary underline">{vi.home.retry}</button></div></section> : featured.data.items.length > 0 && <section className="bg-[#f1ede6]"><div className="mx-auto max-w-content px-4 py-16 md:px-8"><header className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-secondary">{vi.home.featuredTitle}</p><h2 className="mt-2 font-serif text-3xl">{vi.home.featuredIntro}</h2></div><Link to={paths.explore} className="hidden font-semibold text-primary underline underline-offset-4 sm:inline">{vi.home.exploreHue}</Link></header><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{featured.data.items.slice(0, 6).map((place) => <PlaceCard key={place.id} place={place}/>)}</div></div></section>}

    <section className="mx-auto max-w-content px-4 py-16 md:px-8 md:py-20"><div className="overflow-hidden rounded-card bg-primary p-6 text-white md:grid md:grid-cols-[.8fr_1.2fr] md:gap-8 md:p-10"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#e8b358]">{vi.home.sampleTitle}</p><h2 className="mt-3 font-serif text-3xl">{vi.home.sampleIntro}</h2><Link to={paths.planNew} className="mt-6 inline-flex min-h-11 items-center rounded-control bg-white px-4 font-semibold text-primary">{vi.home.createTrip}</Link></div><ol className="mt-8 space-y-4 border-l border-white/30 pl-5 md:mt-0">{vi.home.sampleParts.map((part, index) => <li key={part} className="relative"><span className="absolute -left-[27px] top-1 grid size-3 place-items-center rounded-full bg-[#e8b358]"/><p className="text-xs text-white/70">0{index + 1} · {vi.home.sampleStep}</p><p className="mt-1 font-serif text-xl">{part}</p></li>)}</ol></div></section>

    <section className="mx-auto max-w-3xl px-4 pb-20 md:px-8"><h2 className="text-center font-serif text-3xl">{vi.home.faqTitle}</h2><div className="mt-6 divide-y divide-line rounded-card border border-line bg-white px-5">{vi.home.faq.map((item) => <details key={item.question} className="group py-4"><summary className="cursor-pointer list-none pr-8 font-semibold marker:hidden">{item.question}<span className="float-right text-primary group-open:rotate-45">＋</span></summary><p className="mt-3 text-sm leading-6 text-ink-muted">{item.answer}</p></details>)}</div></section>
  </>
}
