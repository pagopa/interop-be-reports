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
  createdAt: z.coerce.date(),
  macroCategoryId: z.string(),
  selfcareId: z.string().optional(),
})

export type MacroCategoryTenant = z.infer<typeof MacroCategoryTenant>

export const MacroCategory = z.object({
  id: z.string(),
  name: z.string(),
  ipaCodes: z.array(z.string()),
  attributes: z.array(MacroCategoryAttribute),
  tenants: z.array(MacroCategoryTenant),
  onboardedTenants: z.array(MacroCategoryTenant),
  tenantsIds: z.array(z.string()),
})

export const MacroCategories = z.array(MacroCategory)

export type MacroCategory = z.infer<typeof MacroCategory>
export type MacroCategories = z.infer<typeof MacroCategories>
