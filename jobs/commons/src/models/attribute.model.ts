import { z } from 'zod'

export const Attribute = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  code: z.string().optional(),
  kind: z.enum(['Certified', 'Verified', 'Declared']),
})

export type Attribute = z.infer<typeof Attribute>

export const Attributes = z.array(Attribute)
export type Attributes = z.infer<typeof Attributes>
