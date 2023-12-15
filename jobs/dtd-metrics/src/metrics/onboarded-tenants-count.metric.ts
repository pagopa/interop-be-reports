import { OnboardedTenantsCountMetric } from '../models/metrics.model.js'
import { GlobalStoreService, GlobalStoreOnboardedTenant } from '../services/global-store.service.js'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { getMonthsAgoDate, getVariationPercentage } from '../utils/helpers.utils.js'

export const getOnboardedTenantsCountMetric: MetricFactoryFn<'totaleEnti'> = (_readModel, globalStore) => {
  return OnboardedTenantsCountMetric.parse([
    getMetricData('Totale', globalStore),
    getMetricData('Comuni', globalStore),
    getMetricData('Regioni e Province Autonome', globalStore),
    getMetricData('Università e AFAM', globalStore),
  ])
}

function getMetricData(
  name: OnboardedTenantsCountMetric[number]['name'],
  globalStore: GlobalStoreService
): OnboardedTenantsCountMetric[number] {
  const onboardedTenants =
    name === 'Totale' ? globalStore.onboardedTenants : globalStore.getMacroCategoryByName(name).onboardedTenants

  const totalCount = onboardedTenants.length
  const lastMonthCount = getLastMonthTenantsCount(onboardedTenants)
  const variation = getVariationCount(onboardedTenants, lastMonthCount)

  return {
    name,
    totalCount,
    lastMonthCount,
    variation,
  }
}

function getLastMonthTenantsCount(tenants: Array<GlobalStoreOnboardedTenant>): number {
  const oneMonthAgoDate = getMonthsAgoDate(1)
  return tenants.filter((tenant) => tenant.onboardedAt >= oneMonthAgoDate).length
}

function getVariationCount(tenants: Array<GlobalStoreOnboardedTenant>, lastMonthTenantsCount: number): number {
  const oneMonthAgoDate = getMonthsAgoDate(1)
  const twoMonthsAgoDate = getMonthsAgoDate(2)

  const twoMonthsAgoTenantsCount = tenants.filter(
    (tenant) => tenant.onboardedAt >= twoMonthsAgoDate && tenant.onboardedAt <= oneMonthAgoDate
  ).length

  return getVariationPercentage(lastMonthTenantsCount, twoMonthsAgoTenantsCount)
}
