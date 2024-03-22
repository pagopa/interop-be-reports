import { AgreementState } from '@interop-be-reports/commons'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { getMonthsAgoDate, getVariationPercentage } from '../utils/helpers.utils.js'
import { Document } from 'mongodb'

export const getTotalConnectionsMetric: MetricFactoryFn<'connessioniTotali'> = async (readModel) => {
  const activeAgrementsFilter: Document = {
    'data.state': {
      $in: ['Active', 'Suspended'] satisfies Array<AgreementState>,
    },
  }

  const agreementsCountPromise = readModel.agreements.countDocuments(activeAgrementsFilter)
  const lastMonthAgreementsCountPromise = readModel.agreements.countDocuments({
    ...activeAgrementsFilter,
    'data.createdAt': { $gt: getMonthsAgoDate(1).toISOString() },
  })

  const [agreementsCount, lastMonthAgreementsCount] = await Promise.all([
    agreementsCountPromise,
    lastMonthAgreementsCountPromise,
  ])

  const variation = getVariationPercentage(lastMonthAgreementsCount, agreementsCount)

  return {
    totalCount: agreementsCount,
    lastMonthCount: lastMonthAgreementsCount,
    variation,
  }
}
