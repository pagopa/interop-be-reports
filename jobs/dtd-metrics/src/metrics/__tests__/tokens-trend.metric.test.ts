import { GlobalStoreService } from '../../services/global-store.service.js'
import { TokensByDay } from '../../services/tokens-store.service.js'
import { aggregateTokensCount } from '../../utils/helpers.utils.js'
import { ReadModelClient } from '@interop-be-reports/commons'
import { sub } from 'date-fns'
import { getTokensTrendMetric } from '../tokens-trend.metric.js'

function getTokensByDayMock(): { totalTokens: number; tokensByDay: TokensByDay } {
  const tokensByDayMock = [
    { day: sub(new Date(), { months: 4 }), tokens: 1 },
    { day: sub(new Date(), { months: 3 }), tokens: 2 },
    { day: new Date(), tokens: 3 },
  ]
  return {
    totalTokens: aggregateTokensCount(tokensByDayMock),
    tokensByDay: tokensByDayMock,
  }
}

vi.mock('../../services/tokens-store.service.js', () => ({
  TokensStore: {
    getInstance: (): unknown => getTokensByDayMock(),
  },
}))

describe('getTokensTrendMetric', () => {
  it('should return the correct metrics', async () => {
    const result = await getTokensTrendMetric({} as ReadModelClient, {} as GlobalStoreService)

    expect(result.fromTheBeginning[result.fromTheBeginning.length - 1].count).toStrictEqual(
      getTokensByDayMock().totalTokens
    )

    expect(result.lastSixMonths[result.lastSixMonths.length - 1].count).toStrictEqual(getTokensByDayMock().totalTokens)

    expect(result.lastTwelveMonths[result.lastTwelveMonths.length - 1].count).toStrictEqual(
      getTokensByDayMock().totalTokens
    )
  })
})
