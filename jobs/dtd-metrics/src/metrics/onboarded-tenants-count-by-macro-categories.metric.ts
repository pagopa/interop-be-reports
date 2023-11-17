import { OnboardedTenantsCountByMacroCategoriesMetric } from '../models/metrics.model.js'
import { getMonthsAgoDate, wrapMetricFactoryFn } from '../utils/helpers.utils.js'
import { MacroCategory } from '../models/macro-categories.model.js'

type OnboardedTenantsCountByMacroCategoriesMetricItem = OnboardedTenantsCountByMacroCategoriesMetric[
  | 'fromTheBeginning'
  | 'lastSixMonths'
  | 'lastTwelveMonths'][number]

export const onboardedTenantsCountByMacroCategoriesMetric = wrapMetricFactoryFn(
  'onboardedTenantsCountByMacroCategories',
  async (_readModel, globalStore) => {
    // Get the onboarded and total tenants count for each macro category
    async function getTotalAndOnboardedTenantsCountFromMacroCategory(
      macroCategory: MacroCategory,
      date: Date | undefined
    ): Promise<OnboardedTenantsCountByMacroCategoriesMetricItem> {
      //TODO eventually the createdAt field will be substituted by the onboardedAt field once it will be available
      const tenants = date ? macroCategory.tenants.filter((t) => t.createdAt >= date) : macroCategory.tenants

      const onboardedCount = tenants.filter((t) => !!t.selfcareId).length
      const totalCount = tenants.length

      return { id: macroCategory.id, name: macroCategory.name, onboardedCount, totalCount }
    }

    const result = OnboardedTenantsCountByMacroCategoriesMetric.parse({
      lastSixMonths: await Promise.all(
        globalStore.macroCategories.map((m) =>
          getTotalAndOnboardedTenantsCountFromMacroCategory(m, getMonthsAgoDate(6))
        )
      ),
      lastTwelveMonths: await Promise.all(
        globalStore.macroCategories.map((m) =>
          getTotalAndOnboardedTenantsCountFromMacroCategory(m, getMonthsAgoDate(12))
        )
      ),
      fromTheBeginning: await Promise.all(
        globalStore.macroCategories.map((m) => getTotalAndOnboardedTenantsCountFromMacroCategory(m, undefined))
      ),
    })

    return result
  }
)
