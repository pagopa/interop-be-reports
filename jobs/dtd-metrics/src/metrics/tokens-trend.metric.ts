import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { aggregateTokensCount, getMonthsAgoDate } from '../utils/helpers.utils.js'
import { TokensStore } from '../services/tokens-store.service.js'
import { sub } from 'date-fns'

export const getTokensTrendMetric: MetricFactoryFn<'attivitaDellaPiattaforma'> = async () => {
  const { tokensByDay } = await TokensStore.getInstance()

  function generateTokensTrendData({
    oldestDate,
    jump,
  }: {
    oldestDate: Date
    jump: Duration
  }): Array<{ date: Date; count: number }> {
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    const data: Array<{ date: Date; count: number }> = []

    while (currentDate >= oldestDate) {
      const nextDate = sub(currentDate, jump)
      nextDate.setHours(0, 0, 0, 0)
      // Get the tokens count from the current date to the next date
      const count = aggregateTokensCount(tokensByDay.filter(({ day }) => day <= currentDate && day > nextDate))
      data.push({ date: currentDate, count })
      currentDate = nextDate
    }

    return data.reverse()
  }

  return {
    lastSixMonths: generateTokensTrendData({
      oldestDate: getMonthsAgoDate(6),
      jump: { days: 5 },
    }),
    lastTwelveMonths: generateTokensTrendData({
      oldestDate: getMonthsAgoDate(12),
      jump: { days: 10 },
    }),
    fromTheBeginning: generateTokensTrendData({
      oldestDate: tokensByDay[0].day,
      jump: { months: 1 },
    }),
  }
}
