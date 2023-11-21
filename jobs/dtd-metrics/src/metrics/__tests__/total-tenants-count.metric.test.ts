import { Tenant, getAttributeMock, getTenantMock } from '@interop-be-reports/commons'
import { MacroCategoryCodeFor, readModelMock, repeatObjInArray, seedCollection } from '../../utils/tests.utils.js'
import { randomUUID } from 'crypto'
import { getMonthsAgoDate } from '../../utils/helpers.utils.js'
import { GlobalStoreService } from '../../services/global-store.service.js'
import { getOnboardedTenantsCountMetric } from '../onboarded-tenants-count.metric.js'

const comuniAttributeId = randomUUID()

describe('getOnboardedTenantsCountMetric', () => {
  it('should return the correct metrics', async () => {
    const onboardedTenant = getTenantMock({
      selfcareId: randomUUID(),
      createdAt: getMonthsAgoDate(6),
      attributes: [{ id: comuniAttributeId }],
    })
    const onboardedTenants = repeatObjInArray({ data: onboardedTenant, attributes: [{ id: comuniAttributeId }] }, 10)

    const notOnboardedTenant = getTenantMock<Tenant>({ attributes: [{ id: comuniAttributeId }] })
    delete notOnboardedTenant.selfcareId
    const notOnboardedTenants = repeatObjInArray({ data: notOnboardedTenant }, 10)

    const onboardedLastMonthTenant = getTenantMock({
      selfcareId: randomUUID(),
      attributes: [{ id: comuniAttributeId }],
    })
    const onboardedLastMonthTenants = repeatObjInArray({ data: onboardedLastMonthTenant }, 2)

    await Promise.all([
      seedCollection('tenants', onboardedTenants),
      seedCollection('tenants', notOnboardedTenants),
      seedCollection('tenants', onboardedLastMonthTenants),
      seedCollection('attributes', [
        { data: getAttributeMock({ id: comuniAttributeId, code: 'L18' satisfies MacroCategoryCodeFor<'Comuni'> }) },
      ]),
    ])

    const globalStore = await GlobalStoreService.init(readModelMock)
    const result = await getOnboardedTenantsCountMetric(readModelMock, globalStore)

    expect(result[0].totalTenantsCount).toBe(onboardedTenants.length + onboardedLastMonthTenants.length)
    expect(result[0].lastMonthTenantsCount).toBe(onboardedLastMonthTenants.length)
  })
})
