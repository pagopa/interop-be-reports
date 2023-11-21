import { OnboardedTenantsCountMetric } from '../models/metrics.model.js'
import { GlobalStoreTenant } from '../services/global-store.service.js'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { getMonthsAgoDate, getVariationPercentage } from '../utils/helpers.utils.js'

export const getOnboardedTenantsCountMetric: MetricFactoryFn<'onboardedTenantsCount'> = async (
  _readModel,
  globalStore
) => {
  const allOnboardedTenants = globalStore.onboardedTenants
  const comuniOnboardedTenants = globalStore.getMacroCategoryByName('Comuni').onboardedTenants
  const regioniOnboardedTenants = globalStore.getMacroCategoryByName('Regioni').onboardedTenants
  const universitaEAFAMOnboardedTenants = globalStore.getMacroCategoryByName('Università e AFAM').onboardedTenants

  const totalOnboardedTenantsCount = allOnboardedTenants.length
  const comuniOnboardedTenantsCount = comuniOnboardedTenants.length
  const regioniOnboardedTenantsCount = regioniOnboardedTenants.length
  const universitaEAFAMOnboardedTenantsCount = universitaEAFAMOnboardedTenants.length

  const lastMonthTotalOnboardedTenantsCount = getLastMonthTenantsCount(allOnboardedTenants)
  const lastMonthComuniOnboardedTenantsCount = getLastMonthTenantsCount(comuniOnboardedTenants)
  const lastMonthRegioniOnboardedTenantsCount = getLastMonthTenantsCount(regioniOnboardedTenants)
  const lastMonthUniversitaEAFAMOnboardedTenantsCount = getLastMonthTenantsCount(universitaEAFAMOnboardedTenants)

  return OnboardedTenantsCountMetric.parse([
    {
      name: 'Totale',
      totalTenantsCount: totalOnboardedTenantsCount,
      lastMonthTenantsCount: lastMonthTotalOnboardedTenantsCount,
      variation: getVariationCount(allOnboardedTenants, lastMonthTotalOnboardedTenantsCount),
    },
    {
      name: 'Comuni',
      totalTenantsCount: comuniOnboardedTenantsCount,
      lastMonthTenantsCount: lastMonthComuniOnboardedTenantsCount,
      variation: getVariationCount(comuniOnboardedTenants, lastMonthComuniOnboardedTenantsCount),
    },
    {
      name: 'Regioni',
      totalTenantsCount: regioniOnboardedTenantsCount,
      lastMonthTenantsCount: lastMonthRegioniOnboardedTenantsCount,
      variation: getVariationCount(regioniOnboardedTenants, lastMonthRegioniOnboardedTenantsCount),
    },
    {
      name: 'Università e AFAM',
      totalTenantsCount: universitaEAFAMOnboardedTenantsCount,
      lastMonthTenantsCount: lastMonthUniversitaEAFAMOnboardedTenantsCount,
      variation: getVariationCount(universitaEAFAMOnboardedTenants, lastMonthUniversitaEAFAMOnboardedTenantsCount),
    },
  ])
}

function getLastMonthTenantsCount(tenants: Array<GlobalStoreTenant>): number {
  const oneMonthAgoDate = getMonthsAgoDate(1)
  return tenants.filter((tenant) => tenant.createdAt >= oneMonthAgoDate).length
}

function getVariationCount(tenants: Array<GlobalStoreTenant>, lastMonthTenantsCount: number): number {
  const oneMonthAgoDate = getMonthsAgoDate(1)
  const twoMonthsAgoDate = getMonthsAgoDate(2)

  const twoMonthsAgoTenantsCount = tenants.filter(
    (tenant) => tenant.createdAt >= twoMonthsAgoDate && tenant.createdAt <= oneMonthAgoDate
  ).length

  return getVariationPercentage(lastMonthTenantsCount, twoMonthsAgoTenantsCount)
}
