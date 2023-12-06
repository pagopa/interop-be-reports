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
  onboardedAt: z.coerce.date().optional(),
})

export const MacroCategoryOnboardeTenant = MacroCategoryTenant.extend({
  onboardedAt: z.coerce.date(),
})

export type MacroCategoryTenant = z.infer<typeof MacroCategoryTenant>
export type MacroCategoryOnboardeTenant = z.infer<typeof MacroCategoryOnboardeTenant>

export const MacroCategory = z.object({
  id: z.string(),
  name: z.string(),
  ipaCodes: z.array(z.string()),
  attributes: z.array(MacroCategoryAttribute),
  tenants: z.array(MacroCategoryTenant),
  onboardedTenants: z.array(MacroCategoryOnboardeTenant),
  tenantsIds: z.array(z.string()),
})

export const MacroCategories = z.array(MacroCategory)

export type MacroCategory = z.infer<typeof MacroCategory>
export type MacroCategories = z.infer<typeof MacroCategories>
