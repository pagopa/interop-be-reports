import { TenantOnboardingTrendMetric } from '../models/metrics.model.js'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { getOldestDate, toTimeseriesSequenceData } from '../utils/helpers.utils.js'

export const getTenantOnboardingTrendMetric: MetricFactoryFn<'andamentoDelleAdesioni'> = (_, globalStore) => {
  const allTenantsOnboardedAtDates = globalStore.tenants.map((tenant) => tenant.onboardedAt)

  const oldestTenantDate = getOldestDate(allTenantsOnboardedAtDates)

  return TenantOnboardingTrendMetric.parse(
    toTimeseriesSequenceData({
      oldestDate: oldestTenantDate,
      jump: { months: 1 },
      data: allTenantsOnboardedAtDates,
    })
  )
}
