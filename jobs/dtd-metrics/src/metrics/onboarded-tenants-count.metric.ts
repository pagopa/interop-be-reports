import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { getMonthsAgoDate, getVariationPercentage } from '../utils/helpers.utils.js'

export const getOnboardedTenantsCountMetric: MetricFactoryFn<'onboardedTenantsCount'> = async (
  _readModel,
  globalStore
) => {
  const oneMonthAgoDate = getMonthsAgoDate(1)
  const twoMonthsAgoDate = getMonthsAgoDate(2)

  const totalTenantsCount = globalStore.onboardedTenants.length
  const lastMonthTenantsCount = globalStore.onboardedTenants.filter(
    (tenant) => tenant.createdAt >= oneMonthAgoDate
  ).length
  const twoMonthsAgoTenantsCount = globalStore.onboardedTenants.filter(
    (tenant) => tenant.createdAt >= twoMonthsAgoDate && tenant.createdAt <= oneMonthAgoDate
  ).length

  const variation = getVariationPercentage(lastMonthTenantsCount, twoMonthsAgoTenantsCount)

  return { totalTenantsCount, lastMonthTenantsCount, variation }
}