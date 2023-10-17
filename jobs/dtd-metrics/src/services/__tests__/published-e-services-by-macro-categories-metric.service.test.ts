import { getAttributeMock, getEServiceMock, getTenantMock } from '@interop-be-reports/commons'
import { MacroCategoryCodeFor, MacroCategoryName, readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { getPublishedEServicesByMacroCategoriesMetric } from '../published-e-services-by-macro-categories-metric.service.js'

describe('getPublishedEServicesByMacroCategoriesMetric', () => {
  it('should return the correct metrics', async () => {
    await seedCollection('eservices', [
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Published' }],
          producerId: 'altra-pub-amm-loc-1',
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Published' }],
          producerId: 'altra-pub-amm-loc-2',
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Suspended' }, { state: 'Draft' }],
          producerId: 'comune',
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Suspended' }, { state: 'Deprecated' }],
          producerId: 'comune',
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Draft' }],
          producerId: 'comune',
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Draft' }],
          producerId: 'azienda-ospedaliera',
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Published' }],
          producerId: 'azienda-ospedaliera',
        }),
      },
    ])

    await seedCollection('tenants', [
      {
        data: getTenantMock({
          id: 'comune',
          attributes: [{ id: 'attribute-comune', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'altra-pub-amm-loc-1',
          attributes: [{ id: 'attribute-altra-pub-amm-loc-1', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'altra-pub-amm-loc-2',
          attributes: [{ id: 'attribute-altra-pub-amm-loc-2', type: 'PersistentCertifiedAttribute' }],
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
        }),
      },
      {
        data: getAttributeMock({
          id: 'attribute-altra-pub-amm-loc-1',
          code: 'C16' satisfies MacroCategoryCodeFor<'Pubbliche Amministrazioni Centrali'>,
        }),
      },
      {
        data: getAttributeMock({
          id: 'attribute-altra-pub-amm-loc-2',
          code: 'C1' satisfies MacroCategoryCodeFor<'Pubbliche Amministrazioni Centrali'>,
        }),
      },
      {
        data: getAttributeMock({
          id: 'attribute-azienda-ospedaliera',
          code: 'L8' satisfies MacroCategoryCodeFor<'Aziende Ospedaliere e ASL'>,
        }),
      },
    ])

    const result = await getPublishedEServicesByMacroCategoriesMetric(readModelMock)

    expect(
      result.find((a) => (a.name as MacroCategoryName) === 'Pubbliche Amministrazioni Centrali')
        ?.publishedEServicesCount
    ).toStrictEqual(2)

    expect(
      result.find((a) => (a.name as MacroCategoryName) === 'Comuni e città metropolitane')?.publishedEServicesCount
    ).toStrictEqual(2)
    expect(
      result.find((a) => (a.name as MacroCategoryName) === 'Aziende Ospedaliere e ASL')?.publishedEServicesCount
    ).toStrictEqual(1)
  })
})
