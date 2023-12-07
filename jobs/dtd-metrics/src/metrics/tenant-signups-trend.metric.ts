import { getMonthsAgoDate } from '../utils/helpers.utils.js'
import { add } from 'date-fns'
import { TenantSignupsTrendMetric } from '../models/metrics.model.js'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'

export const getTenantSignupsTrendMetric: MetricFactoryFn<'tenantSignupsTrend'> = (_readModel, globalStore) => {
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
    tenants: macroCategory.onboardedTenants.filter(({ onboardedAt }) => onboardedAt > sixMonthsAgoDate),
  }))
  // Filter out tenants that are older than 12 months
  const twelveMonthsAgoData = globalStore.macroCategories.map((macroCategory) => ({
    ...macroCategory,
    tenants: macroCategory.onboardedTenants.filter(({ onboardedAt }) => onboardedAt > twelveMonthsAgoDate),
  }))

  const fromTheBeginningData = globalStore.macroCategories

  const result = TenantSignupsTrendMetric.parse({
    lastSixMonths: sixMonthsAgoData.map((macroCategory) => ({
      id: macroCategory.id,
      name: macroCategory.name,
      data: toTimeseriesSequenceData(
        sixMonthsAgoDate,
        { days: 5 },
        macroCategory.onboardedTenants.map((tenant) => tenant.onboardedAt)
      ),
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
