import { z } from 'zod'

export const Agreement = z.object({
  id: z.string(),
  eserviceId: z.string(),
  descriptorId: z.string(),
  consumerId: z.string(),
  producerId: z.string(),
  state: z.enum(['Active', 'Draft', 'Pending', 'Suspended', 'Archived']),
})

export type Agreement = z.infer<typeof Agreement>

export const Agreements = z.array(Agreement)
export type Agreements = z.infer<typeof Agreements>
