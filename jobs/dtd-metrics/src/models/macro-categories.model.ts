import { z } from 'zod'

export const MacroCategoryAttribute = z.object({
  id: z.string(),
  code: z.string().optional(),
  macroCategoryId: z.string(),
})

export type MacroCategoryAttribute = z.infer<typeof MacroCategoryAttribute>

export const MacroCategoryTenant = z.object({
  id: z.string(),
  name: z.string(),
  macroCategoryId: z.string(),
  onboardedAt: z.coerce.date(),
  externalId: z
    .object({
      value: z.string(),
    })
    .optional(),
})
export type MacroCategoryTenant = z.infer<typeof MacroCategoryTenant>

export const MacroCategory = z.object({
  id: z.string(),
  name: z.string(),
  ipaCodes: z.array(z.string()),
  totalTenantsCount: z.number(),
  attributes: z.array(MacroCategoryAttribute),
  tenants: z.array(MacroCategoryTenant),
  tenantsIds: z.array(z.string()),
})

export const MacroCategories = z.array(MacroCategory)

export type MacroCategory = z.infer<typeof MacroCategory>
export type MacroCategories = z.infer<typeof MacroCategories>
