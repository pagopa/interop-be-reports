import { getAgreementMock, getAttributeMock, getEServiceMock, getTenantMock } from '@interop-be-reports/commons'
import { MacroCategoryCodeFor, MacroCategoryName, readModel, seedCollection } from './metrics-tests.utils.js'
import { getTop10ProviderWithMostSubscriberMetric } from '../top-10-providers-with-most-subscriber-metric.service.js'

describe('getTop10ProviderWithMostSubscriberMetric', () => {
  it('should return the correct metrics', async () => {
    await seedCollection('eservices', [
      { data: getEServiceMock({ name: 'eservice-1', id: 'eservice-1', producerId: 'producer-1' }) },
      { data: getEServiceMock({ name: 'eservice-2', id: 'eservice-2', producerId: 'producer-1' }) },
      { data: getEServiceMock({ name: 'eservice-3', id: 'eservice-3', producerId: 'producer-2' }) },
    ])

    await seedCollection('agreements', [
      {
        data: getAgreementMock({
          eserviceId: 'eservice-1',
          producerId: 'producer-1',
          consumerId: 'comune',
          certifiedAttributes: [{ id: 'attribute-comune' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-2',
          producerId: 'producer-1',
          consumerId: 'comune',
          certifiedAttributes: [{ id: 'attribute-comune' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-3',
          producerId: 'producer-2',
          consumerId: 'comune',
          certifiedAttributes: [{ id: 'attribute-comune' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-1',
          producerId: 'producer-1',
          consumerId: 'azienda-ospedaliera',
          certifiedAttributes: [{ id: 'attribute-azienda-ospedaliera' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-2',
          producerId: 'producer-1',
          consumerId: 'azienda-ospedaliera',
          certifiedAttributes: [{ id: 'attribute-azienda-ospedaliera' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-3',
          producerId: 'producer-2',
          consumerId: 'azienda-ospedaliera',
          certifiedAttributes: [{ id: 'attribute-azienda-ospedaliera' }],
          state: 'Pending',
        }),
      },
    ])

    await seedCollection('tenants', [
      {
        data: getTenantMock({
          id: 'producer-1',
          name: 'Producer 1',
        }),
      },
      {
        data: getTenantMock({
          id: 'producer-2',
          name: 'Producer 2',
        }),
      },
      {
        data: getTenantMock({
          id: 'comune',
          attributes: [{ id: 'attribute-comune', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'azienda-ospedaliera',
          attributes: [{ id: 'attribute-azienda-ospedaliera', type: 'PersistentCertifiedAttribute' }],
        }),
      },
    ])

    await seedCollection('attributes', [
      {
        data: getAttributeMock({
          id: 'attribute-comune',
          code: 'L18' satisfies MacroCategoryCodeFor<'Comuni e città metropolitane'>,
          kind: 'Certified',
        }),
      },
      {
        data: getAttributeMock({
          id: 'attribute-azienda-ospedaliera',
          code: 'L8' satisfies MacroCategoryCodeFor<'Aziende Ospedaliere e ASL'>,
          kind: 'Certified',
        }),
      },
    ])

    const result = await getTop10ProviderWithMostSubscriberMetric(readModel)

    const producer1 = result.fromTheBeginning[0]
    expect(producer1.name).toStrictEqual('Producer 1')

    const producer1Comuni = producer1.topSubscribers.find(
      (a) => (a.name as MacroCategoryName) === 'Comuni e città metropolitane'
    )

    const producer1AziendeOspedaliere = producer1.topSubscribers.find(
      (a) => (a.name as MacroCategoryName) === 'Aziende Ospedaliere e ASL'
    )

    expect(producer1Comuni?.agreementsCount).toStrictEqual(2)
    expect(producer1AziendeOspedaliere?.agreementsCount).toStrictEqual(2)

    const producer2 = result.fromTheBeginning[1]
    expect(producer2.name).toStrictEqual('Producer 2')
    const producer2Comuni = producer2.topSubscribers.find(
      (a) => (a.name as MacroCategoryName) === 'Comuni e città metropolitane' //TODO: Fix typing
    )
    const producer2AziendeOspedaliere = producer2.topSubscribers.find(
      (a) => (a.name as MacroCategoryName) === 'Aziende Ospedaliere e ASL' //TODO: Fix typing
    )
    expect(producer2Comuni?.agreementsCount).toStrictEqual(1)
    expect(producer2AziendeOspedaliere?.agreementsCount).toStrictEqual(0)
  })
})
