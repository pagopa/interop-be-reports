import { Tenant, getTenantMock } from '@interop-be-reports/commons'
import { readModelMock, repeatObjInArray, seedCollection } from '../../utils/tests.utils.js'
import { randomUUID } from 'crypto'
import { getOnboardedTenantsCountMetric } from '../onboarded-tenants-count.service.js'
import { GlobalStoreService } from '../global-store.service.js'
import { getMonthsAgoDate } from '../../utils/helpers.utils.js'

describe('getOnboardedTenantsCountMetric', () => {
  it('should return the correct metrics', async () => {
    const onboardedTenant = getTenantMock({ selfcareId: randomUUID(), createdAt: getMonthsAgoDate(6) })
    const onboardedTenants = repeatObjInArray({ data: onboardedTenant }, 10)

    const notOnboardedTenant = getTenantMock<Tenant>()
    delete notOnboardedTenant.selfcareId
    const notOnboardedTenants = repeatObjInArray({ data: notOnboardedTenant }, 10)

    const onboardedLastMonthTenant = getTenantMock({ selfcareId: randomUUID() })
    const onboardedLastMonthTenants = repeatObjInArray({ data: onboardedLastMonthTenant }, 2)

    await Promise.all([
      seedCollection('tenants', onboardedTenants),
      seedCollection('tenants', notOnboardedTenants),
      seedCollection('tenants', onboardedLastMonthTenants),
    ])

    const globalStore = await GlobalStoreService.init(readModelMock)
    const result = await getOnboardedTenantsCountMetric(globalStore)

    expect(result.totalTenantsCount).toBe(onboardedTenants.length + onboardedLastMonthTenants.length)
    expect(result.lastMonthTenantsCount).toBe(onboardedLastMonthTenants.length)
  })
})
