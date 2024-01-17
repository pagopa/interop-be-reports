import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { getMonthsAgoDate, toTimeseriesSequenceData } from '../utils/helpers.utils.js'
import { TokensTrendMetric } from '../models/metrics.model.js'
import { TokensStore } from '../services/tokens-store.service.js'

export const getTokensTrendMetric: MetricFactoryFn<'attivitaDellaPiattaforma'> = async () => {
  const { tokens } = await TokensStore.getInstance()

  return TokensTrendMetric.parse({
    lastSixMonths: toTimeseriesSequenceData({
      oldestDate: getMonthsAgoDate(6),
      jump: { days: 5 },
      data: tokens,
    }),
    lastTwelveMonths: toTimeseriesSequenceData({
      oldestDate: getMonthsAgoDate(12),
      jump: { days: 10 },
      data: tokens,
    }),
    fromTheBeginning: toTimeseriesSequenceData({
      oldestDate: tokens[0],
      jump: { months: 1 },
      data: tokens,
    }),
  })
}
