import { Tenant as ReadModelTenant } from '@interop-be-reports/commons'
import { z } from 'zod'

export const Tenant = ReadModelTenant.pick({ id: true, name: true, externalId: true })

export type Tenant = z.infer<typeof Tenant>
