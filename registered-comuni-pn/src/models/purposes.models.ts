import { z } from 'zod'

const purposeStateSchema = z.union([
  z.literal('Active'),
  z.literal('Suspended'),
  z.literal('WaitingForApproval'),
  z.literal('Archived'),
  z.literal('Draft'),
])

export const purposeSchema = z.object({
  id: z.string(),
  consumerId: z.string(),
  versions: z.array(
    z.object({
      firstActivationAt: z.string().optional(),
      state: purposeStateSchema,
    })
  ),
})

export type Purpose = z.infer<typeof purposeSchema>
export type PurposeState = z.infer<typeof purposeStateSchema>

export const purposesSchema = z.array(purposeSchema)
export type Purposes = z.infer<typeof purposesSchema>
