import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { vi } from '@/lib/strings/vi'

interface ResumeDraftDialogProps {
  open: boolean
  onResume: () => void
  onRestart: () => void
}

export function ResumeDraftDialog({ open, onResume, onRestart }: ResumeDraftDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onResume}
      title={vi.wizard.resumeTitle}
      actions={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRestart}
          >
            {vi.wizard.resumeRestart}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onResume}
          >
            {vi.wizard.resumeContinue}
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-ink-muted">
        {vi.wizard.resumeBody}
      </p>
    </Dialog>
  )
}
