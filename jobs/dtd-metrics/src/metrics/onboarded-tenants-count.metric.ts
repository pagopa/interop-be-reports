import { OnboardedTenantsCountMetric } from '../models/metrics.model.js'
import { GlobalStoreService } from '../services/global-store.service.js'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { getMonthsAgoDate, getVariationPercentage } from '../utils/helpers.utils.js'

export const getOnboardedTenantsCountMetric: MetricFactoryFn<'totaleEnti'> = (_readModel, globalStore) => {
  return OnboardedTenantsCountMetric.parse([
    getMetricData('Totale enti', globalStore),
    getMetricData('Pubblici', globalStore),
    getMetricData('Privati', globalStore),
    getMetricData('Comuni', globalStore),
    getMetricData('Regioni e Province autonome', globalStore),
    getMetricData('Università e AFAM', globalStore),
  ])
}

function getMetricData(
  name: OnboardedTenantsCountMetric[number]['name'],
  globalStore: GlobalStoreService
): OnboardedTenantsCountMetric[number] {
  let tenants: Array<{ onboardedAt: Date }>

  switch (name) {
    case 'Totale enti':
      tenants = [...globalStore.tenants, ...globalStore.notIPATenants]
      break
    case 'Pubblici':
      tenants = globalStore.tenants
      break
    case 'Privati':
      tenants = globalStore.notIPATenants
      break
    default:
      tenants = globalStore.getMacroCategoryByName(name).tenants
  }

  const totalCount = tenants.length
  const lastMonthCount = getLastMonthTenantsCount(tenants)
  const variation = getVariationPercentage(lastMonthCount, totalCount)

  return {
    name,
    totalCount,
    lastMonthCount,
    variation,
  }
}

function getLastMonthTenantsCount<TTenant extends { onboardedAt: Date }>(tenants: Array<TTenant>): number {
  const oneMonthAgoDate = getMonthsAgoDate(1)
  return tenants.filter((tenant) => tenant.onboardedAt >= oneMonthAgoDate).length
}
