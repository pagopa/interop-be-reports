import { ReadModelClient } from '@interop-be-reports/commons'
import { TotalTenantsCountMetric } from '../models/metrics.model.js'
import { getMonthsAgoDate } from '../utils/helpers.utils.js'
import { Document } from 'mongodb'

export async function getTotalTenantsCountMetric(readModel: ReadModelClient): Promise<TotalTenantsCountMetric> {
  const isTenantOnboardedFilter: Document = {
    'data.selfcareId': { $exists: true },
  }

  const totalTenantsCountPromise = readModel.tenants.countDocuments(isTenantOnboardedFilter)
  const lastMonthTenantsCountPromise = readModel.tenants.countDocuments({
    'data.createdAt': {
      // TODO this should be 'onboardedAt', for now we use 'createdAt'
      $gte: getMonthsAgoDate(1).toISOString(),
    },
    ...isTenantOnboardedFilter,
  })
  const twoMonthsAgoTenantsCountPromise = readModel.tenants.countDocuments({
    'data.createdAt': {
      // TODO this should be 'onboardedAt', for now we use 'createdAt'
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

  const variation =
    lastMonthTenantsCount > 0
      ? Number((((lastMonthTenantsCount - twoMonthsAgoTenantsCount) / lastMonthTenantsCount) * 100).toFixed(1))
      : 0

  return { totalTenantsCount, lastMonthTenantsCount, variation }
}
