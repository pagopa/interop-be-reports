import { Tenant, getTenantMock } from '@interop-be-reports/commons'
import { readModelMock, repeatObjInArray, seedCollection } from '../../utils/tests.utils.js'
import { randomUUID } from 'crypto'
import { getOnboardedTenantsCountMetric } from '../onboarded-tenants-count.service.js'

describe('getOnboardedTenantsCountMetric', () => {
  it('should return the correct metrics', async () => {
    const onboardedTenant = getTenantMock({ selfcareId: randomUUID() })
    const onboardedTenants = repeatObjInArray({ data: onboardedTenant }, 20)

    const notOnboardedTenant = getTenantMock<Tenant>()
    delete notOnboardedTenant.selfcareId
    const notOnboardedTenants = repeatObjInArray({ data: notOnboardedTenant }, 10)

    const onboardedLastMonthTenant = getTenantMock({ selfcareId: randomUUID(), createdAt: new Date().toISOString() })
    const onboardedLastMonthTenants = repeatObjInArray({ data: onboardedLastMonthTenant }, 5)

    await Promise.all([
      seedCollection('tenants', onboardedTenants),
      seedCollection('tenants', notOnboardedTenants),
      seedCollection('tenants', onboardedLastMonthTenants),
    ])

    const result = await getOnboardedTenantsCountMetric(readModelMock)

    expect(result.totalTenantsCount).toBe(onboardedTenants.length + onboardedLastMonthTenants.length)
    expect(result.lastMonthTenantsCount).toBe(onboardedLastMonthTenants.length)
  })
})
