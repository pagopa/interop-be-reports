import { getMonthsAgoDate, wrapMetricFactoryFn } from '../utils/helpers.utils.js'
import { add } from 'date-fns'
import { TenantSignupsTrendMetric } from '../models/metrics.model.js'

export const tenantSignupsTrendMetric = wrapMetricFactoryFn('tenantSignupsTrend', async (_readModel, globalStore) => {
  // Get the oldest tenant date, which will be used as the starting point for the timeseries
  const oldestTenantDate = globalStore.onboardedTenants.reduce((oldestDate, tenant) => {
    if (tenant.createdAt < oldestDate) {
      return tenant.createdAt
    }
    return oldestDate
  }, new Date())

  const sixMonthsAgoDate = getMonthsAgoDate(6)
  const twelveMonthsAgoDate = getMonthsAgoDate(12)

  // Filter out tenants that are older than 6 months
  const sixMonthsAgoData = globalStore.macroCategories.map((macroCategory) => ({
    ...macroCategory,
    tenants: macroCategory.tenants.filter(({ createdAt }) => createdAt > sixMonthsAgoDate),
  }))
  // Filter out tenants that are older than 12 months
  const twelveMonthsAgoData = globalStore.macroCategories.map((macroCategory) => ({
    ...macroCategory,
    tenants: macroCategory.tenants.filter(({ createdAt }) => createdAt > twelveMonthsAgoDate),
  }))

  const fromTheBeginningData = globalStore.macroCategories

  const result = TenantSignupsTrendMetric.parse({
    lastSixMonths: sixMonthsAgoData.map((macroCategory) => ({
      id: macroCategory.id,
      name: macroCategory.name,
      data: toTimeseriesSequenceData(
        sixMonthsAgoDate,
        { days: 5 },
        macroCategory.tenants.map((tenant) => tenant.createdAt)
      ),
      startingDate: sixMonthsAgoDate,
    })),
    lastTwelveMonths: twelveMonthsAgoData.map((macroCategory) => ({
      id: macroCategory.id,
      name: macroCategory.name,
      data: toTimeseriesSequenceData(
        twelveMonthsAgoDate,
        { days: 10 },
        macroCategory.tenants.map((tenant) => tenant.createdAt)
      ),
      startingDate: twelveMonthsAgoDate,
    })),
    fromTheBeginning: fromTheBeginningData.map((macroCategory) => ({
      id: macroCategory.id,
      name: macroCategory.name,
      data: toTimeseriesSequenceData(
        oldestTenantDate,
        { months: 1 },
        macroCategory.tenants.map((tenant) => tenant.createdAt)
      ),
      startingDate: oldestTenantDate,
    })),
  })

  return result
})

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
