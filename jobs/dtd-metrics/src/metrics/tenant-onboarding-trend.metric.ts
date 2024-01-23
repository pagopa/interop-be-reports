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
  const oldestTenantDate = globalStore.tenants.reduce((oldestDate, tenant) => {
    if (tenant.onboardedAt < oldestDate) {
      return tenant.onboardedAt
    }
    return oldestDate
  }, new Date())
  oldestTenantDate.setHours(0, 0, 0, 0)

  const result = TenantOnboardingTrendMetric.parse({
    lastSixMonths: globalStore.macroCategories.map((macroCategory) => ({
      id: macroCategory.id,
      name: macroCategory.name,
      data: toTimeseriesSequenceData({
        oldestDate: sixMonthsAgoDate,
        jump: { days: 5 },
        data: macroCategory.tenants.map((tenant) => tenant.onboardedAt),
      }),
      totalCount: macroCategory.totalTenantsCount,
      onboardedCount: macroCategory.tenants.length,
      startingDate: sixMonthsAgoDate,
    })),
    lastTwelveMonths: globalStore.macroCategories.map((macroCategory) => ({
      id: macroCategory.id,
      name: macroCategory.name,
      data: toTimeseriesSequenceData({
        oldestDate: twelveMonthsAgoDate,
        jump: { days: 10 },
        data: macroCategory.tenants.map((tenant) => tenant.onboardedAt),
      }),
      totalCount: macroCategory.totalTenantsCount,
      onboardedCount: macroCategory.tenants.length,
      startingDate: twelveMonthsAgoDate,
    })),
    fromTheBeginning: globalStore.macroCategories.map((macroCategory) => ({
      id: macroCategory.id,
      name: macroCategory.name,
      data: toTimeseriesSequenceData({
        oldestDate: oldestTenantDate,
        jump: { months: 1 },
        data: macroCategory.tenants.map((tenant) => tenant.onboardedAt),
      }),
      totalCount: macroCategory.totalTenantsCount,
      onboardedCount: macroCategory.tenants.length,
      startingDate: oldestTenantDate,
    })),
  })

  return result
}
