import { OnboardedTenantsCountByMacroCategoriesMetric } from '../models/metrics.model.js'
import { getMonthsAgoDate } from '../utils/helpers.utils.js'
import { MacroCategory } from '../models/macro-categories.model.js'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'

type OnboardedTenantsCountByMacroCategoriesMetricItem = OnboardedTenantsCountByMacroCategoriesMetric[
  | 'fromTheBeginning'
  | 'lastSixMonths'
  | 'lastTwelveMonths'][number]

export const getOnboardedTenantsCountByMacroCategoriesMetric: MetricFactoryFn<
  'onboardedTenantsCountByMacroCategories'
> = (_readModel, globalStore) => {
  // Get the onboarded and total tenants count for each macro category
  function getTotalAndOnboardedTenantsCountFromMacroCategory(
    macroCategory: MacroCategory,
    date: Date | undefined
  ): OnboardedTenantsCountByMacroCategoriesMetricItem {
    const onboardedTenants = date
      ? macroCategory.onboardedTenants.filter((t) => t.onboardedAt >= date)
      : macroCategory.onboardedTenants

    const onboardedCount = onboardedTenants.length
    const totalCount = macroCategory.tenants.length

    return { id: macroCategory.id, name: macroCategory.name, onboardedCount, totalCount }
  }

  const result = OnboardedTenantsCountByMacroCategoriesMetric.parse({
    lastSixMonths: globalStore.macroCategories.map((m) =>
      getTotalAndOnboardedTenantsCountFromMacroCategory(m, getMonthsAgoDate(6))
    ),
    lastTwelveMonths: globalStore.macroCategories.map((m) =>
      getTotalAndOnboardedTenantsCountFromMacroCategory(m, getMonthsAgoDate(12))
    ),
    fromTheBeginning: globalStore.macroCategories.map((m) =>
      getTotalAndOnboardedTenantsCountFromMacroCategory(m, undefined)
    ),
  })

  return result
}
