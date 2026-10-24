import { useState } from 'react'
import { Button, BottomSheet, Chip, ChipGroup, Dialog, EmptyState, Skeleton, Toast } from '@/components/ui'
import { vi } from '@/lib/strings/vi'

export function ComponentGalleryPage() {
  const [dialog, setDialog] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [toast, setToast] = useState(false)
  const [selected, setSelected] = useState('heritage')
  const labels = [vi.components.chipHeritage, vi.components.chipFood, vi.components.chipCafe]
  const keys = ['heritage', 'food', 'cafe']
  return <main className="mx-auto max-w-content space-y-10 px-5 py-10 md:px-8">
    <header><p className="text-sm font-semibold uppercase tracking-wider text-primary">{vi.components.demoNote}</p><h1 className="mt-2 font-heading text-4xl">{vi.components.demoTitle}</h1></header>
    <section className="space-y-4"><h2 className="font-heading text-2xl">Button</h2><div className="flex flex-wrap items-center gap-3"><Button>{vi.components.primary}</Button><Button variant="secondary">{vi.components.secondary}</Button><Button variant="tertiary" size="sm">{vi.components.tertiary}</Button><Button variant="danger">{vi.components.danger}</Button><Button loading>{vi.components.loading}</Button><Button disabled>{vi.components.secondary}</Button></div></section>
    <section className="space-y-4"><h2 className="font-heading text-2xl">Chip / ChipGroup</h2><ChipGroup label={vi.components.demoTitle}>{keys.map((key, i) => <Chip key={key} selected={selected === key} onClick={() => setSelected(key)}>{labels[i]}</Chip>)}</ChipGroup></section>
    <section className="space-y-4"><h2 className="font-heading text-2xl">Dialog / BottomSheet / SidePanel</h2><div className="flex gap-3"><Button variant="secondary" onClick={() => setDialog(true)}>{vi.components.openDialog}</Button><Button variant="secondary" onClick={() => setSheet(true)}>{vi.components.openPanel}</Button></div></section>
    <section className="space-y-4"><h2 className="font-heading text-2xl">Toast / Skeleton</h2><Button onClick={() => { setToast(true); window.setTimeout(() => setToast(false), 3000) }}>{vi.components.showToast}</Button><Skeleton className="h-24 w-full max-w-sm"/></section>
    <section className="space-y-4"><h2 className="font-heading text-2xl">EmptyState</h2><EmptyState title={vi.components.emptyTitle}>{vi.components.emptyBody}</EmptyState></section>
    <Dialog open={dialog} onClose={() => setDialog(false)} title={vi.components.dialogTitle} actions={<><Button variant="secondary" onClick={() => setDialog(false)}>{vi.components.cancel}</Button><Button onClick={() => setDialog(false)}>{vi.components.confirm}</Button></>}>{vi.components.dialogBody}</Dialog>
    <BottomSheet open={sheet} onClose={() => setSheet(false)} title={vi.components.demoTitle}><p className="text-ink-muted">{vi.components.dialogBody}</p><Button className="mt-5" onClick={() => setSheet(false)}>{vi.components.close}</Button></BottomSheet>
    {toast && <Toast message={vi.components.toast} action={<button className="min-h-11 font-semibold text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" onClick={() => setToast(false)}>{vi.components.undo}</button>} />}
  </main>
}
