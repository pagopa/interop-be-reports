import { getAgreementMock, getAttributeMock, getTenantMock } from '@interop-be-reports/commons'
import { MacroCategoryCodeFor, MacroCategoryName, readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { randomUUID } from 'crypto'
import { GlobalStoreService } from '../../services/global-store.service.js'
import { getTopProducersBySubscribersMetric } from '../top-producers-by-subscribers.metric.js'

const producer1Uuid = randomUUID()
const producer2Uuid = randomUUID()
const comuneConsumerUuid = randomUUID()
const aziendaOspedalieraConsumerUuid = randomUUID()
const comuneAttributeUuid = randomUUID()
const aziendaOspedalieraAttributeUuid = randomUUID()

describe('getTopProducersBySubscribersMetric', () => {
  it('should return the correct metrics', async () => {
    await seedCollection('agreements', [
      {
        data: getAgreementMock({
          producerId: producer1Uuid,
          consumerId: comuneConsumerUuid,
        }),
      },
      {
        data: getAgreementMock({
          producerId: producer1Uuid,
          consumerId: comuneConsumerUuid,
        }),
      },
      {
        data: getAgreementMock({
          producerId: producer2Uuid,
          consumerId: comuneConsumerUuid,
        }),
      },
      {
        data: getAgreementMock({
          producerId: producer1Uuid,
          consumerId: aziendaOspedalieraConsumerUuid,
        }),
      },
      {
        data: getAgreementMock({
          producerId: producer1Uuid,
          consumerId: aziendaOspedalieraConsumerUuid,
        }),
      },
      {
        data: getAgreementMock({
          producerId: producer2Uuid,
          consumerId: aziendaOspedalieraConsumerUuid,
          state: 'Pending',
        }),
      },
    ])

    await seedCollection('tenants', [
      {
        data: getTenantMock({
          id: producer1Uuid,
          name: 'Producer 1',
          attributes: [{ id: comuneAttributeUuid, type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: producer2Uuid,
          name: 'Producer 2',
          attributes: [{ id: comuneAttributeUuid, type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: comuneConsumerUuid,
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
          code: 'L18' satisfies MacroCategoryCodeFor<'Comuni'>,
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

    const globalStore = await GlobalStoreService.init(readModelMock)
    const result = await getTopProducersBySubscribersMetric(readModelMock, globalStore)

    const producer1 = result.fromTheBeginning[0].data[0]
    expect(producer1.producerName).toStrictEqual('Producer 1')

    const producer1Comuni = producer1.macroCategories.find((a) => (a.name as MacroCategoryName) === 'Comuni')

    const producer1AziendeOspedaliere = producer1.macroCategories.find(
      (a) => (a.name as MacroCategoryName) === 'Aziende Ospedaliere e ASL'
    )

    expect(producer1Comuni?.subscribersCount).toStrictEqual(1)
    expect(producer1AziendeOspedaliere?.subscribersCount).toStrictEqual(1)

    const producer2 = result.fromTheBeginning[0].data[1]
    expect(producer2.producerName).toStrictEqual('Producer 2')
    const producer2Comuni = producer2.macroCategories.find((a) => (a.name as MacroCategoryName) === 'Comuni')
    const producer2AziendeOspedaliere = producer2.macroCategories.find(
      (a) => (a.name as MacroCategoryName) === 'Aziende Ospedaliere e ASL'
    )
    expect(producer2Comuni?.subscribersCount).toStrictEqual(1)
    expect(producer2AziendeOspedaliere?.subscribersCount).toBeUndefined()
  })
})
