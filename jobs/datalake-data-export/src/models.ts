import { EService, EServiceDescriptor, Tenant } from '@interop-be-reports/commons'
import { z } from 'zod'

export type DataType = 'tenants' | 'eservices' | 'agreements' | 'purposes'

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
