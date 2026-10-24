import { useEffect, useRef, type ReactNode } from 'react'

export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return <dialog ref={ref} aria-labelledby="ui-sheet-title" onClose={onClose} onClick={event => { if (event.target === ref.current) onClose() }} className="m-0 mt-auto max-h-[85vh] w-full max-w-2xl rounded-t-card p-0 text-ink shadow-card backdrop:bg-ink/40 md:mx-auto md:my-auto md:rounded-card">
    <section className="p-6"><div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line md:hidden"/><h2 id="ui-sheet-title" className="font-heading text-2xl">{title}</h2><div className="mt-4">{children}</div></section>
  </dialog>
}

export const SidePanel = BottomSheet
