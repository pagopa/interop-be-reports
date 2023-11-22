import { AgreementState } from '@interop-be-reports/commons'
import { TenantDistributionMetric } from '../models/metrics.model.js'
import { z } from 'zod'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'

export const getTenantDistributionMetric: MetricFactoryFn<'tenantDistribution'> = async (readModel, globalStore) => {
  const activeAgreements = await readModel.agreements
    .find(
      { 'data.state': { $in: ['Active', 'Suspended'] satisfies Array<AgreementState> } },
      {
        projection: {
          _id: 0,
          'data.producerId': 1,
          'data.consumerId': 1,
        },
      }
    )
    .map(({ data }) =>
      z
        .object({
          producerId: z.string(),
          consumerId: z.string(),
        })
        .parse(data)
    )
    .toArray()

  const agreementsConsumersIds = new Set(activeAgreements.map((agreement) => agreement.consumerId))
  const agreementsProducersIds = new Set(activeAgreements.map((agreement) => agreement.producerId))

  function checkIsConsumer(tenantId: string): boolean {
    return agreementsConsumersIds.has(tenantId)
  }

  function checkIsProducer(tenantId: string): boolean {
    return agreementsProducersIds.has(tenantId)
  }

  type TenantDistributionItem = TenantDistributionMetric[number]

  const onlyConsumers: TenantDistributionItem = {
    activity: 'Solo fruitore',
    count: 0,
  }

  const onlyProducers: TenantDistributionItem = {
    activity: 'Solo erogatore',
    count: 0,
  }

  const bothConsumersAndProducers: TenantDistributionItem = {
    activity: 'Sia fruitore che erogatore',
    count: 0,
  }

  const onlyAccess: TenantDistributionItem = {
    activity: 'Solo accesso',
    count: 0,
  }

  function resolveTenantDistribution<TTenant extends { id: string }>({ id }: TTenant): void {
    const isTenantProducer = checkIsProducer(id)
    const isTenantConsumer = checkIsConsumer(id)

    if (isTenantProducer && isTenantConsumer) bothConsumersAndProducers.count++
    else if (isTenantProducer) onlyProducers.count++
    else if (isTenantConsumer) onlyConsumers.count++
    else onlyAccess.count++
  }

  globalStore.onboardedTenants.forEach(resolveTenantDistribution)

  return [onlyConsumers, onlyProducers, bothConsumersAndProducers, onlyAccess]
}
