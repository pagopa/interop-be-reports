import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { aggregateTokensCount, getMonthsAgoDate } from '../utils/helpers.utils.js'
import { TokensStore } from '../services/tokens-store.service.js'
import { sub } from 'date-fns'

export const getTokensTrendMetric: MetricFactoryFn<'attivitaDellaPiattaforma'> = async () => {
  const { tokensByDay } = await TokensStore.getInstance()

  function getTimeseriesFromTokensByDay({
    oldestDate,
    jump,
  }: {
    oldestDate: Date
    jump: Duration
  }): Array<{ date: Date; count: number }> {
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    let currentCount: number = aggregateTokensCount(tokensByDay)
    const timeseriesData: Array<{ date: Date; count: number }> = [{ date: currentDate, count: currentCount }]

    while (oldestDate <= currentDate) {
      currentDate = sub(currentDate, jump)
      currentDate.setHours(0, 0, 0, 0)
      currentCount = aggregateTokensCount(tokensByDay.filter(({ day }) => day <= currentDate))
      timeseriesData.push({ date: currentDate, count: currentCount })
    }

    return timeseriesData.reverse()
  }

  return {
    lastSixMonths: getTimeseriesFromTokensByDay({
      oldestDate: getMonthsAgoDate(6),
      jump: { days: 5 },
    }),
    lastTwelveMonths: getTimeseriesFromTokensByDay({
      oldestDate: getMonthsAgoDate(12),
      jump: { days: 10 },
    }),
    fromTheBeginning: getTimeseriesFromTokensByDay({
      oldestDate: tokensByDay[0].day,
      jump: { months: 1 },
    }),
  }
}
