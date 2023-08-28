import { z } from 'zod'

export const tenantAttributeSchema = z.object({
  id: z.string(),
  type: z.union([
    z.literal('PersistentCertifiedAttribute'),
    z.literal('PersistentVerifiedAttribute'),
    z.literal('PersistentDeclaredAttribute'),
  ]),
})

export const tenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  attributes: z.array(tenantAttributeSchema),
})

export type TenantAttribute = z.infer<typeof tenantAttributeSchema>
export type Tenant = z.infer<typeof tenantSchema>

export const tenantsSchema = z.array(tenantSchema)
export type Tenants = z.infer<typeof tenantsSchema>
