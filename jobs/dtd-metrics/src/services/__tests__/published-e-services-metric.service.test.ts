import { getEServiceMock } from '@interop-be-reports/commons'
import { getPublishedEServicesMetric } from '../published-e-services-metric.service.js'
import { readModel, seedCollection } from './metrics-tests.utils.js'

describe('getPublishedEServicesMetric', () => {
  it('should return the correct metrics', async () => {
    const today = new Date()
    const moreThanOneMonthAgo = new Date(today)

    moreThanOneMonthAgo.setDate(moreThanOneMonthAgo.getDate() - 40)

    await seedCollection('eservices', [
      { data: getEServiceMock({ descriptors: [{ state: 'Published', publishedAt: today.toISOString() }] }) },
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Suspended', publishedAt: today.toISOString() }, { state: 'Draft' }],
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [
            { state: 'Suspended', publishedAt: moreThanOneMonthAgo.toISOString() },
            { state: 'Deprecated' },
          ],
        }),
      },
      { data: getEServiceMock({ descriptors: [{ state: 'Draft' }] }) },
    ])

    const result = await getPublishedEServicesMetric(readModel)
    expect(result.publishedEServicesCount).toStrictEqual(3)
    expect(result.lastMonthPublishedEServicesCount).toStrictEqual(2)
  })
})
