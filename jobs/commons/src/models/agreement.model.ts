import { z } from 'zod'

export const agreementSchema = z.object({
  id: z.string(),
  eserviceId: z.string(),
  descriptorId: z.string(),
  state: z.enum(['Active', 'Draft', 'Pending', 'Suspended', 'Archived']),
})

export type Agreement = z.infer<typeof agreementSchema>

export const agreementsSchema = z.array(agreementSchema)
export type Agreements = z.infer<typeof agreementsSchema>
