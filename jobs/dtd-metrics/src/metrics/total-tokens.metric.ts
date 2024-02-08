import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { aggregateTokensCount, getMonthsAgoDate, getVariationPercentage } from '../utils/helpers.utils.js'
import { TokensStore } from '../services/tokens-store.service.js'

export const getTotalTokensMetric: MetricFactoryFn<'totaleRichiesteDiAccesso'> = async () => {
  const { totalTokens, tokensByDay } = await TokensStore.getInstance()

  const oneMonthAgo = getMonthsAgoDate(1)

  const lastMonthCount = aggregateTokensCount(tokensByDay.filter((d) => d.day > oneMonthAgo))
  const variation = getVariationPercentage(lastMonthCount, totalTokens)

  return {
    totalCount: totalTokens,
    lastMonthCount,
    variation,
  }
}
