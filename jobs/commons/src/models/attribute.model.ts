import { z } from 'zod'

export const attributeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  code: z.string().optional(),
  kind: z.enum(['Certified', 'Verified', 'Declared']),
})

export type Attribute = z.infer<typeof attributeSchema>

export const attributesSchema = z.array(attributeSchema)
export type Attributes = z.infer<typeof attributesSchema>
