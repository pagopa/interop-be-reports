import { GlobalStoreService } from '../../services/global-store.service.js'
import { TokensByDay } from '../../services/tokens-store.service.js'
import { aggregateTokensCount } from '../../utils/helpers.utils.js'
import { getTotalTokensMetric } from '../total-tokens.metric.js'
import { ReadModelClient } from '@interop-be-reports/commons'
import { sub } from 'date-fns'

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

describe('getTotalTokensMetric', () => {
  it('should return the correct metrics', async () => {
    const result = await getTotalTokensMetric({} as ReadModelClient, {} as GlobalStoreService)
    console.log(result)

    expect(result.lastMonthCount).toStrictEqual(3)
    expect(result.totalCount).toStrictEqual(getTokensByDayMock().totalTokens)
  })
})
