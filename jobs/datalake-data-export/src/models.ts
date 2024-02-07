import { Agreement, EService, EServiceDescriptor, Purpose, PurposeVersion, Tenant } from '@interop-be-reports/commons'
import { z } from 'zod'

export type DataType = 'tenants' | 'eservices' | 'agreements' | 'purposes'

/**
 * The pick method used to extract the fields from the original type is not
 * type-safe. It is possible to put a field that does not exist in the original
 * and the type will still be valid.
 * This type utility makes the pick method type-safe by accepting only the
 * fields that exist in the original type.
 */
type StrictPick<T> = Partial<Record<keyof T, boolean>>

export const ExportedTenant = Tenant.pick({
  id: true,
  kind: true,
  selfcareId: true,
  externalId: true,
  createdAt: true,
  updatedAt: true,
  onboardedAt: true,
  name: true,
} satisfies StrictPick<Tenant>)
export type ExportedTenant = z.infer<typeof ExportedTenant>

const ExportedDescriptor = EServiceDescriptor.pick({
  id: true,
  description: true,
  version: true,
  voucherLifespan: true,
  dailyCallsPerConsumer: true,
  dailyCallsTotal: true,
  state: true,
  publishedAt: true,
  suspendedAt: true,
  deprecatedAt: true,
  archivedAt: true,
} satisfies StrictPick<EServiceDescriptor>)
export const ExportedEService = EService.pick({
  id: true,
  producerId: true,
  name: true,
  description: true,
  mode: true,
} satisfies StrictPick<EService>).and(
  z.object({
    descriptors: z.array(ExportedDescriptor),
  })
)
export type ExportedEService = z.infer<typeof ExportedEService>

export const ExportedAgreement = Agreement.pick({
  id: true,
  eserviceId: true,
  descriptorId: true,
  producerId: true,
  consumerId: true,
  state: true,
  suspendedByConsumer: true,
  suspendedByProducer: true,
  suspendedByPlatform: true,
  createdAt: true,
  updatedAt: true,
  suspendedAt: true,
  stamps: true,
} satisfies StrictPick<Agreement>)
export type ExportedAgreement = z.infer<typeof ExportedAgreement>

const ExportedPurposeVersion = PurposeVersion.pick({
  id: true,
  state: true,
  createdAt: true,
  updatedAt: true,
  suspendedAt: true,
  firstActivationAt: true,
  expectedApprovalDate: true,
  dailyCalls: true,
} satisfies StrictPick<PurposeVersion>)
export const ExportedPurpose = Purpose.pick({
  id: true,
  eserviceId: true,
  consumerId: true,
  suspendedByConsumer: true,
  suspendedByProducer: true,
  title: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  isFreeOfCharge: true,
  freeOfChargeReason: true,
} satisfies StrictPick<Purpose>).and(z.object({ versions: z.array(ExportedPurposeVersion) }))
export type ExportedPurpose = z.infer<typeof ExportedPurpose>
