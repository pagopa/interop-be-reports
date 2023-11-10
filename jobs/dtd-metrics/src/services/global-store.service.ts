import { Attribute, ReadModelClient, SafeMap } from '@interop-be-reports/commons'
import { MACRO_CATEGORIES } from '../configs/macro-categories.js'
import { MacroCategories, MacroCategory } from '../models/macro-categories.model.js'
import { z } from 'zod'

const GlobalStoreTenant = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.coerce.date(),
  selfcareId: z.string().optional(),
  macroCategoryId: z.string(),
})
type GlobalStoreTenant = z.infer<typeof GlobalStoreTenant>

export class GlobalStoreService {
  tenants: Array<GlobalStoreTenant>
  onboardedTenants: Array<GlobalStoreTenant>
  tenantsMap: SafeMap<string, GlobalStoreTenant>
  macroCategories: MacroCategories

  public getMacroCategoryFromTenantId(tenantId: string): MacroCategory | undefined {
    return this.macroCategories.find(({ tenantsIds }) => tenantsIds.has(tenantId))
  }

  public getTenantFromId(tenantId: string): GlobalStoreTenant {
    return this.tenantsMap.get(tenantId)
  }

  private constructor(tenants: Array<GlobalStoreTenant>, macroCategories: MacroCategories) {
    this.tenants = tenants
    this.tenantsMap = new SafeMap(tenants.map((tenant) => [tenant.id, tenant]))
    this.onboardedTenants = tenants.filter(({ selfcareId }) => !!selfcareId)
    this.macroCategories = macroCategories
  }

  static async init(readModel: ReadModelClient): Promise<GlobalStoreService> {
    const attributes = await readModel.attributes
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

    const enrichMacroCategory = async (macroCategory: (typeof MACRO_CATEGORIES)[number]): Promise<MacroCategory> => {
      const macroCategoryAttributes = attributes
        .filter(({ code }) => (macroCategory.ipaCodes as ReadonlyArray<string | undefined>).includes(code))
        .map((attribute) => ({ ...attribute, macroCategoryId: macroCategory.id }))

      const macroCategoryTenants = await readModel.tenants
        .find(
          {
            'data.attributes': {
              $elemMatch: { id: { $in: macroCategoryAttributes.map((a) => a.id) } },
            },
          },
          {
            projection: {
              _id: 0,
              'data.id': 1,
              'data.name': 1,
              'data.createdAt': 1,
              'data.selfcareId': 1,
            },
          }
        )
        .map(({ data }) => GlobalStoreTenant.parse({ ...data, macroCategoryId: macroCategory.id }))
        .toArray()

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
    const tenants = macroCategories.flatMap(({ tenants }) => tenants)

    return new GlobalStoreService(tenants, macroCategories)
  }
}
