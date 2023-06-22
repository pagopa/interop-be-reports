import { z } from 'zod'

const eserviceAttributeSchema = z.object({
  explicitAttributeVerification: z.boolean(),
  id: z.string(),
})

const eserviceAttributeSingleSchema = z.object({
  id: eserviceAttributeSchema,
})

const eserviceAttributesGroupSchema = z.object({
  ids: z.array(eserviceAttributeSchema),
})

const eserviceAttributesSchema = z.object({
  certified: z.array(z.union([eserviceAttributeSingleSchema, eserviceAttributesGroupSchema])),
  verified: z.array(z.union([eserviceAttributeSingleSchema, eserviceAttributesGroupSchema])),
  declared: z.array(z.union([eserviceAttributeSingleSchema, eserviceAttributesGroupSchema])),
})

const descriptorSchema = z.object({
  id: z.string(),
  state: z.enum(['Published', 'Draft', 'Deprecated', 'Suspended']),
  version: z.string(),
})

export const eserviceSchema = z.object({
  attributes: eserviceAttributesSchema,
  description: z.string(),
  descriptors: z.array(descriptorSchema),
  id: z.string(),
  name: z.string(),
  producerId: z.string(),
  technology: z.enum(['Rest', 'Soap']),
})

export type EService = z.infer<typeof eserviceSchema>
export type EServiceAttribute = z.infer<typeof eserviceAttributeSchema>
export type EServiceAttributes = z.infer<typeof eserviceAttributesSchema>

export const eservicesSchema = z.array(eserviceSchema)
export type EServices = z.infer<typeof eservicesSchema>
