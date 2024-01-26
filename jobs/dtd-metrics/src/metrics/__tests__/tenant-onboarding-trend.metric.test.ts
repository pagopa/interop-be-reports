import { getAttributeMock, getTenantMock } from '@interop-be-reports/commons'
import { randomUUID } from 'crypto'
import { MacroCategoryCodeFor, readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { GlobalStoreService } from '../../services/global-store.service.js'
import { getTenantOnboardingTrendMetric } from '../tenant-onboarding-trend.metric.js'

const comuniAttributeId = randomUUID()

describe('getTenantOnboardingTrendMetric', () => {
  it('should return the correct metrics', async () => {
    const onboardedTenants = [
      {
        data: getTenantMock({
          id: randomUUID(),
          attributes: [{ id: comuniAttributeId }],
        }),
      },
      {
        data: getTenantMock({
          id: randomUUID(),
          attributes: [{ id: comuniAttributeId }],
        }),
      },
      {
        data: getTenantMock({
          id: randomUUID(),
          attributes: [{ id: comuniAttributeId }],
        }),
      },
    ]

    const onboardedNoIPATenants = [
      {
        data: getTenantMock({
          id: randomUUID(),
          externalId: { origin: 'NOIPA' },
        }),
      },
    ]

    await seedCollection('tenants', onboardedTenants)
    await seedCollection('tenants', onboardedNoIPATenants)
    await seedCollection('attributes', [
      { data: getAttributeMock({ id: comuniAttributeId, code: 'L18' satisfies MacroCategoryCodeFor<'Comuni'> }) },
    ])

    const globalStore = await GlobalStoreService.init(readModelMock)
    const result = await getTenantOnboardingTrendMetric(readModelMock, globalStore)

    expect(result[result.length - 1].count).toEqual(onboardedTenants.length + onboardedNoIPATenants.length)
  })
})
