import { useEffect, useRef, type ReactNode } from 'react'

export function Dialog({ open, onClose, title, children, actions }: { open: boolean; onClose: () => void; title: string; children: ReactNode; actions?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return <dialog ref={ref} aria-labelledby="ui-dialog-title" onClose={onClose} onClick={event => { if (event.target === ref.current) onClose() }} className="w-[min(32rem,calc(100%-2rem))] rounded-card p-0 text-ink shadow-card backdrop:bg-ink/40">
    <div className="p-6"><h2 id="ui-dialog-title" className="font-heading text-2xl">{title}</h2><div className="mt-3 text-ink-muted">{children}</div>{actions && <div className="mt-6 flex justify-end gap-3">{actions}</div>}</div>
  </dialog>
}
