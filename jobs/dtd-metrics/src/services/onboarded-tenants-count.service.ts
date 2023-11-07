import { ReadModelClient } from '@interop-be-reports/commons'
import { OnboardedTenantsCountMetric } from '../models/metrics.model.js'
import { getMonthsAgoDate, getVariationPercentage } from '../utils/helpers.utils.js'
import { Document } from 'mongodb'

export async function getOnboardedTenantsCountMetric(readModel: ReadModelClient): Promise<OnboardedTenantsCountMetric> {
  const isTenantOnboardedFilter: Document = {
    'data.selfcareId': { $exists: true },
  }

  const totalTenantsCountPromise = readModel.tenants.countDocuments(isTenantOnboardedFilter)
  const lastMonthTenantsCountPromise = readModel.tenants.countDocuments({
    // TODO this should be 'onboardedAt', for now we use 'createdAt'
    'data.createdAt': {
      $gte: getMonthsAgoDate(1).toISOString(),
    },
    ...isTenantOnboardedFilter,
  })
  const twoMonthsAgoTenantsCountPromise = readModel.tenants.countDocuments({
    // TODO this should be 'onboardedAt', for now we use 'createdAt'
    'data.createdAt': {
      $lte: getMonthsAgoDate(1).toISOString(),
      $gte: getMonthsAgoDate(2).toISOString(),
    },
    ...isTenantOnboardedFilter,
  })

  const [totalTenantsCount, lastMonthTenantsCount, twoMonthsAgoTenantsCount] = await Promise.all([
    totalTenantsCountPromise,
    lastMonthTenantsCountPromise,
    twoMonthsAgoTenantsCountPromise,
  ])

  const variation = getVariationPercentage(lastMonthTenantsCount, twoMonthsAgoTenantsCount)

  return { totalTenantsCount, lastMonthTenantsCount, variation }
}
