import { getAgreementMock } from '@interop-be-reports/commons'
import { readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { GlobalStoreService } from '../../services/global-store.service.js'
import { getTotalConnectionsMetric } from '../total-connections.metric.js'

describe('totalConnectionsMetric', () => {
  it('should return the correct metrics', async () => {
    const today = new Date()
    const moreThanOneMonthAgo = new Date(today)

    moreThanOneMonthAgo.setDate(moreThanOneMonthAgo.getDate() - 40)

    await seedCollection('agreements', [
      {
        data: getAgreementMock({ state: 'Active', createdAt: today.toISOString() }),
      },
      {
        data: getAgreementMock({ state: 'Suspended', createdAt: today.toISOString() }),
      },
      {
        data: getAgreementMock({ state: 'Suspended', createdAt: moreThanOneMonthAgo.toISOString() }),
      },
      { data: getAgreementMock({ state: 'Draft', createdAt: today.toISOString() }) },
    ])

    const globalStore = await GlobalStoreService.init(readModelMock)
    const result = await getTotalConnectionsMetric(readModelMock, globalStore)
    expect(result.totalCount).toStrictEqual(3)
    expect(result.lastMonthCount).toStrictEqual(2)
  })
})
