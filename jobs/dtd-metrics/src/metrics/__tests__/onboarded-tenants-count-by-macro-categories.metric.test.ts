import { Tenant, getAttributeMock, getTenantMock } from '@interop-be-reports/commons'
import { randomUUID } from 'crypto'
import { MacroCategoryCodeFor, MacroCategoryName, readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { sub } from 'date-fns'
import { GlobalStoreService } from '../../services/global-store.service.js'
import { getOnboardedTenantsCountByMacroCategoriesMetric } from '../onboarded-tenants-count-by-macro-categories.metric.js'

const comuneAttributeUuid = randomUUID()
const aziendaOspedalieraAttributeUuid = randomUUID()

const oneMonthAgoDate = sub(new Date(), { months: 1 }).toISOString()
const sixMonthsAgoDate = sub(new Date(), { months: 6 }).toISOString()
const oneYearAgoDate = sub(new Date(), { years: 1 }).toISOString()

describe('getOnboardedTenantsCountByMacroCategoriesMetric', () => {
  it('should return the correct metrics', async () => {
    const oboardedTenants = [
      {
        data: getTenantMock({
          createdAt: oneMonthAgoDate,
          attributes: [{ id: comuneAttributeUuid }],
        }),
      },
      {
        data: getTenantMock({
          createdAt: oneMonthAgoDate,
          attributes: [{ id: comuneAttributeUuid }],
        }),
      },
      {
        data: getTenantMock({
          createdAt: sixMonthsAgoDate,
          attributes: [{ id: comuneAttributeUuid }],
        }),
      },
      {
        data: getTenantMock({
          createdAt: sixMonthsAgoDate,
          attributes: [{ id: aziendaOspedalieraAttributeUuid }],
        }),
      },
      {
        data: getTenantMock({
          createdAt: oneYearAgoDate,
          attributes: [{ id: aziendaOspedalieraAttributeUuid }],
        }),
      },
      {
        data: getTenantMock({
          createdAt: oneYearAgoDate,
          attributes: [{ id: aziendaOspedalieraAttributeUuid }],
        }),
      },
    ]

    const getNotOnboardedTenantMock = (createdAt: string, attributeId: string): Tenant => {
      const tenant = getTenantMock<Tenant>({
        createdAt,
        attributes: [{ id: attributeId }],
      })
      delete tenant.selfcareId
      return tenant
    }

    const notOnboardedTenants = [
      {
        data: getNotOnboardedTenantMock(oneMonthAgoDate, comuneAttributeUuid),
      },
      {
        data: getNotOnboardedTenantMock(oneMonthAgoDate, comuneAttributeUuid),
      },
      {
        data: getNotOnboardedTenantMock(sixMonthsAgoDate, comuneAttributeUuid),
      },
      {
        data: getNotOnboardedTenantMock(sixMonthsAgoDate, aziendaOspedalieraAttributeUuid),
      },
      {
        data: getNotOnboardedTenantMock(oneYearAgoDate, aziendaOspedalieraAttributeUuid),
      },
      {
        data: getNotOnboardedTenantMock(oneYearAgoDate, aziendaOspedalieraAttributeUuid),
      },
    ]

    const attributes = [
      { data: getAttributeMock({ id: comuneAttributeUuid, code: 'L18' satisfies MacroCategoryCodeFor<'Comuni'> }) },
      {
        data: getAttributeMock({
          id: aziendaOspedalieraAttributeUuid,
          code: 'L8' satisfies MacroCategoryCodeFor<'Aziende Ospedaliere e ASL'>,
        }),
      },
    ]

    await seedCollection('tenants', [...oboardedTenants, ...notOnboardedTenants])
    await seedCollection('attributes', attributes)

    const globalStore = await GlobalStoreService.init(readModelMock)
    const result = await getOnboardedTenantsCountByMacroCategoriesMetric(readModelMock, globalStore)

    const comuniMetric = result?.fromTheBeginning.find(
      (metric) => metric.name === ('Comuni' satisfies MacroCategoryName)
    )

    const aziendeOspedaliereMetric = result?.fromTheBeginning.find(
      (metric) => metric.name === ('Aziende Ospedaliere e ASL' satisfies MacroCategoryName)
    )

    expect(comuniMetric?.onboardedCount).toBe(3)
    expect(comuniMetric?.totalCount).toBe(6)

    expect(aziendeOspedaliereMetric?.onboardedCount).toBe(3)
    expect(aziendeOspedaliereMetric?.totalCount).toBe(6)
  })
})
