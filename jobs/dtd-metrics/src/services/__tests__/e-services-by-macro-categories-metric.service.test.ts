import { getAttributeMock, getEServiceMock, getTenantMock } from '@interop-be-reports/commons'
import { MacroCategoryCodeFor, MacroCategoryName, readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { getEServicesByMacroCategoriesMetric } from '../e-services-by-macro-categories-metric.service.js'
import { GlobalStoreService } from '../global-store.service.js'
import { randomUUID } from 'crypto'

const comuniTenantUUID = randomUUID()
const aziendaOspedalieraTenantUUID = randomUUID()

const comuniAttributeUUID = randomUUID()
const aziendaOspedalieraAttributeUUID = randomUUID()

describe('getEServicesByMacroCategoriesMetric', () => {
  it('should return the correct metrics', async () => {
    await seedCollection('eservices', [
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Suspended' }, { state: 'Draft' }],
          producerId: comuniTenantUUID,
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Suspended' }, { state: 'Deprecated' }],
          producerId: comuniTenantUUID,
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Draft' }],
          producerId: comuniTenantUUID,
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Draft' }],
          producerId: aziendaOspedalieraTenantUUID,
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Published' }],
          producerId: aziendaOspedalieraTenantUUID,
        }),
      },
    ])

    await seedCollection('tenants', [
      {
        data: getTenantMock({
          id: comuniTenantUUID,
          attributes: [{ id: comuniAttributeUUID }],
        }),
      },
      {
        data: getTenantMock({
          id: aziendaOspedalieraTenantUUID,
          attributes: [{ id: aziendaOspedalieraAttributeUUID }],
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

    const globalStore = await GlobalStoreService.init(readModelMock)
    const result = await getEServicesByMacroCategoriesMetric(readModelMock, globalStore)

    expect(result.find((a) => (a.name as MacroCategoryName) === 'Comuni')?.count).toStrictEqual(2)
    expect(result.find((a) => (a.name as MacroCategoryName) === 'Aziende Ospedaliere e ASL')?.count).toStrictEqual(1)
  })
})
