import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { paths } from '@/app/paths'
import { getPublicMeta } from '@/lib/api'
import { vi } from '@/lib/strings/vi'
import { Button } from '@/components/ui/Button'
import {
  type TripWizardFormValues,
  defaultWizardValues,
  formValuesToTripInput,
  isLocalStorageAvailable,
  readStoredWizardDraft,
  writeStoredWizardDraft,
  clearStoredWizardDraft,
} from './storage'
import { WizardProgress } from './components/WizardProgress'
import { ResumeDraftDialog } from './components/ResumeDraftDialog'
import { Step1Time } from './components/Step1Time'
import { Step2Companions } from './components/Step2Companions'
import { Step3Interests, type InterestTagItem } from './components/Step3Interests'
import { Step4Style } from './components/Step4Style'
import { Step5Start } from './components/Step5Start'
import { Step6Summary } from './components/Step6Summary'

const defaultInterestsList: InterestTagItem[] = [
  { slug: 'heritage', name: 'Di sản & cung đình' },
  { slug: 'history', name: 'Lịch sử & lăng tẩm' },
  { slug: 'spiritual', name: 'Chùa chiền & tâm linh' },
  { slug: 'river', name: 'Sông Hương & ngắm cảnh' },
  { slug: 'cuisine', name: 'Ẩm thực Huế' },
  { slug: 'cafe', name: 'Cà phê & thư giãn' },
  { slug: 'photography', name: 'Chụp ảnh & check-in' },
  { slug: 'nature', name: 'Thiên nhiên & ngoại ô' },
  { slug: 'local-life', name: 'Đời sống địa phương' },
  { slug: 'shopping', name: 'Quà & mua sắm' },
]

