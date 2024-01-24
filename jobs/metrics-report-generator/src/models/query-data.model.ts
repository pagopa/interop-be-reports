import {
  Agreement,
  CatalogDocument,
  EService,
  EServiceDescriptor,
  ExternalId,
  Purpose,
} from '@interop-be-reports/commons'
import { z } from 'zod'

export const EServiceQueryData = EService.pick({ id: true, name: true, producerId: true }).and(
  z.object({
    descriptors: z.array(
      EServiceDescriptor.pick({ id: true, createdAt: true, state: true }).and(
        z.object({ interface: CatalogDocument.pick({ checksum: true }).optional() })
      )
    ),
  })
)
export type EServiceQueryData = z.infer<typeof EServiceQueryData>

export const AgreementQueryData = Agreement.pick({
  id: true,
  consumerId: true,
  producerId: true,
  eserviceId: true,
  descriptorId: true,
  state: true,
})
export type AgreementQueryData = z.infer<typeof AgreementQueryData>

export const PurposeQueryData = Purpose.pick({ id: true, title: true, eserviceId: true })
export type PurposeQueryData = z.infer<typeof PurposeQueryData>

export const TenantQueryData = z.object({ id: z.string(), externalId: ExternalId })
export type TenantQueryData = z.infer<typeof TenantQueryData>
