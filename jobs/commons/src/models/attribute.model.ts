import { z } from 'zod'

export const AttributeKind = z.enum(['Certified', 'Verified', 'Declared'])
export const Attribute = z.object({
  id: z.string().uuid(),
  code: z.string().optional(),
  origin: z.string().optional(),
  kind: AttributeKind,
  description: z.string(),
  name: z.string(),
  creationTime: z.string().pipe(z.coerce.date()),
})

export type AttributeKind = z.infer<typeof AttributeKind>
export type Attribute = z.infer<typeof Attribute>

export const Attributes = z.array(Attribute)
export type Attributes = z.infer<typeof Attributes>
