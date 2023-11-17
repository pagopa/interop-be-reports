import { getAgreementMock, getTenantMock } from '@interop-be-reports/commons'
import { MacroCategoryCodeFor, readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { randomUUID } from 'crypto'
import { GlobalStoreService } from '../../services/global-store.service.js'
import { tenantDistributionMetric } from '../tenant-distribution.metric.js'

const producerUUID = randomUUID()
const consumerUUID = randomUUID()
const bothUUID = randomUUID()
const firstAccessUUID = randomUUID()
const comuniAttributeUUID = randomUUID()

describe('tenantDistributionMetric', () => {
  it('should return the correct metrics', async () => {
    await seedCollection('tenants', [
      { data: getTenantMock({ id: producerUUID, attributes: [{ id: comuniAttributeUUID }] }) },
      { data: getTenantMock({ id: consumerUUID, attributes: [{ id: comuniAttributeUUID }] }) },
      { data: getTenantMock({ id: bothUUID, attributes: [{ id: comuniAttributeUUID }] }) },
      { data: getTenantMock({ id: firstAccessUUID, attributes: [{ id: comuniAttributeUUID }] }) },
    ])

    await seedCollection('agreements', [
      { data: getAgreementMock({ consumerId: bothUUID, producerId: producerUUID, state: 'Active' }) },
      { data: getAgreementMock({ consumerId: consumerUUID, producerId: bothUUID, state: 'Active' }) },
      { data: getAgreementMock({ consumerId: consumerUUID, producerId: producerUUID, state: 'Active' }) },
    ])

    await seedCollection('attributes', [
      { data: { id: comuniAttributeUUID, code: 'L18' satisfies MacroCategoryCodeFor<'Comuni'> } },
    ])

    const globalStore = await GlobalStoreService.init(readModelMock)
    const result = await tenantDistributionMetric.factoryFn(readModelMock, globalStore)

    expect(result?.[0].count).toEqual(1)
    expect(result?.[1].count).toEqual(1)
    expect(result?.[2].count).toEqual(1)
    expect(result?.[3].count).toEqual(1)
  })
})