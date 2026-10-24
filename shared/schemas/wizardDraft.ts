import { z } from 'zod'

// Wizard fields are populated in stages; each step validates its own form schema.
export const wizardDraftSchema = z.record(z.string(), z.unknown())
export type WizardDraft = z.infer<typeof wizardDraftSchema>
