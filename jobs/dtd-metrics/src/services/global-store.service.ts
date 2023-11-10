import { Attribute, ReadModelClient, SafeMap, Tenant } from '@interop-be-reports/commons'
import { MACRO_CATEGORIES } from '../configs/macro-categories.js'
import { MacroCategories, MacroCategory, MacroCategoryTenant } from '../models/macro-categories.model.js'
import { z } from 'zod'

const GlobalStoreTenant = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.coerce.date(),
  selfcareId: z.string().optional(),
})
type GlobalStoreTenant = z.infer<typeof GlobalStoreTenant>

export class GlobalStoreService {
  onboardedTenants: Array<GlobalStoreTenant>
  onboardedTenantsMap: SafeMap<string, GlobalStoreTenant>
  macroCategories: MacroCategories

  public getMacroCategoryFromTenantId(tenantId: string): MacroCategory | undefined {
    return this.macroCategories.find(({ tenantsIds }) => tenantsIds.has(tenantId))
  }

  public getTenantFromId(tenantId: string): GlobalStoreTenant {
    return this.onboardedTenantsMap.get(tenantId)
  }

  private constructor(onboardedTenants: Array<GlobalStoreTenant>, macroCategories: MacroCategories) {
    this.onboardedTenants = onboardedTenants
    this.onboardedTenantsMap = new SafeMap(onboardedTenants.map((tenant) => [tenant.id, tenant]))
    this.macroCategories = macroCategories
  }

  static async init(readModel: ReadModelClient): Promise<GlobalStoreService> {
    const onboardedTenantsPromise = await readModel.tenants
      .find({
        'data.selfcareId': { $exists: true },
      })
      .project({
        _id: 0,
        'data.id': 1,
        'data.name': 1,
        'data.selfcareId': 1,
        'data.createdAt': 1,
        'data.attributes.id': 1,
      })
      .map(({ data }) =>
        Tenant.pick({ id: true, name: true, createdAt: true, selfcareId: true })
          .and(z.object({ attributes: z.array(z.object({ id: z.string() })) }))
          .parse(data)
      )
      .toArray()

    const attributesPromise = await readModel.attributes
      .find({
        'data.code': {
          $in: MACRO_CATEGORIES.flatMap((macroCategory) => macroCategory.ipaCodes),
        },
      })
      .project({
        _id: 0,
        'data.id': 1,
        'data.code': 1,
      })
      .map(({ data }) => Attribute.pick({ id: true, code: true }).parse(data))
      .toArray()

    const [onboardedTenants, attributes] = await Promise.all([onboardedTenantsPromise, attributesPromise])

    const enrichMacroCategory = async (macroCategory: (typeof MACRO_CATEGORIES)[number]): Promise<MacroCategory> => {
      const macroCategoryAttributes = attributes
        .filter(({ code }) => (macroCategory.ipaCodes as ReadonlyArray<string | undefined>).includes(code))
        .map((attribute) => ({ ...attribute, macroCategoryId: macroCategory.id }))

      const macroCategoryTenants: MacroCategoryTenant[] = onboardedTenants
        .filter(({ attributes }) =>
          attributes.some(({ id }) => macroCategoryAttributes.some(({ id: attributeId }) => attributeId === id))
        )
        .map((t) => ({
          id: t.id,
          name: t.name,
          createdAt: t.createdAt,
          selfcareId: t.selfcareId,
          macroCategoryId: macroCategory.id,
        }))

      return MacroCategory.parse({
        id: macroCategory.id,
        name: macroCategory.name,
        ipaCodes: macroCategory.ipaCodes,
        attributes: macroCategoryAttributes,
        tenants: macroCategoryTenants,
        tenantsIds: new Set(macroCategoryTenants.map(({ id }) => id)),
      })
    }

    const macroCategories = MacroCategories.parse(await Promise.all(MACRO_CATEGORIES.map(enrichMacroCategory)))
    const onboardedTenantsData = onboardedTenants.map(({ id, name, createdAt }) => ({ id, name, createdAt }))

    return new GlobalStoreService(onboardedTenantsData, macroCategories)
  }
}
