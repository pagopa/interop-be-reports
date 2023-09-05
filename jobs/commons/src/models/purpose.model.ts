import { z } from 'zod'

const PurposeState = z.union([
  z.literal('Active'),
  z.literal('Suspended'),
  z.literal('WaitingForApproval'),
  z.literal('Archived'),
  z.literal('Draft'),
])

export const Purpose = z.object({
  id: z.string(),
  consumerId: z.string(),
  versions: z.array(
    z.object({
      firstActivationAt: z.string().optional(),
      state: PurposeState,
    })
  ),
})

export type Purpose = z.infer<typeof Purpose>
export type PurposeState = z.infer<typeof PurposeState>

export const Purposes = z.array(Purpose)
export type Purposes = z.infer<typeof Purposes>
