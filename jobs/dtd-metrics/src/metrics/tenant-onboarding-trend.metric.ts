import { TenantOnboardingTrendMetric } from '../models/metrics.model.js'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { getOldestDate } from '../utils/helpers.utils.js'
import { sub } from 'date-fns'

export const getTenantOnboardingTrendMetric: MetricFactoryFn<'andamentoDelleAdesioni'> = (_, globalStore) => {
  const allTenantsOnboardedAtDates = [...globalStore.tenants, ...globalStore.notIPATenants].map(
    (tenant) => tenant.onboardedAt
  )

  const oldestTenantDate = getOldestDate(allTenantsOnboardedAtDates)

  return TenantOnboardingTrendMetric.parse(
    toTimeseriesSequenceData({
      oldestDate: oldestTenantDate,
      jump: { months: 1 },
      data: allTenantsOnboardedAtDates,
    })
  )
}

/**
 * Converts a list of dates into a timeseries sequence data.
 * @param oldestDate The oldest date in the list, which will be used as the starting point for the timeseries
 * @param jump The jump between each data point
 * @param data The list of dates
 */
function toTimeseriesSequenceData({
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
