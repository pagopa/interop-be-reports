import { Attribute, ReadModelClient } from '@interop-be-reports/commons'
import { MACRO_CATEGORIES } from '../configs/macro-categories.js'
import {
  MacroCategories,
  MacroCategory,
  MacroCategoryOnboardedTenant,
  MacroCategoryTenant,
} from '../models/macro-categories.model.js'
import { z } from 'zod'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { URL } from 'url'
import { getOnboardedTenants, log } from '../utils/helpers.utils.js'
import { MacroCategoryName } from '../utils/tests.utils.js'

const __dirname = new URL('.', import.meta.url).pathname
const GLOBAL_STORE_CACHE_PATH = path.join(__dirname, '.global-store-cache')

const GlobalStoreTenant = MacroCategoryTenant
export type GlobalStoreTenant = z.infer<typeof GlobalStoreTenant>

const GlobalStoreOnboardedTenant = MacroCategoryOnboardedTenant
export type GlobalStoreOnboardedTenant = z.infer<typeof GlobalStoreOnboardedTenant>

const GlobalStoreCacheObj = z.object({
  macroCategories: MacroCategories,
  tenants: z.array(GlobalStoreTenant),
})

type GlobalStoreCacheObj = z.infer<typeof GlobalStoreCacheObj>

type GlobalStoreInitConfig = {
  cache?: boolean
}

/**
 * This service is used to retrieve and manage common used data
 * to avoid querying multiple times the read model for the same data.
 *
 * The initialization of this service is quite heavy, while developing
 * is recommended to use the cache option to avoid overloading the read model.
 */
export class GlobalStoreService {
  tenants: Array<GlobalStoreTenant>
  onboardedTenants: Array<GlobalStoreOnboardedTenant>
  tenantsMap: Map<string, GlobalStoreTenant>
  macroCategories: MacroCategories

  public getMacroCategoryFromTenantId(tenantId: string): MacroCategory | undefined {
    return this.macroCategories.find(({ tenantsIds }) => tenantsIds.includes(tenantId))
  }

  public getTenantFromId(tenantId: string): GlobalStoreTenant | undefined {
    return this.tenantsMap.get(tenantId)
  }

  public getMacroCategoryByName(name: MacroCategoryName): MacroCategory {
    const macroCategory = this.macroCategories.find(({ name: macroCategoryName }) => macroCategoryName === name)
    if (!macroCategory) throw new Error(`Macro category ${name} not found`)
    return macroCategory
  }

  private constructor(tenants: Array<GlobalStoreTenant>, macroCategories: MacroCategories) {
    this.tenants = tenants
    this.onboardedTenants = getOnboardedTenants(tenants)
    this.tenantsMap = new Map(tenants.map((tenant) => [tenant.id, tenant]))
    this.macroCategories = macroCategories
  }

  static async init(readModel: ReadModelClient, config?: GlobalStoreInitConfig): Promise<GlobalStoreService> {
    if (config?.cache) {
      const cache = this.getInitializationDataFromCache()
      if (cache) return new GlobalStoreService(cache.tenants, cache.macroCategories)
    }

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
              'data.onboardedAt': 1,
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
        onboardedTenants: getOnboardedTenants(macroCategoryTenants),
        tenantsIds: Array.from(new Set(macroCategoryTenants.map(({ id }) => id))),
      })
    }

    const macroCategories = MacroCategories.parse(await Promise.all(MACRO_CATEGORIES.map(enrichMacroCategory)))
    const tenants = macroCategories.flatMap(({ tenants }) => tenants)

    if (config?.cache) this.cacheInitializationData({ macroCategories, tenants })

    return new GlobalStoreService(tenants, macroCategories)
  }

  private static getInitializationDataFromCache(): GlobalStoreCacheObj | undefined {
    const hasCache = existsSync(GLOBAL_STORE_CACHE_PATH)
    if (!hasCache) return undefined

    log.warn('Using global store cache')
    const cache = JSON.parse(readFileSync(GLOBAL_STORE_CACHE_PATH, 'utf-8'))
    const result = GlobalStoreCacheObj.safeParse(cache)
    if (!result.success) {
      log.warn('Global store cache is corrupted, ignoring it')
      return undefined
    }
    return result.data
  }

  private static cacheInitializationData(cache: GlobalStoreCacheObj): void {
    writeFileSync(GLOBAL_STORE_CACHE_PATH, JSON.stringify(cache))
  }
}
