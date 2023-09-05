import { z } from 'zod'

const DescriptorAttribute = z.object({
  explicitAttributeVerification: z.boolean(),
  id: z.string(),
})

const DescriptorAttributeSingle = z.object({
  id: DescriptorAttribute,
})

const DescriptorAttributesGroup = z.object({
  ids: z.array(DescriptorAttribute),
})

const DescriptorAttributes = z.object({
  certified: z.array(z.union([DescriptorAttributeSingle, DescriptorAttributesGroup])),
  verified: z.array(z.union([DescriptorAttributeSingle, DescriptorAttributesGroup])),
  declared: z.array(z.union([DescriptorAttributeSingle, DescriptorAttributesGroup])),
})

export const EServiceDescriptor = z.object({
  id: z.string(),
  state: z.enum(['Published', 'Draft', 'Deprecated', 'Suspended']),
  version: z.string(),
  attributes: DescriptorAttributes,
})

export const EService = z.object({
  description: z.string(),
  descriptors: z.array(EServiceDescriptor),
  id: z.string(),
  name: z.string(),
  producerId: z.string(),
  technology: z.enum(['Rest', 'Soap']),
})

export type EService = z.infer<typeof EService>
export type EServiceDescriptor = z.infer<typeof EServiceDescriptor>
export type DescriptorAttribute = z.infer<typeof DescriptorAttribute>
export type DescriptorAttributes = z.infer<typeof DescriptorAttributes>

export const EServices = z.array(EService)
export type EServices = z.infer<typeof EServices>
