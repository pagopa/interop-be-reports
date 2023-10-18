import { EServiceDescriptor, EService } from '@interop-be-reports/commons'
import { z } from 'zod'

const EServiceCommon = EService.pick({
  id: true,
  name: true,
  description: true,
  technology: true,
})
  .and(
    z.object({
      activeDescriptor: EServiceDescriptor.pick({ id: true, state: true, version: true }),
      producerName: z.string(),
    })
  )
  .and(EServiceDescriptor.pick({ dailyCallsTotal: true, dailyCallsPerConsumer: true, voucherLifespan: true }))

export const EServiceQueryOutput = EServiceCommon.and(EService.pick({ attributes: true }))

export const EServiceResultAttribute = z.object({
  name: z.string(),
  description: z.string(),
})

const EServiceResultAttributeSingle = z.object({
  single: EServiceResultAttribute,
})

const EServiceResultAttributesGroup = z.object({
  group: z.array(EServiceResultAttribute),
})

export const EServiceResultAttributes = z.object({
  certified: z.array(z.union([EServiceResultAttributeSingle, EServiceResultAttributesGroup])),
  verified: z.array(z.union([EServiceResultAttributeSingle, EServiceResultAttributesGroup])),
  declared: z.array(z.union([EServiceResultAttributeSingle, EServiceResultAttributesGroup])),
})

export const EServiceResult = EServiceCommon.and(
  z.object({ attributes: EServiceResultAttributes, totalLoad: z.number() })
)

export type EServiceQueryOutput = z.infer<typeof EServiceQueryOutput>
export type EServiceResultAttribute = z.infer<typeof EServiceResultAttribute>
export type EServiceResultAttributes = z.infer<typeof EServiceResultAttributes>
export type EServiceResult = z.infer<typeof EServiceResult>
