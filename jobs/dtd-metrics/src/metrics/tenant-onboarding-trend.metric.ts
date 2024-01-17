import { getMonthsAgoDate, toTimeseriesSequenceData } from '../utils/helpers.utils.js'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { TenantOnboardingTrendMetric } from '../models/metrics.model.js'

export const getTenantOnboardingTrendMetric: MetricFactoryFn<'statoDiCompletamentoAdesioni'> = (
  _readModel,
  globalStore
) => {
  const sixMonthsAgoDate = getMonthsAgoDate(6)
  const twelveMonthsAgoDate = getMonthsAgoDate(12)

  // Get the oldest tenant date, which will be used as the starting point for the timeseries
  const oldestTenantDate = globalStore.onboardedTenants.reduce((oldestDate, tenant) => {
    if (tenant.onboardedAt < oldestDate) {
      return tenant.onboardedAt
    }
    return oldestDate
  }, new Date())

  // Filter out tenants that are older than 6 months
  const sixMonthsAgoData = globalStore.macroCategories.map((macroCategory) => ({
    ...macroCategory,
    onboardedTenants: macroCategory.onboardedTenants.filter(({ onboardedAt }) => onboardedAt > sixMonthsAgoDate),
  }))
  // Filter out tenants that are older than 12 months
  const twelveMonthsAgoData = globalStore.macroCategories.map((macroCategory) => ({
    ...macroCategory,
    onboardedTenants: macroCategory.onboardedTenants.filter(({ onboardedAt }) => onboardedAt > twelveMonthsAgoDate),
  }))

  const fromTheBeginningData = globalStore.macroCategories

  const result = TenantOnboardingTrendMetric.parse({
    lastSixMonths: sixMonthsAgoData.map((macroCategory) => ({
      id: macroCategory.id,
      name: macroCategory.name,
      data: toTimeseriesSequenceData({
        oldestDate: sixMonthsAgoDate,
        jump: { days: 5 },
        data: macroCategory.onboardedTenants.map((tenant) => tenant.onboardedAt),
      }),
      totalCount: macroCategory.totalTenantsCount,
      onboardedCount: macroCategory.onboardedTenants.length,
      startingDate: sixMonthsAgoDate,
    })),
    lastTwelveMonths: twelveMonthsAgoData.map((macroCategory) => ({
      id: macroCategory.id,
      name: macroCategory.name,
      data: toTimeseriesSequenceData({
        oldestDate: twelveMonthsAgoDate,
        jump: { days: 10 },
        data: macroCategory.onboardedTenants.map((tenant) => tenant.onboardedAt),
      }),
      totalCount: macroCategory.totalTenantsCount,
      onboardedCount: macroCategory.onboardedTenants.length,
      startingDate: twelveMonthsAgoDate,
    })),
    fromTheBeginning: fromTheBeginningData.map((macroCategory) => ({
      id: macroCategory.id,
      name: macroCategory.name,
      data: toTimeseriesSequenceData({
        oldestDate: oldestTenantDate,
        jump: { months: 1 },
        data: macroCategory.onboardedTenants.map((tenant) => tenant.onboardedAt),
      }),
      totalCount: macroCategory.totalTenantsCount,
      onboardedCount: macroCategory.onboardedTenants.length,
      startingDate: oldestTenantDate,
    })),
  })

  return result
}
