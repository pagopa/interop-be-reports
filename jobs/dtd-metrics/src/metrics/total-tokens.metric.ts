import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { getMonthsAgoDate, getVariationPercentage } from '../utils/helpers.utils.js'
import { TotalTokensMetric } from '../models/metrics.model.js'
import { TokensStore } from '../services/tokens-store.service.js'

export const getTotalTokensMetric: MetricFactoryFn<'totaleRichiesteDiAccesso'> = async () => {
  const { totalTokens, tokensByDay, aggregateTokensCount } = await TokensStore.getInstance()

  const oneMonthAgo = getMonthsAgoDate(1)

  const lastMonthCount = aggregateTokensCount(tokensByDay.filter((d) => d.day > oneMonthAgo))
  const variation = getVariationPercentage(lastMonthCount, totalTokens)

  return TotalTokensMetric.parse({
    totalCount: totalTokens,
    lastMonthCount,
    variation,
  })
}