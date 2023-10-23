import { getAgreementMock, getTenantMock } from '@interop-be-reports/commons'
import { readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { getTenantDistributionMetric } from '../tenant-distribution-metric.service.js'

describe('getTenantDistributionMetric', () => {
  it('should return the correct metrics', async () => {
    await seedCollection('tenants', [
      { data: getTenantMock({ id: 'producer', selfcareId: 'selfcareId' }) },
      { data: getTenantMock({ id: 'consumer', selfcareId: 'selfcareId' }) },
      { data: getTenantMock({ id: 'both', selfcareId: 'selfcareId' }) },
      { data: getTenantMock({ id: 'first-access', selfcareId: 'selfcareId' }) },
    ])

    await seedCollection('agreements', [
      { data: getAgreementMock({ consumerId: 'both', producerId: 'producer', state: 'Active' }) },
      { data: getAgreementMock({ consumerId: 'consumer', producerId: 'both', state: 'Active' }) },
      { data: getAgreementMock({ consumerId: 'consumer', producerId: 'producer', state: 'Active' }) },
    ])

    const result = await getTenantDistributionMetric(readModelMock)

    expect(result[0].count).toEqual(1)
    expect(result[1].count).toEqual(1)
    expect(result[2].count).toEqual(1)
    expect(result[3].count).toEqual(1)
  })
})
