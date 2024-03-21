import { AgreementState } from '@interop-be-reports/commons'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { getMonthsAgoDate, getVariationPercentage } from '../utils/helpers.utils.js'
import { z } from 'zod'

export const getTotalConnectionsMetric: MetricFactoryFn<'connessioniTotali'> = async (readModel) => {
  const agreements = await readModel.agreements
    .find({
      'data.state': {
        $in: ['Active', 'Suspended'] satisfies Array<AgreementState>,
      },
    })
    .map(({ data }) => z.coerce.date().parse(data.createdAt))
    .toArray()

  const totalCount = agreements.length
  const lastMonthCount = agreements.filter((d) => d > getMonthsAgoDate(1)).length
  const variation = getVariationPercentage(lastMonthCount, totalCount)

  return {
    totalCount,
    lastMonthCount,
    variation,
  }
}
