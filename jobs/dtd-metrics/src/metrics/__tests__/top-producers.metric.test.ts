import { getAttributeMock, getEServiceMock, getTenantMock } from '@interop-be-reports/commons'
import { MacroCategoryCodeFor, readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { randomUUID } from 'crypto'
import { getMonthsAgoDate } from '../../utils/helpers.utils.js'
import { GlobalStoreService } from '../../services/global-store.service.js'
import { getTopProducersMetric } from '../top-producers.metric.js'

const producer1Uuid = randomUUID()
const producer2Uuid = randomUUID()
const comuniAttributeUUID = randomUUID()
const aziendaOspedalieraAttributeUUID = randomUUID()

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
      {
        data: getEServiceMock({
          producerId: producer1Uuid,
          descriptors: [{ publishedAt: nineMonthsAgoDate.toISOString() }],
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

    await seedCollection('attributes', [
      {
        data: getAttributeMock({
          id: comuniAttributeUUID,
          code: 'L18' satisfies MacroCategoryCodeFor<'Comuni'>,
        }),
      },
      {
        data: getAttributeMock({
          id: aziendaOspedalieraAttributeUUID,
          code: 'L8' satisfies MacroCategoryCodeFor<'Aziende Ospedaliere e ASL'>,
        }),
      },
    ])

    await seedCollection('tenants', [
      {
        data: getTenantMock({
          id: producer1Uuid,
          name: 'Producer 1',
          attributes: [{ id: comuniAttributeUUID }],
        }),
      },
      {
        data: getTenantMock({
          id: producer2Uuid,
          name: 'Producer 2',
          attributes: [{ id: aziendaOspedalieraAttributeUUID }],
        }),
      },
    ])

    const globalStore = await GlobalStoreService.init(readModelMock)
    const result = await getTopProducersMetric(readModelMock, globalStore)

    console.log(JSON.stringify(result, null, 2))

    expect(result.lastSixMonths[0].data.length).toEqual(1)
    expect(result.lastSixMonths[0].data[0]).toEqual({ producerName: 'Producer 2', count: 1 })

    expect(result.lastTwelveMonths[0].data.length).toEqual(2)
    expect(result.lastTwelveMonths[0].data[0]).toEqual({ producerName: 'Producer 1', count: 2 })
    expect(result.lastTwelveMonths[0].data[1]).toEqual({ producerName: 'Producer 2', count: 1 })

    expect(result.fromTheBeginning[0].data.length).toEqual(2)
    expect(result.fromTheBeginning[0].data[0]).toEqual({ producerName: 'Producer 1', count: 4 })
    expect(result.fromTheBeginning[0].data[1]).toEqual({ producerName: 'Producer 2', count: 2 })
  })
})
