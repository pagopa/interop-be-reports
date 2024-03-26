import { randomUUID } from 'crypto'
import { GlobalStoreService } from '../../services/global-store.service.js'
import { AthenaClientService, getAttributeMock, getEServiceMock, getTenantMock } from '@interop-be-reports/commons'
import { MacroCategoryCodeFor, readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { getEServicesWithMostTokensMetric } from '../e-services-with-most-tokens.metric.js'

const producer1Uuid = randomUUID()
const producer2Uuid = randomUUID()
const consumer1Uuid = randomUUID()
const consumer2Uuid = randomUUID()
const consumer3Uuid = randomUUID()
const consumer4Uuid = randomUUID()
const eservice1Uuid = randomUUID()
const eservice2Uuid = randomUUID()
const eservice3Uuid = randomUUID()
const comuniAttributeUUID = randomUUID()
const aziendaOspedalieraAttributeUUID = randomUUID()

describe('getTotalTokensMetric', () => {
  it('should return the correct metrics', async () => {
    await seedCollection('eservices', [
      { data: getEServiceMock({ name: 'e-service-1', id: eservice1Uuid, producerId: producer1Uuid }) },
      { data: getEServiceMock({ name: 'e-service-2', id: eservice2Uuid, producerId: producer1Uuid }) },
      { data: getEServiceMock({ name: 'e-service-3', id: eservice3Uuid, producerId: producer2Uuid }) },
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
      {
        data: getTenantMock({
          id: consumer1Uuid,
          name: 'Consumer 1',
          attributes: [{ id: comuniAttributeUUID }],
        }),
      },
      {
        data: getTenantMock({
          id: consumer2Uuid,
          name: 'Consumer 2',
          attributes: [{ id: comuniAttributeUUID }],
        }),
      },
      {
        data: getTenantMock({
          id: consumer3Uuid,
          name: 'Consumer 3',
          attributes: [{ id: comuniAttributeUUID }],
        }),
      },
      {
        data: getTenantMock({
          id: consumer4Uuid,
          name: 'Consumer 4',
          attributes: [{ id: aziendaOspedalieraAttributeUUID }],
        }),
      },
    ])

    vi.spyOn(AthenaClientService.prototype, 'query').mockResolvedValue({
      ResultSet: {
        Rows: [
          {},
          { Data: [{ VarCharValue: eservice1Uuid }, { VarCharValue: consumer1Uuid }, { VarCharValue: 2 }] },
          { Data: [{ VarCharValue: eservice1Uuid }, { VarCharValue: consumer2Uuid }, { VarCharValue: 2 }] },
          { Data: [{ VarCharValue: eservice1Uuid }, { VarCharValue: consumer3Uuid }, { VarCharValue: 2 }] },
          { Data: [{ VarCharValue: eservice1Uuid }, { VarCharValue: consumer4Uuid }, { VarCharValue: 2 }] },
          { Data: [{ VarCharValue: eservice2Uuid }, { VarCharValue: consumer1Uuid }, { VarCharValue: 2 }] },
          { Data: [{ VarCharValue: eservice2Uuid }, { VarCharValue: consumer2Uuid }, { VarCharValue: 2 }] },
          { Data: [{ VarCharValue: eservice3Uuid }, { VarCharValue: consumer1Uuid }, { VarCharValue: 2 }] },
        ],
      },
    } as never)

    const globalStore = await GlobalStoreService.init(readModelMock)
    const result = await getEServicesWithMostTokensMetric(readModelMock, globalStore)

    const total = result.fromTheBeginning[0]

    expect(total.id).toBe('0')

    expect(total.data[0].eserviceId).toBe(eservice1Uuid)
    expect(total.data[0].tokenCount).toBe(8)

    expect(total.data[1].eserviceId).toBe(eservice2Uuid)
    expect(total.data[1].tokenCount).toBe(4)

    expect(total.data[2].eserviceId).toBe(eservice3Uuid)
    expect(total.data[2].tokenCount).toBe(2)
  })
})
