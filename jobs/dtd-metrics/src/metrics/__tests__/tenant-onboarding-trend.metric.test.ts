import { getTenantMock } from '@interop-be-reports/commons'
import { randomUUID } from 'crypto'
import { readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { GlobalStoreService } from '../../services/global-store.service.js'
import { getTenantOnboardingTrendMetric } from '../tenant-onboarding-trend.metric.js'

describe('getTenantOnboardingTrendMetric', () => {
  it('should return the correct metrics', async () => {
    const onboardedTenants = [
      {
        data: getTenantMock({
          id: randomUUID(),
          externalId: { value: 'IPA' },
        }),
      },
      {
        data: getTenantMock({
          id: randomUUID(),
          externalId: { value: 'IPA' },
        }),
      },
      {
        data: getTenantMock({
          id: randomUUID(),
          externalId: { value: 'IPA' },
        }),
      },
    ]

    const onboardedNoIPATenants = [
      {
        data: getTenantMock({
          id: randomUUID(),
          externalId: { value: 'NOIPA' },
        }),
      },
    ]

    await seedCollection('tenants', onboardedTenants)
    await seedCollection('tenants', onboardedNoIPATenants)

    const globalStore = await GlobalStoreService.init(readModelMock)
    const result = await getTenantOnboardingTrendMetric(readModelMock, globalStore)

    expect(result[result.length - 1].count).toEqual(onboardedTenants.length + onboardedNoIPATenants.length)
  })
})
