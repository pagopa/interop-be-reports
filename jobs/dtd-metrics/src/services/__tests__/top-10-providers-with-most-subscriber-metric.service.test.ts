import { getAgreementMock, getAttributeMock, getEServiceMock, getTenantMock } from '@interop-be-reports/commons'
import { MacroCategoryCodeFor, MacroCategoryName, readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { getTop10ProviderWithMostSubscriberMetric } from '../top-10-providers-with-most-subscriber-metric.service.js'
import { randomUUID } from 'crypto'

const eservice1Uuid = randomUUID()
const eservice2Uuid = randomUUID()
const eservice3Uuid = randomUUID()
const producer1Uuid = randomUUID()
const producer2Uuid = randomUUID()
const comuneConsumerUuid = randomUUID()
const aziendaOspedalieraConsumerUuid = randomUUID()
const comuneAttributeUuid = randomUUID()
const aziendaOspedalieraAttributeUuid = randomUUID()

describe('getTop10ProviderWithMostSubscriberMetric', () => {
  it('should return the correct metrics', async () => {
    await seedCollection('eservices', [
      { data: getEServiceMock({ name: 'eservice-1', id: eservice1Uuid, producerId: producer1Uuid }) },
      { data: getEServiceMock({ name: 'eservice-2', id: eservice2Uuid, producerId: producer1Uuid }) },
      { data: getEServiceMock({ name: 'eservice-3', id: eservice3Uuid, producerId: producer2Uuid }) },
    ])

    await seedCollection('agreements', [
      {
        data: getAgreementMock({
          eserviceId: eservice1Uuid,
          producerId: producer1Uuid,
          consumerId: comuneConsumerUuid,
          certifiedAttributes: [{ id: comuneAttributeUuid }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: eservice2Uuid,
          producerId: producer1Uuid,
          consumerId: comuneConsumerUuid,
          certifiedAttributes: [{ id: comuneAttributeUuid }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: eservice3Uuid,
          producerId: producer2Uuid,
          consumerId: comuneConsumerUuid,
          certifiedAttributes: [{ id: comuneAttributeUuid }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: eservice1Uuid,
          producerId: producer1Uuid,
          consumerId: aziendaOspedalieraConsumerUuid,
          certifiedAttributes: [{ id: aziendaOspedalieraAttributeUuid }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: eservice2Uuid,
          producerId: producer1Uuid,
          consumerId: aziendaOspedalieraConsumerUuid,
          certifiedAttributes: [{ id: aziendaOspedalieraAttributeUuid }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: eservice3Uuid,
          producerId: producer2Uuid,
          consumerId: aziendaOspedalieraConsumerUuid,
          certifiedAttributes: [{ id: aziendaOspedalieraAttributeUuid }],
          state: 'Pending',
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
      {
        data: getTenantMock({
          id: 'comune',
          attributes: [{ id: comuneAttributeUuid, type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: aziendaOspedalieraConsumerUuid,
          attributes: [{ id: aziendaOspedalieraAttributeUuid, type: 'PersistentCertifiedAttribute' }],
        }),
      },
    ])

    await seedCollection('attributes', [
      {
        data: getAttributeMock({
          id: comuneAttributeUuid,
          code: 'L18' satisfies MacroCategoryCodeFor<'Comuni e città metropolitane'>,
          kind: 'Certified',
        }),
      },
      {
        data: getAttributeMock({
          id: aziendaOspedalieraAttributeUuid,
          code: 'L8' satisfies MacroCategoryCodeFor<'Aziende Ospedaliere e ASL'>,
          kind: 'Certified',
        }),
      },
    ])

    const result = await getTop10ProviderWithMostSubscriberMetric(readModelMock)

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
      (a) => (a.name as MacroCategoryName) === 'Comuni e città metropolitane'
    )
    const producer2AziendeOspedaliere = producer2.topSubscribers.find(
      (a) => (a.name as MacroCategoryName) === 'Aziende Ospedaliere e ASL'
    )
    expect(producer2Comuni?.agreementsCount).toStrictEqual(1)
    expect(producer2AziendeOspedaliere?.agreementsCount).toStrictEqual(0)
  })
})
