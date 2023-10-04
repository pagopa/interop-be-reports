import { getAgreementMock, getAttributeMock, getEServiceMock, getTenantMock } from '@interop-be-reports/commons'
import { MacroCategoryCodeFor, MacroCategoryName, readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { getTop10MostSubscribedEServicesMetric } from '../top-10-most-subscribed-e-services-metric.service.js'

describe('getTop10MostSubscribedEServicesMetric', () => {
  it('should return the correct metrics', async () => {
    await seedCollection('eservices', [
      { data: getEServiceMock({ name: 'eservice-1', id: 'eservice-1', producerId: 'producer' }) },
      { data: getEServiceMock({ name: 'eservice-2', id: 'eservice-2', producerId: 'producer' }) },
      { data: getEServiceMock({ name: 'eservice-3', id: 'eservice-3', producerId: 'producer' }) },
    ])

    await seedCollection('agreements', [
      {
        data: getAgreementMock({
          eserviceId: 'eservice-1',
          consumerId: 'comune-1',
          producerId: 'producer',
          certifiedAttributes: [{ id: 'attribute-comune' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-2',
          consumerId: 'comune-2',
          producerId: 'producer',
          certifiedAttributes: [{ id: 'attribute-comune' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-2',
          consumerId: 'comune-3',
          producerId: 'producer',
          certifiedAttributes: [{ id: 'attribute-comune' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-1',
          consumerId: 'azienda-ospedaliera-3',
          producerId: 'producer',
          certifiedAttributes: [{ id: 'attribute-azienda-ospedaliera' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-2',
          consumerId: 'comune-3',
          producerId: 'producer',
          state: 'Draft',
          certifiedAttributes: [{ id: 'attribute-comune' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-3',
          consumerId: 'azienda-ospedaliera-1',
          producerId: 'producer',
          certifiedAttributes: [{ id: 'attribute-azienda-ospedaliera' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-3',
          consumerId: 'azienda-ospedaliera-2',
          producerId: 'producer',
          certifiedAttributes: [{ id: 'attribute-azienda-ospedaliera' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-3',
          consumerId: 'azienda-ospedaliera-3',
          producerId: 'producer',
          certifiedAttributes: [{ id: 'attribute-azienda-ospedaliera' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-3',
          consumerId: 'azienda-ospedaliera-3',
          producerId: 'producer',
          state: 'Pending',
          certifiedAttributes: [{ id: 'attribute-azienda-ospedaliera' }],
        }),
      },
    ])

    await seedCollection('tenants', [
      {
        data: getTenantMock({
          id: 'producer',
          name: 'Producer',
        }),
      },
      {
        data: getTenantMock({
          id: 'comune-1',
          attributes: [{ id: 'attribute-comune', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'comune-2',
          attributes: [{ id: 'attribute-comune', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'comune-3',
          attributes: [{ id: 'attribute-comune', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'comune-4',
          attributes: [{ id: 'attribute-comune', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'azienda-ospedaliera-1',
          attributes: [{ id: 'attribute-azienda-ospedaliera', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'azienda-ospedaliera-2',
          attributes: [{ id: 'attribute-azienda-ospedaliera', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'azienda-ospedaliera-3',
          attributes: [{ id: 'attribute-azienda-ospedaliera', type: 'PersistentCertifiedAttribute' }],
        }),
      },
    ])

    await seedCollection('attributes', [
      {
        data: getAttributeMock({
          id: 'attribute-comune',
          code: 'L18' satisfies MacroCategoryCodeFor<'Comuni e città metropolitane'>,
        }),
      },
      {
        data: getAttributeMock({
          id: 'attribute-azienda-ospedaliera',
          code: 'L8' satisfies MacroCategoryCodeFor<'Aziende Ospedaliere e ASL'>,
        }),
      },
    ])

    const result = await getTop10MostSubscribedEServicesMetric(readModelMock)
    const comuniTop10 = result.find((a) => (a.name as MacroCategoryName) === 'Aziende Ospedaliere e ASL')
      ?.top10MostSubscribedEServices

    expect(comuniTop10?.fromTheBeginning?.[0].name).toStrictEqual('eservice-3')
    expect(comuniTop10?.fromTheBeginning?.[0].producerName).toStrictEqual('Producer')
    expect(comuniTop10?.fromTheBeginning?.[0].agreementsCount).toStrictEqual(3)

    expect(comuniTop10?.fromTheBeginning?.[1].name).toStrictEqual('eservice-1')
    expect(comuniTop10?.fromTheBeginning?.[1].producerName).toStrictEqual('Producer')
    expect(comuniTop10?.fromTheBeginning?.[1].agreementsCount).toStrictEqual(1)

    const aziendeOspedaliereTop10 = result.find((a) => (a.name as MacroCategoryName) === 'Aziende Ospedaliere e ASL')
      ?.top10MostSubscribedEServices

    expect(aziendeOspedaliereTop10?.fromTheBeginning?.[0].name).toStrictEqual('eservice-3')
    expect(aziendeOspedaliereTop10?.fromTheBeginning?.[0].producerName).toStrictEqual('Producer')
    expect(aziendeOspedaliereTop10?.fromTheBeginning?.[0].agreementsCount).toStrictEqual(3)
  })
})
