import { Tenant } from '@interop-be-reports/commons'
import { z } from 'zod'

export const PersistentTenant = Tenant.pick({id: true, externalId: true, attributes: true, features: true})

export type PersistentTenant = z.infer<typeof PersistentTenant>
