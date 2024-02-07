import { Tenant } from '@interop-be-reports/commons'
import { z } from 'zod'

export type DataType = 'tenants' | 'eservices' | 'agreements' | 'purposes'

export const ExportedTenant = Tenant.pick({
  id: true,
  kind: true,
  selfcareId: true,
  externalId: true,
  createdAt: true,
  updatedAt: true,
  onboardedAt: true,
  name: true,
})
export type ExportedTenant = z.infer<typeof ExportedTenant>
