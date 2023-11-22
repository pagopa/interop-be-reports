import { getTenantMock } from '@interop-be-reports/commons'
import { randomUUID } from 'crypto'
import { MacroCategoryCodeFor, MacroCategoryName, readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { sub } from 'date-fns'
import { GlobalStoreService } from '../../services/global-store.service.js'
import { getTenantOnboardingTrendMetric } from '../tenant-onboarding-trend.metric.js'

const comuneAttributeUuid = randomUUID()
const aziendaOspedalieraAttributeUuid = randomUUID()

const oneMonthAgoDate = sub(new Date(), { months: 1 }).toISOString()
const sixMonthsAgoDate = sub(new Date(), { months: 6 }).toISOString()
const oneYearAgoDate = sub(new Date(), { years: 1 }).toISOString()
describe('getTenantOnboardingTrendMetric', () => {
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

    const attributes = [
      { data: { id: comuneAttributeUuid, code: 'L18' satisfies MacroCategoryCodeFor<'Comuni'> } },
      {
        data: {
          id: aziendaOspedalieraAttributeUuid,
          code: 'L8' satisfies MacroCategoryCodeFor<'Aziende Ospedaliere e ASL'>,
        },
      },
    ]

    await seedCollection('tenants', oboardedTenants)
    await seedCollection('attributes', attributes)

    const globalStore = await GlobalStoreService.init(readModelMock)
    const result = await getTenantOnboardingTrendMetric(readModelMock, globalStore)

    const comuniMetric = result?.fromTheBeginning.find(
      (metric) => metric.name === ('Comuni' satisfies MacroCategoryName)
    )

    const aziendeOspedaliereMetric = result?.fromTheBeginning.find(
      (metric) => metric.name === ('Aziende Ospedaliere e ASL' satisfies MacroCategoryName)
    )

    expect(comuniMetric?.data[comuniMetric?.data.length - 1].count).toBe(3)
    expect(aziendeOspedaliereMetric?.data[aziendeOspedaliereMetric?.data.length - 1].count).toBe(3)
  })
})
