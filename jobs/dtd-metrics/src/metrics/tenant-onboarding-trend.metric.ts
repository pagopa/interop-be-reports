import { getMonthsAgoDate } from '../utils/helpers.utils.js'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { TenantOnboardingTrendMetric } from '../models/metrics.model.js'
import { sub } from 'date-fns'

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

/**
 * Converts a list of dates into a timeseries sequence data.
 * @param oldestDate The oldest date in the list, which will be used as the starting point for the timeseries
 * @param jump The jump between each data point
 * @param data The list of dates
 */
export function toTimeseriesSequenceData({
  oldestDate,
  jump,
  data,
}: {
  oldestDate: Date
  jump: Duration
  data: Array<Date>
}): Array<{ date: Date; count: number }> {
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  let currentCount: number = data.length
  const timeseriesData: Array<{ date: Date; count: number }> = [{ date: currentDate, count: currentCount }]

  while (oldestDate < currentDate) {
    // Jump to the next date
    currentDate = sub(currentDate, jump)
    currentDate.setHours(0, 0, 0, 0)
    // Count the number of dates that are less than or equal to the current date, and add it to the timeseries data
    currentCount = data.filter((date) => date <= currentDate).length

    timeseriesData.push({ date: currentDate, count: currentCount })
  }
  // Reverse the timeseries data so that the oldest date is first
  return timeseriesData.reverse()
}
