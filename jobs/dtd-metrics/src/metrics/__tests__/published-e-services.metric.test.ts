import { getEServiceMock } from '@interop-be-reports/commons'
import { readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { GlobalStoreService } from '../../services/global-store.service.js'
import { publishedEServicesMetric } from '../published-e-services.metric.js'

describe('publishedEServicesMetric', () => {
  it('should return the correct metrics', async () => {
    const today = new Date()
    const moreThanOneMonthAgo = new Date(today)

    moreThanOneMonthAgo.setDate(moreThanOneMonthAgo.getDate() - 40)

    await seedCollection('eservices', [
      {
        data: getEServiceMock({
          descriptors: [{ version: '1', state: 'Published', publishedAt: today.toISOString() }],
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [
            { version: '1', state: 'Suspended', publishedAt: today.toISOString() },
            { version: '2', state: 'Draft' },
          ],
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [
            { version: '1', state: 'Suspended', publishedAt: moreThanOneMonthAgo.toISOString() },
            { version: '2', state: 'Deprecated' },
          ],
        }),
      },
      { data: getEServiceMock({ descriptors: [{ state: 'Draft' }] }) },
    ])

    const globalStore = await GlobalStoreService.init(readModelMock)
    const result = await publishedEServicesMetric.factoryFn(readModelMock, globalStore)
    expect(result.count).toStrictEqual(3)
    expect(result.lastMonthCount).toStrictEqual(2)
  })
})
