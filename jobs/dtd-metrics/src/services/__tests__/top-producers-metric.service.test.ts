import { getEServiceMock, getTenantMock } from '@interop-be-reports/commons'
import { readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { randomUUID } from 'crypto'
import { getTopProducersMetric } from '../top-producers-metric.service.js'
import { getMonthsAgoDate } from '../../utils/helpers.utils.js'

const producer1Uuid = randomUUID()
const producer2Uuid = randomUUID()

describe('getTopProducersMetric', () => {
  it('should return the correct metrics', async () => {
    const threeMonthsAgoDate = getMonthsAgoDate(3)
    const nineMonthsAgoDate = getMonthsAgoDate(9)

    await seedCollection('eservices', [
      { data: getEServiceMock({ producerId: producer1Uuid }) },
      { data: getEServiceMock({ producerId: producer1Uuid }) },
      { data: getEServiceMock({ producerId: producer1Uuid, descriptors: [{ state: 'Draft' }] }) },
      {
        data: getEServiceMock({
          producerId: producer1Uuid,
          descriptors: [{ state: 'Published', publishedAt: nineMonthsAgoDate.toISOString() }],
        }),
      },
      { data: getEServiceMock({ producerId: producer2Uuid }) },
      { data: getEServiceMock({ producerId: producer2Uuid, descriptors: [{ state: 'Archived' }] }) },
      { data: getEServiceMock({ producerId: producer2Uuid, descriptors: [{ state: 'Deprecated' }] }) },
      {
        data: getEServiceMock({
          producerId: producer2Uuid,
          descriptors: [{ state: 'Published', publishedAt: threeMonthsAgoDate.toISOString() }],
        }),
      },
    ])

    await seedCollection('tenants', [
      {
        data: getTenantMock({
          id: producer1Uuid,
          name: 'Producer 1',
        }),
      },
      {
        data: getTenantMock({
          id: producer2Uuid,
          name: 'Producer 2',
        }),
      },
    ])

    const result = await getTopProducersMetric(readModelMock)

    expect(result.lastSixMonths[0]).toEqual({ producerName: 'Producer 2', count: 1 })

    expect(result.lastTwelveMonths[0]).toEqual({ producerName: 'Producer 1', count: 1 })
    expect(result.lastTwelveMonths[1]).toEqual({ producerName: 'Producer 2', count: 1 })

    expect(result.fromTheBeginning[0]).toEqual({ producerName: 'Producer 1', count: 3 })
    expect(result.fromTheBeginning[1]).toEqual({ producerName: 'Producer 2', count: 2 })
  })
})
