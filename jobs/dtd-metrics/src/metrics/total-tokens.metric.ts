import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { getMonthsAgoDate, getVariationPercentage } from '../utils/helpers.utils.js'
import { TotalTokensMetric } from '../models/metrics.model.js'
import { TokensStore } from '../services/tokens-store.service.js'

export const getTotalTokensMetric: MetricFactoryFn<'totaleRichiesteDiAccesso'> = async () => {
  const { tokens } = await TokensStore.getInstance()

  const oneMonthAgo = getMonthsAgoDate(1)

  const totalCount = tokens.length
  const lastMonthCount = tokens.filter((d) => d > oneMonthAgo).length
  const variation = getVariationPercentage(lastMonthCount, totalCount)

  return TotalTokensMetric.parse({
    totalCount,
    lastMonthCount,
    variation,
  })
}
