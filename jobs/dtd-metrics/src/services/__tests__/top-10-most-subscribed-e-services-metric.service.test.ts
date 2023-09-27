import { getAgreementMock, getEServiceMock, getTenantMock } from '@interop-be-reports/commons'
import { readModel, repeatObjInArray, seedCollection } from './metrics-tests.utils.js'
import { getTop10MostSubscribedEServicesMetric } from '../top-10-most-subscribed-e-services-metric.service.js'

describe('getTop10MostSubscribedEServicesMetricService', () => {
  it('should return the correct metrics', async () => {
    await seedCollection('eservices', [
      { data: getEServiceMock({ id: 'eservice-1', name: 'eservice-1' }) },
      { data: getEServiceMock({ id: 'eservice-2', name: 'eservice-2' }) },
      { data: getEServiceMock({ id: 'eservice-3', name: 'eservice-3' }) },
      { data: getEServiceMock({ id: 'eservice-4', name: 'eservice-4' }) },
    ])

    await seedCollection('agreements', [
      ...repeatObjInArray({ data: getAgreementMock({ eserviceId: 'eservice-1', producerId: 'producer-1' }) }, 3),
      ...repeatObjInArray({ data: getAgreementMock({ eserviceId: 'eservice-2', producerId: 'producer-1' }) }, 2),
      ...repeatObjInArray({ data: getAgreementMock({ eserviceId: 'eservice-3', producerId: 'producer-1' }) }, 1),
      ...repeatObjInArray({ data: getAgreementMock({ eserviceId: 'eservice-4', producerId: 'producer-1' }) }, 4),
    ])

    await seedCollection('tenants', [
      {
        data: getTenantMock({
          id: 'producer-1',
          name: 'Producer 1',
        }),
      },
    ])

    const result = await getTop10MostSubscribedEServicesMetric(readModel)

    expect(result.fromTheBeginning[0].agreementsCount).toStrictEqual(4)
    expect(result.fromTheBeginning[0].name).toStrictEqual('eservice-4')
    expect(result.fromTheBeginning[0].producerName).toStrictEqual('Producer 1')

    expect(result.fromTheBeginning[1].agreementsCount).toStrictEqual(3)
    expect(result.fromTheBeginning[1].name).toStrictEqual('eservice-1')
    expect(result.fromTheBeginning[1].producerName).toStrictEqual('Producer 1')

    expect(result.fromTheBeginning[2].agreementsCount).toStrictEqual(2)
    expect(result.fromTheBeginning[2].name).toStrictEqual('eservice-2')
    expect(result.fromTheBeginning[2].producerName).toStrictEqual('Producer 1')

    expect(result.fromTheBeginning[3].agreementsCount).toStrictEqual(1)
    expect(result.fromTheBeginning[3].name).toStrictEqual('eservice-3')
    expect(result.fromTheBeginning[3].producerName).toStrictEqual('Producer 1')
  })
})
