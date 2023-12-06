import { OnboardedTenantsCountMetric } from '../models/metrics.model.js'
import { getMonthsAgoDate, getVariationPercentage } from '../utils/helpers.utils.js'
import { GlobalStoreService } from './global-store.service.js'

export async function getOnboardedTenantsCountMetric(
  globalStore: GlobalStoreService
): Promise<OnboardedTenantsCountMetric> {
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
