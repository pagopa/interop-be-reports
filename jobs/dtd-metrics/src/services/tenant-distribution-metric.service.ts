import { AgreementState, ReadModelClient } from '@interop-be-reports/commons'
import { TenantDistributionMetric } from '../models/metrics.model.js'
import uniq from 'lodash/uniq.js'
import { z } from 'zod'

export async function getTenantDistributionMetric(readModel: ReadModelClient): Promise<TenantDistributionMetric> {
  const onBoardedTenantIdsQueryPromise = readModel.tenants
    .find({ 'data.selfcareId': { $exists: true } }, { projection: { _id: 0, 'data.id': 1 } })
    .map(({ data }) => z.string().parse(data.id))
    .toArray()

  const activeAgreementsQueryPromise = readModel.agreements
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

  const [onBoardedTenantIds, activeAgreements] = await Promise.all([
    onBoardedTenantIdsQueryPromise,
    activeAgreementsQueryPromise,
  ])

  const agreementsConsumersIds = uniq(activeAgreements.map((agreement) => agreement.consumerId))
  const agreementsProducersIds = uniq(activeAgreements.map((agreement) => agreement.producerId))

  function checkIsConsumer(tenantId: string): boolean {
    return agreementsConsumersIds.includes(tenantId)
  }

  function checkIsProducer(tenantId: string): boolean {
    return agreementsProducersIds.includes(tenantId)
  }

  type TenantDistributionItem = TenantDistributionMetric[number]

  const onlyConsumers: TenantDistributionItem = {
    label: 'Solo fruitore',
    count: 0,
  }

  const onlyProducers: TenantDistributionItem = {
    label: 'Solo erogatore',
    count: 0,
  }

  const bothConsumersAndProducers: TenantDistributionItem = {
    label: 'Sia fruitore che erogatore',
    count: 0,
  }

  const onlyFirstAccess: TenantDistributionItem = {
    label: 'Solo primo accesso',
    count: 0,
  }

  function resolveTenantDistribution(tenantId: string): void {
    const isTenantProducer = checkIsProducer(tenantId)
    const isTenantConsumer = checkIsConsumer(tenantId)

    if (isTenantProducer && isTenantConsumer) bothConsumersAndProducers.count++
    else if (isTenantProducer) onlyProducers.count++
    else if (isTenantConsumer) onlyConsumers.count++
    else onlyFirstAccess.count++
  }

  onBoardedTenantIds.forEach(resolveTenantDistribution)

  return [onlyConsumers, onlyProducers, bothConsumersAndProducers, onlyFirstAccess]
}
