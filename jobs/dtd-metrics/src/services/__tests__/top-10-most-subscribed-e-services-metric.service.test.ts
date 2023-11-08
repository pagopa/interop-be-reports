import { getAgreementMock, getAttributeMock, getEServiceMock, getTenantMock } from '@interop-be-reports/commons'
import { MacroCategoryCodeFor, MacroCategoryName, readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { getTop10MostSubscribedEServicesMetric } from '../top-10-most-subscribed-e-services-metric.service.js'
import { randomUUID } from 'crypto'

const eservice1Uuid = randomUUID()
const eservice2Uuid = randomUUID()
const eservice3Uuid = randomUUID()
const eservice4Uuid = randomUUID()
const producerUuid = randomUUID()
const comune1Uuid = randomUUID()
const comune2Uuid = randomUUID()
const comune3Uuid = randomUUID()
const aziendaOspedaliera1Uuid = randomUUID()
const aziendaOspedaliera2Uuid = randomUUID()
const aziendaOspedaliera3Uuid = randomUUID()
const comuneAttributeUuid = randomUUID()
const aziendaOspedalieraAttributeUuid = randomUUID()

describe('getTop10MostSubscribedEServicesMetric', () => {
  it('should return the correct metrics', async () => {
    await seedCollection('eservices', [
      { data: getEServiceMock({ name: 'eservice-1', id: eservice1Uuid, producerId: producerUuid }) },
      { data: getEServiceMock({ name: 'eservice-2', id: eservice2Uuid, producerId: producerUuid }) },
      { data: getEServiceMock({ name: 'eservice-3', id: eservice3Uuid, producerId: producerUuid }) },
      { data: getEServiceMock({ name: 'eservice-4', id: eservice4Uuid, producerId: producerUuid }) },
    ])

    await seedCollection('agreements', [
      {
        data: getAgreementMock({
          eserviceId: eservice1Uuid,
          consumerId: comune1Uuid,
          producerId: producerUuid,
          certifiedAttributes: [{ id: comuneAttributeUuid }],
          createdAt: new Date().toISOString(),
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: eservice4Uuid,
          consumerId: comune1Uuid,
          producerId: producerUuid,
          certifiedAttributes: [{ id: comuneAttributeUuid }],
          createdAt: new Date().toISOString(),
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: eservice2Uuid,
          consumerId: comune2Uuid,
          producerId: producerUuid,
          certifiedAttributes: [{ id: comuneAttributeUuid }],
          createdAt: new Date().toISOString(),
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: eservice2Uuid,
          consumerId: comune3Uuid,
          producerId: producerUuid,
          certifiedAttributes: [{ id: comuneAttributeUuid }],
          createdAt: new Date().toISOString(),
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: eservice1Uuid,
          consumerId: aziendaOspedaliera3Uuid,
          producerId: producerUuid,
          certifiedAttributes: [{ id: aziendaOspedalieraAttributeUuid }],
          createdAt: new Date().toISOString(),
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: eservice2Uuid,
          consumerId: comune3Uuid,
          producerId: producerUuid,
          state: 'Draft',
          certifiedAttributes: [{ id: comuneAttributeUuid }],
          createdAt: new Date().toISOString(),
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: eservice3Uuid,
          consumerId: aziendaOspedaliera1Uuid,
          producerId: producerUuid,
          certifiedAttributes: [{ id: aziendaOspedalieraAttributeUuid }],
          createdAt: new Date().toISOString(),
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: eservice3Uuid,
          consumerId: aziendaOspedaliera2Uuid,
          producerId: producerUuid,
          certifiedAttributes: [{ id: aziendaOspedalieraAttributeUuid }],
          createdAt: new Date().toISOString(),
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: eservice3Uuid,
          consumerId: aziendaOspedaliera3Uuid,
          producerId: producerUuid,
          certifiedAttributes: [{ id: aziendaOspedalieraAttributeUuid }],
          createdAt: new Date().toISOString(),
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: eservice3Uuid,
          consumerId: aziendaOspedaliera3Uuid,
          producerId: producerUuid,
          state: 'Pending',
          certifiedAttributes: [{ id: aziendaOspedalieraAttributeUuid }],
          createdAt: new Date().toISOString(),
        }),
      },
    ])

    await seedCollection('tenants', [
      {
        data: getTenantMock({
          id: producerUuid,
          name: 'Producer',
        }),
      },
      {
        data: getTenantMock({
          id: comune1Uuid,
          attributes: [{ id: comuneAttributeUuid, type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: comune2Uuid,
          attributes: [{ id: comuneAttributeUuid, type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: comune3Uuid,
          attributes: [{ id: comuneAttributeUuid, type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'comune-4',
          attributes: [{ id: comuneAttributeUuid, type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: aziendaOspedaliera1Uuid,
          attributes: [{ id: aziendaOspedalieraAttributeUuid, type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: aziendaOspedaliera2Uuid,
          attributes: [{ id: aziendaOspedalieraAttributeUuid, type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: aziendaOspedaliera3Uuid,
          attributes: [{ id: aziendaOspedalieraAttributeUuid, type: 'PersistentCertifiedAttribute' }],
        }),
      },
    ])

    await seedCollection('attributes', [
      {
        data: getAttributeMock({
          id: comuneAttributeUuid,
          code: 'L18' satisfies MacroCategoryCodeFor<'Comuni e città metropolitane'>,
        }),
      },
      {
        data: getAttributeMock({
          id: aziendaOspedalieraAttributeUuid,
          code: 'L8' satisfies MacroCategoryCodeFor<'Aziende Ospedaliere e ASL'>,
        }),
      },
    ])

    const result = await getTop10MostSubscribedEServicesMetric(readModelMock)
    const comuniTop10 = result.find((a) => (a.name as MacroCategoryName) === 'Aziende Ospedaliere e ASL')
      ?.top10MostSubscribedEServices

    expect(comuniTop10?.fromTheBeginning?.[0].eserviceName).toStrictEqual('eservice-3')
    expect(comuniTop10?.fromTheBeginning?.[0].tenantName).toStrictEqual('Producer')
    expect(comuniTop10?.fromTheBeginning?.[0].count).toStrictEqual(3)

    expect(comuniTop10?.fromTheBeginning?.[1].eserviceName).toStrictEqual('eservice-1')
    expect(comuniTop10?.fromTheBeginning?.[1].tenantName).toStrictEqual('Producer')
    expect(comuniTop10?.fromTheBeginning?.[1].count).toStrictEqual(1)

    const aziendeOspedaliereTop10 = result.find((a) => (a.name as MacroCategoryName) === 'Aziende Ospedaliere e ASL')
      ?.top10MostSubscribedEServices

    expect(aziendeOspedaliereTop10?.fromTheBeginning?.[0].eserviceName).toStrictEqual('eservice-3')
    expect(aziendeOspedaliereTop10?.fromTheBeginning?.[0].tenantName).toStrictEqual('Producer')
    expect(aziendeOspedaliereTop10?.fromTheBeginning?.[0].count).toStrictEqual(3)
  })
})
