import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { vi } from '@/lib/strings/vi'
import { generateTripApi, ApiRequestError } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import {
  readStoredWizardDraft,
  formValuesToTripInput,
  writeStoredTripDraft,
  clearStoredWizardDraft,
  writeStoredNotices,
  isLocalStorageAvailable,
} from './storage'
import type { TripInput } from '@shared/schemas'

type StageStatus = 'pending' | 'processing' | 'done'


export function GeneratingPage() {
  const navigate = useNavigate()
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [errorState, setErrorState] = useState<{
    code: 'RATE_LIMITED' | 'NO_CANDIDATES' | 'NETWORK' | 'GENERIC'
    title: string
    body: string
    retryAfter?: number
    loginHint?: boolean
  } | null>(null)
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null)
  const [storageWarning, setStorageWarning] = useState(false)
  const [numDays, setNumDays] = useState(2)

  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  const stages = vi.generating.steps

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    navigate(`${paths.planNew}?step=6`)
  }, [navigate])

  const startGeneration = useCallback(async () => {
    setErrorState(null)
    setRetryCountdown(null)
    setCurrentStageIndex(0)

    // Read stored wizard draft
    const wizardDraft = readStoredWizardDraft()
    if (!wizardDraft || !wizardDraft.values) {
      navigate(paths.planNew, { replace: true })
      return
    }

    setNumDays(wizardDraft.values.numDays || 2)

    let input: TripInput
    try {
      input = wizardDraft.input ?? formValuesToTripInput(wizardDraft.values)
    } catch {
      navigate(`${paths.planNew}?step=6`, { replace: true })
      return
    }

    // Advance UI stage indicator at gentle intervals
    const stageTimer1 = setTimeout(() => setCurrentStageIndex(1), 1200)
    const stageTimer2 = setTimeout(() => setCurrentStageIndex(2), 2600)
    const stageTimer3 = setTimeout(() => setCurrentStageIndex(3), 4200)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await generateTripApi(
        { input },
        controller.signal
      )

      clearTimeout(stageTimer1)
      clearTimeout(stageTimer2)
      clearTimeout(stageTimer3)

      if (!isMountedRef.current) return

      // Write trip draft to storage
      writeStoredTripDraft(response.draft)

      // Store notices (e.g. FEW_CANDIDATES, FALLBACK_USED) for display on /trip/draft
      if (response.notices && response.notices.length > 0) {
        writeStoredNotices(response.notices)
      }

      // Clear wizard draft now that generation succeeded
      clearStoredWizardDraft()

      // Replace navigation to /trip/draft so Back button does not return to generating
      navigate(paths.tripDraft, { replace: true })
    } catch (err: unknown) {
      clearTimeout(stageTimer1)
      clearTimeout(stageTimer2)
      clearTimeout(stageTimer3)

      if (!isMountedRef.current) return

      if (err instanceof DOMException && err.name === 'AbortError') {
        // User clicked cancel
        return
      }

      if (err instanceof ApiRequestError) {
        if (err.status === 429) {
          const retryHeader = err.headers?.get('Retry-After')
          const retrySec = retryHeader ? parseInt(retryHeader, 10) : 60
          const seconds = !isNaN(retrySec) && retrySec > 0 ? retrySec : 60

          setErrorState({
            code: 'RATE_LIMITED',
            title: vi.generating.errors.rateLimitedTitle,
            body: vi.generating.errors.rateLimitedBody(seconds),
            retryAfter: seconds,
            loginHint: true,
          })
          setRetryCountdown(seconds)
          return
        }

        if (err.status === 422 || err.payload.error.code === 'NO_CANDIDATES') {
          setErrorState({
            code: 'NO_CANDIDATES',
            title: vi.generating.errors.noCandidatesTitle,
            body: vi.generating.errors.noCandidatesBody,
          })
          return
        }
      }

      if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
        setErrorState({
          code: 'NETWORK',
          title: vi.generating.errors.networkErrorTitle,
          body: vi.generating.errors.networkErrorBody,
        })
        return
      }

      setErrorState({
        code: 'GENERIC',
        title: vi.generating.errors.genericErrorTitle,
        body: err instanceof Error ? err.message : vi.generating.errors.genericErrorBody,
      })
    }
  }, [navigate])

  useEffect(() => {
    isMountedRef.current = true
    if (!isLocalStorageAvailable()) {
      setStorageWarning(true)
    }

    startGeneration()

    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [startGeneration])

  // Countdown timer for 429
  useEffect(() => {
    if (retryCountdown === null || retryCountdown <= 0) return
    const timer = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [retryCountdown])

  return (
    <div className="mx-auto max-w-[620px] px-4 py-8 md:py-12">
      {storageWarning && (
        <div className="mb-6 rounded-control bg-accent-tint/60 p-3 text-xs text-ink border border-accent/30" role="alert">
          {vi.generating.storageWarning}
        </div>
      )}

      {errorState ? (
        /* Error View State */
        <div className="flex flex-col gap-6 rounded-card bg-surface p-6 sm:p-8 shadow-card border border-line">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 grid size-14 place-items-center rounded-full bg-danger/10 text-danger text-2xl" aria-hidden="true">
              {errorState.code === 'RATE_LIMITED' ? '⏳' : errorState.code === 'NO_CANDIDATES' ? '🔍' : '⚠️'}
            </div>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              {errorState.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted max-w-md">
              {errorState.code === 'RATE_LIMITED' && retryCountdown !== null && retryCountdown > 0
                ? vi.generating.errors.rateLimitedBody(retryCountdown)
                : errorState.body}
            </p>
            {errorState.loginHint && (
              <p className="mt-3 text-xs font-medium text-primary bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20">
                {vi.generating.errors.rateLimitedGuestHint}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => {
                const backStep = errorState.code === 'NO_CANDIDATES' ? 3 : 6
                navigate(`${paths.planNew}?step=${backStep}`)
              }}
            >
              {vi.generating.backToEdit}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={retryCountdown !== null && retryCountdown > 0}
              onClick={() => startGeneration()}
            >
              {retryCountdown !== null && retryCountdown > 0
                ? `${vi.generating.retry} (${retryCountdown}s)`
                : vi.generating.retry}
            </Button>
          </div>
        </div>
      ) : (
        /* Processing / Staged Progress View */
        <div className="flex flex-col items-center text-center">
          {/* Animated Spinner Icon */}
          <div className="relative mb-6">
            <div className="grid size-20 place-items-center rounded-full bg-primary/10 text-primary text-3xl shadow-sm">
              <span className="animate-spin" aria-hidden="true">⚙️</span>
            </div>
            <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-accent text-white text-xs font-bold shadow-md">
              ✦
            </span>
          </div>

          <h1 className="font-serif text-2xl font-semibold text-ink md:text-3xl">
            {vi.generating.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted max-w-md">
            {vi.generating.subtitle(numDays)}
          </p>

          {/* Stepped Progress Stages Card */}
          <div className="mt-8 w-full rounded-card bg-surface p-5 sm:p-6 shadow-card border border-line text-left">
            <div className="flex flex-col gap-4">
              {stages.map((stage, idx) => {
                let status: StageStatus = 'pending'
                if (idx < currentStageIndex) status = 'done'
                else if (idx === currentStageIndex) status = 'processing'

                return (
                  <div key={stage.id} className="flex flex-col gap-3">
                    <div className="flex items-center gap-3.5">
                      {status === 'done' ? (
                        <div className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-white text-xs font-bold shadow-xs">
                          ✓
                        </div>
                      ) : status === 'processing' ? (
                        <div className="relative grid size-7 shrink-0 place-items-center rounded-full bg-primary/20 text-primary">
                          <span className="absolute size-5 animate-ping rounded-full bg-primary/30" />
                          <span className="size-2.5 rounded-full bg-primary" />
                        </div>
                      ) : (
                        <div className="grid size-7 shrink-0 place-items-center rounded-full bg-bg text-ink-muted/50 border border-line text-xs font-medium">
                          •
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${
                          status === 'processing'
                            ? 'text-primary'
                            : status === 'done'
                            ? 'text-ink'
                            : 'text-ink-muted/60'
                        }`}>
                          {stage.label}
                        </p>
                        <p className="text-xs text-ink-muted truncate">
                          {stage.detail}
                        </p>
                      </div>

                      <span className={`text-xs font-medium ${
                        status === 'done'
                          ? 'text-secondary font-semibold'
                          : status === 'processing'
                          ? 'text-primary font-semibold'
                          : 'text-ink-muted/50'
                      }`}>
                        {status === 'done'
                          ? vi.generating.statusDone
                          : status === 'processing'
                          ? vi.generating.statusProcessing
                          : vi.generating.statusPending}
                      </span>
                    </div>

                    {idx < stages.length - 1 && (
                      <div className="ml-3.5 h-2 w-px bg-line/60" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cultural Insight Card */}
          <div className="mt-5 flex w-full items-center gap-3 rounded-card bg-accent-tint/30 p-3.5 border border-accent/20 text-left">
            <span className="text-xl text-accent" aria-hidden="true">💡</span>
            <p className="text-xs leading-relaxed text-ink">
              <strong className="font-semibold text-ink">Mẹo nhỏ:</strong> {vi.generating.insightTip}
            </p>
          </div>

          {/* Cancel Action */}
          <div className="mt-8">
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm font-medium text-ink-muted hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger rounded-control px-4 py-2 transition-colors"
            >
              {vi.generating.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GeneratingPage
