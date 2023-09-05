import { z } from 'zod'

export const TenantAttribute = z.object({
  id: z.string(),
  type: z.union([
    z.literal('PersistentCertifiedAttribute'),
    z.literal('PersistentVerifiedAttribute'),
    z.literal('PersistentDeclaredAttribute'),
  ]),
})

export const Tenant = z.object({
  id: z.string(),
  name: z.string(),
  attributes: z.array(TenantAttribute),
})

export type TenantAttribute = z.infer<typeof TenantAttribute>
export type Tenant = z.infer<typeof Tenant>

export const Tenants = z.array(Tenant)
export type Tenants = z.infer<typeof Tenants>
