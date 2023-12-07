import { getTenantMock } from '@interop-be-reports/commons'
import { randomUUID } from 'crypto'
import { MacroCategoryCodeFor, MacroCategoryName, readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { sub } from 'date-fns'
import { GlobalStoreService } from '../../services/global-store.service.js'
<<<<<<<< HEAD:jobs/dtd-metrics/src/metrics/__tests__/tenant-signups-trend.metric.test.ts
import { getTenantSignupsTrendMetric } from '../tenant-signups-trend.metric.js'
========
import { getTenantOnboardingTrendMetric } from '../tenant-onboarding-trend.metric.js'
>>>>>>>> 1.0.x:jobs/dtd-metrics/src/metrics/__tests__/tenant-onboarding-trend.metric.test.ts

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
          onboardedAt: oneMonthAgoDate,
          attributes: [{ id: comuneAttributeUuid }],
        }),
      },
      {
        data: getTenantMock({
          onboardedAt: oneMonthAgoDate,
          attributes: [{ id: comuneAttributeUuid }],
        }),
      },
      {
        data: getTenantMock({
          onboardedAt: sixMonthsAgoDate,
          attributes: [{ id: comuneAttributeUuid }],
        }),
      },
      {
        data: getTenantMock({
          onboardedAt: sixMonthsAgoDate,
          attributes: [{ id: aziendaOspedalieraAttributeUuid }],
        }),
      },
      {
        data: getTenantMock({
          onboardedAt: oneYearAgoDate,
          attributes: [{ id: aziendaOspedalieraAttributeUuid }],
        }),
      },
      {
        data: getTenantMock({
          onboardedAt: oneYearAgoDate,
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
<<<<<<<< HEAD:jobs/dtd-metrics/src/metrics/__tests__/tenant-signups-trend.metric.test.ts
    const result = await getTenantSignupsTrendMetric(readModelMock, globalStore)
========
    const result = await getTenantOnboardingTrendMetric(readModelMock, globalStore)
>>>>>>>> 1.0.x:jobs/dtd-metrics/src/metrics/__tests__/tenant-onboarding-trend.metric.test.ts

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
