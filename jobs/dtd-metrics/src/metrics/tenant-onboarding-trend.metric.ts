import { getMonthsAgoDate } from '../utils/helpers.utils.js'
import { add } from 'date-fns'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { TenantOnboardingTrendMetric } from '../models/metrics.model.js'
import { MACRO_CATEGORIES_COUNTS } from '../configs/macro-categories.js'

export const getTenantOnboardingTrendMetric: MetricFactoryFn<'statoDiCompletamentoAdesioni'> = (
  _readModel,
  globalStore
) => {
  // Get the oldest tenant date, which will be used as the starting point for the timeseries
  const oldestTenantDate = globalStore.onboardedTenants.reduce((oldestDate, tenant) => {
    if (tenant.onboardedAt < oldestDate) {
      return tenant.onboardedAt
    }
    return oldestDate
  }, new Date())

  const sixMonthsAgoDate = getMonthsAgoDate(6)
  const twelveMonthsAgoDate = getMonthsAgoDate(12)

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
      data: toTimeseriesSequenceData(
        sixMonthsAgoDate,
        { days: 5 },
        macroCategory.onboardedTenants.map((tenant) => tenant.onboardedAt)
      ),
      totalCount: MACRO_CATEGORIES_COUNTS[macroCategory.id as keyof typeof MACRO_CATEGORIES_COUNTS],
      onboardedCount: macroCategory.onboardedTenants.length,
      startingDate: sixMonthsAgoDate,
    })),
    lastTwelveMonths: twelveMonthsAgoData.map((macroCategory) => ({
      id: macroCategory.id,
      name: macroCategory.name,
      data: toTimeseriesSequenceData(
        twelveMonthsAgoDate,
        { days: 10 },
        macroCategory.onboardedTenants.map((tenant) => tenant.onboardedAt)
      ),
      totalCount: MACRO_CATEGORIES_COUNTS[macroCategory.id as keyof typeof MACRO_CATEGORIES_COUNTS],
      onboardedCount: macroCategory.onboardedTenants.length,
      startingDate: twelveMonthsAgoDate,
    })),
    fromTheBeginning: fromTheBeginningData.map((macroCategory) => ({
      id: macroCategory.id,
      name: macroCategory.name,
      data: toTimeseriesSequenceData(
        oldestTenantDate,
        { months: 1 },
        macroCategory.onboardedTenants.map((tenant) => tenant.onboardedAt)
      ),
      totalCount: MACRO_CATEGORIES_COUNTS[macroCategory.id as keyof typeof MACRO_CATEGORIES_COUNTS],
      onboardedCount: macroCategory.onboardedTenants.length,
      startingDate: oldestTenantDate,
    })),
  })

  return result
}

function toTimeseriesSequenceData(
  startingDate: Date,
  jump: Duration,
  data: Array<Date>
): Array<{ date: Date; count: number }> {
  const timeseriesData: Array<{ date: Date; count: number }> = []
  let currentDate = startingDate
  let count = 0
  while (currentDate < new Date()) {
    const newDate = add(currentDate, jump)
    count += data.filter((date) => date < newDate && date >= currentDate).length
    timeseriesData.push({ date: currentDate, count })
    currentDate = newDate
  }
  return timeseriesData
}
