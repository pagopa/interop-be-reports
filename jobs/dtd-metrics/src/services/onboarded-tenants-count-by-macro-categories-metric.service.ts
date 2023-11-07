import { ReadModelClient, Tenant } from '@interop-be-reports/commons'
import { OnboardedTenantsCountByMacroCategoriesMetric } from '../models/metrics.model.js'
import {
  MacroCategoriesWithAttributes,
  getMacroCategoriesWithAttributes,
  getMonthsAgoDate,
} from '../utils/helpers.utils.js'
import { z } from 'zod'

const MetricTenant = Tenant.pick({ selfcareId: true, createdAt: true })
type MetricTenant = z.infer<typeof MetricTenant>
type OnboardedTenantsCountByMacroCategoriesMetricItem = OnboardedTenantsCountByMacroCategoriesMetric[
  | 'fromTheBeginning'
  | 'lastSixMonths'
  | 'lastTwelveMonths'][number]
type MacroCategoriesWithAttributesAndTenants = MacroCategoriesWithAttributes[number] & { tenants: Array<MetricTenant> }

export async function getOnboardedTenantsCountByMacroCategoriesMetric(
  readModel: ReadModelClient
): Promise<OnboardedTenantsCountByMacroCategoriesMetric> {
  const macroCategories = await getMacroCategoriesWithAttributes(readModel)

  // Enrich macro categories with their tenants
  const macroCategoriesWithTenants = await Promise.all(
    macroCategories.map((m) => enrichMacroCategoryWithTenants(m, readModel))
  )

  // Get the onboarded and total tenants count for each macro category
  function getTotalAndOnboardedTenantsCountFromMacroCategory(
    macroCategory: MacroCategoriesWithAttributesAndTenants,
    date: Date | undefined
  ): OnboardedTenantsCountByMacroCategoriesMetricItem {
    //TODO eventually the createdAt field will be substituted by the onboardedAt field once it will be available
    const tenants = date ? macroCategory.tenants.filter((t) => t.createdAt >= date) : macroCategory.tenants

    // We count as onboarded the tenants that have a selfcareId
    const oboardedCount = tenants.filter((t) => !!t.selfcareId).length
    const totalCount = tenants.length

    return { id: macroCategory.id, name: macroCategory.name, oboardedCount, totalCount }
  }

  const result = OnboardedTenantsCountByMacroCategoriesMetric.parse({
    lastSixMonths: macroCategoriesWithTenants.map((m) =>
      getTotalAndOnboardedTenantsCountFromMacroCategory(m, getMonthsAgoDate(6))
    ),
    lastTwelveMonths: macroCategoriesWithTenants.map((m) =>
      getTotalAndOnboardedTenantsCountFromMacroCategory(m, getMonthsAgoDate(12))
    ),
    fromTheBeginning: macroCategoriesWithTenants.map((m) =>
      getTotalAndOnboardedTenantsCountFromMacroCategory(m, undefined)
    ),
  })

  return result
}

async function enrichMacroCategoryWithTenants(
  macroCategory: MacroCategoriesWithAttributes[number],
  readModel: ReadModelClient
): Promise<MacroCategoriesWithAttributesAndTenants> {
  const tenants = await readModel.tenants
    .find(
      {
        'data.attributes': {
          $elemMatch: { id: { $in: macroCategory.attributes.map((a) => a.id) } },
        },
      },
      { projection: { _id: 0, 'data.selfcareId': 1, 'data.createdAt': 1 } } // TODO createdAt will be substituted by onboardedAt once it will be available
    )
    .map(({ data }) => MetricTenant.parse(data))
    .toArray()

  return { ...macroCategory, tenants }
}
