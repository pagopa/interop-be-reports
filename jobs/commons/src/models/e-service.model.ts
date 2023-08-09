import { z } from 'zod'

const descriptorAttributeSchema = z.object({
  explicitAttributeVerification: z.boolean(),
  id: z.string(),
})

const descriptorAttributeSingleSchema = z.object({
  id: descriptorAttributeSchema,
})

const descriptorAttributesGroupSchema = z.object({
  ids: z.array(descriptorAttributeSchema),
})

const descriptorAttributesSchema = z.object({
  certified: z.array(z.union([descriptorAttributeSingleSchema, descriptorAttributesGroupSchema])),
  verified: z.array(z.union([descriptorAttributeSingleSchema, descriptorAttributesGroupSchema])),
  declared: z.array(z.union([descriptorAttributeSingleSchema, descriptorAttributesGroupSchema])),
})

export const eserviceDescriptorSchema = z.object({
  id: z.string(),
  state: z.enum(['Published', 'Draft', 'Deprecated', 'Suspended']),
  version: z.string(),
  attributes: descriptorAttributesSchema,
})

export const eserviceSchema = z.object({
  description: z.string(),
  descriptors: z.array(eserviceDescriptorSchema),
  id: z.string(),
  name: z.string(),
  producerId: z.string(),
  technology: z.enum(['Rest', 'Soap']),
})

export type EService = z.infer<typeof eserviceSchema>
export type EServiceDescriptor = z.infer<typeof eserviceDescriptorSchema>
export type DescriptorAttribute = z.infer<typeof descriptorAttributeSchema>
export type DescriptorAttributes = z.infer<typeof descriptorAttributesSchema>

export const eservicesSchema = z.array(eserviceSchema)
export type EServices = z.infer<typeof eservicesSchema>