export function TripWizardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const rawStep = Number(searchParams.get('step'))
  const currentStep = rawStep >= 1 && rawStep <= 6 ? rawStep : 1

  const [redirectNotice, setRedirectNotice] = useState<string | null>(() => {
    return (location.state as { notice?: string } | null)?.notice ?? null
  })

  const [values, setValues] = useState<TripWizardFormValues>(() => {
    const existing = readStoredWizardDraft()
    return existing?.values ?? defaultWizardValues
  })
  const [stepErrors, setStepErrors] = useState<Record<number, string>>({})
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false)
  const [savedDraftToResume, setSavedDraftToResume] = useState<TripWizardFormValues | null>(null)
  const [savedStepToResume, setSavedStepToResume] = useState<number>(1)
  const [storageWarning, setStorageWarning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const shouldSkipAutoSaveRef = useRef(false)

  // Query metadata for interest tags and startPoints
  const metaQuery = useQuery({
    queryKey: ['public-meta'],
    queryFn: getPublicMeta,
    staleTime: 10 * 60 * 1000,
  })

  const availableTags: InterestTagItem[] = useMemo(() => {
    if (metaQuery.data?.tags && metaQuery.data.tags.length > 0) {
      return metaQuery.data.tags.map((t) => ({
        slug: t.slug,
        name: t.name,
        icon: t.icon,
        imageUrl: t.imageUrl,
      }))
    }
    return defaultInterestsList
  }, [metaQuery.data?.tags])

  const startPoints = useMemo(() => {
    return metaQuery.data?.startPoints ?? []
  }, [metaQuery.data?.startPoints])

  // Check storage availability and existing draft on mount
  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      setStorageWarning(true)
    }

    const existingDraft = readStoredWizardDraft()
    if (existingDraft && existingDraft.values) {
      const hasProgress =
        existingDraft.step > 1 ||
        existingDraft.values.companion !== null ||
        existingDraft.values.interests.length > 0 ||
        existingDraft.values.numDays !== 2

      // Only prompt if user arrived at /plan/new without an explicit step param
      if (!searchParams.get('step') && hasProgress) {
        setSavedDraftToResume(existingDraft.values)
        setSavedStepToResume(existingDraft.step || 1)
        setResumeDialogOpen(true)
      }
    }
  }, [searchParams])

  // Auto-save draft on every change of values or step
  useEffect(() => {
    if (shouldSkipAutoSaveRef.current) {
      shouldSkipAutoSaveRef.current = false
      return
    }
    writeStoredWizardDraft({
      step: currentStep,
      values,
      updatedAt: new Date().toISOString(),
    })
  }, [values, currentStep])

  const setStep = (nextStep: number) => {
    const clamped = Math.max(1, Math.min(6, nextStep))
    setSearchParams({ step: String(clamped) })
    if (typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch {
        // Safe fallback in test environments
      }
    }
  }

  const handleResume = () => {
    if (savedDraftToResume) {
      setValues(savedDraftToResume)
      if (!searchParams.get('step') && savedStepToResume > 1) {
        setStep(savedStepToResume)
      }
    }
    setResumeDialogOpen(false)
  }

  const handleRestart = () => {
    shouldSkipAutoSaveRef.current = true
    clearStoredWizardDraft()
    setValues(defaultWizardValues)
    setStepErrors({})
    setStep(1)
    setResumeDialogOpen(false)
  }

  // Step Validation logic
  const validateCurrentStep = (): boolean => {
    const nextErrors = { ...stepErrors }
    delete nextErrors[currentStep]

    if (currentStep === 1) {
      if (values.numDays < 1 || values.numDays > 5) {
        nextErrors[1] = 'Số ngày du lịch phải từ 1 đến 5 ngày.'
        setStepErrors(nextErrors)
        return false
      }
    } else if (currentStep === 2) {
      if (!values.companion) {
        nextErrors[2] = 'Vui lòng chọn người đồng hành cùng bạn.'
        setStepErrors(nextErrors)
        return false
      }
    } else if (currentStep === 3) {
      if (values.interests.length < 2) {
        nextErrors[3] = vi.wizard.errorMinInterests
        setStepErrors(nextErrors)
        return false
      }
      if (values.interests.length > 6) {
        nextErrors[3] = vi.wizard.errorMaxInterests
        setStepErrors(nextErrors)
        return false
      }
    } else if (currentStep === 4) {
      if (!values.pace) {
        nextErrors[4] = 'Vui lòng chọn nhịp độ chuyến đi.'
        setStepErrors(nextErrors)
        return false
      }
    } else if (currentStep === 5) {
      if (values.notes.length > 300) {
        nextErrors[5] = vi.wizard.errorNotesTooLong
        setStepErrors(nextErrors)
        return false
      }
    }

    setStepErrors(nextErrors)
    return true
  }

  const handleNext = () => {
    if (!validateCurrentStep()) return
    if (currentStep < 6) {
      setStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setStep(currentStep - 1)
    } else {
      navigate(paths.home)
    }
  }

  // Field change handlers
  const updateValue = <K extends keyof TripWizardFormValues>(key: K, val: TripWizardFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: val }))
    if (stepErrors[currentStep]) {
      setStepErrors((prev) => {
        const copy = { ...prev }
        delete copy[currentStep]
        return copy
      })
    }
  }

  const handleToggleInterest = (slug: string) => {
    const current = values.interests
    if (current.includes(slug)) {
      updateValue('interests', current.filter((s) => s !== slug))
    } else {
      if (current.length >= 6) {
        setStepErrors((prev) => ({ ...prev, 3: vi.wizard.errorMaxInterests }))
        return
      }
      updateValue('interests', [...current, slug])
    }
  }

  const handleSubmit = () => {
    try {
      setIsSubmitting(true)
      const input = formValuesToTripInput(values)

      // Save draft containing complete TripInput ready for generator
      writeStoredWizardDraft({
        step: 6,
        values,
        input,
        updatedAt: new Date().toISOString(),
      })

      navigate(paths.planGenerating)
    } catch {
      setIsSubmitting(false)
      setStepErrors((prev) => ({
        ...prev,
        6: vi.wizard.validationMissingFields,
      }))
    }
  }

  return (
    <div className="mx-auto max-w-[720px] pb-16">
      {/* Storage Warning if localStorage is blocked */}
      {storageWarning && (
        <div className="mb-4 rounded-control bg-accent-tint/60 p-3 text-xs text-ink border border-accent/30" role="alert">
          {vi.generating.storageWarning}
        </div>
      )}

      {/* Redirect Notice (e.g. from RequireTripDraft guard) */}
      {redirectNotice && (
        <div className="mb-4 flex items-center justify-between rounded-control border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-secondary" role="status">
          <div className="flex items-center gap-2">
            <span aria-hidden="true">ℹ️</span>
            <span>{redirectNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setRedirectNotice(null)}
            className="text-xs font-semibold hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Wizard Progress Bar & Header */}
      <WizardProgress
        currentStep={currentStep}
        onBack={handleBack}
        canBack={currentStep > 1}
      />

      {/* Active Step Content */}
      <main className="min-h-[380px]">
        {currentStep === 1 && (
          <Step1Time
            numDays={values.numDays}
            startDate={values.startDate}
            onChangeDays={(days) => updateValue('numDays', days)}
            onChangeStartDate={(date) => updateValue('startDate', date)}
            error={stepErrors[1]}
          />
        )}

        {currentStep === 2 && (
          <Step2Companions
            companion={values.companion}
            groupSize={values.groupSize}
            onChangeCompanion={(comp) => updateValue('companion', comp)}
            onChangeGroupSize={(size) => updateValue('groupSize', size)}
            error={stepErrors[2]}
          />
        )}

        {currentStep === 3 && (
          <Step3Interests
            interests={values.interests}
            availableTags={availableTags}
            loading={metaQuery.isLoading && availableTags.length === 0}
            onToggleInterest={handleToggleInterest}
            error={stepErrors[3]}
          />
        )}

        {currentStep === 4 && (
          <Step4Style
            pace={values.pace}
            budget={values.budget}
            transport={values.transport}
            onChangePace={(p) => updateValue('pace', p)}
            onChangeBudget={(b) => updateValue('budget', b)}
            onChangeTransport={(t) => updateValue('transport', t)}
            error={stepErrors[4]}
          />
        )}

        {currentStep === 5 && (
          <Step5Start
            start={values.start}
            notes={values.notes}
            startPoints={startPoints}
            onChangeStart={(s) => updateValue('start', s)}
            onChangeNotes={(n) => updateValue('notes', n)}
            error={stepErrors[5]}
          />
        )}

        {currentStep === 6 && (
          <Step6Summary
            values={values}
            availableTags={availableTags}
            onJumpToStep={setStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={stepErrors[6]}
          />
        )}
      </main>

      {/* Navigation Action Bar for Steps 1 to 5 */}
      {currentStep < 6 && (
        <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleBack}
          >
            {vi.wizard.back}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleNext}
            className="min-w-32 shadow-sm"
          >
            {vi.wizard.next}
          </Button>
        </div>
      )}

      {/* Resume Draft Dialog */}
      <ResumeDraftDialog
        open={resumeDialogOpen}
        onResume={handleResume}
        onRestart={handleRestart}
      />
    </div>
  )
}

export default TripWizardPage
