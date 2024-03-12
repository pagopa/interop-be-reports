import { AgreementState, TENANTS_COLLECTION_NAME } from '@interop-be-reports/commons'
import { TopProducersBySubscribersMetric } from '../models/metrics.model.js'
import { getMonthsAgoDate } from '../utils/helpers.utils.js'
import { z } from 'zod'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'

const ProducerAgreement = z.object({
  consumerId: z.string(),
  createdAt: z.coerce.date(),
})

const ProducerAgreements = z.object({
  name: z.string(),
  agreements: z.array(ProducerAgreement),
})

/**
 * @see https://pagopa.atlassian.net/browse/PIN-3747
 */
export const getTopProducersBySubscribersMetric: MetricFactoryFn<'connessioniFraEnti'> = async (
  readModel,
  globalStore
) => {
  const sixMonthsAgoDate = getMonthsAgoDate(6)
  const twelveMonthsAgoDate = getMonthsAgoDate(12)
  const fromTheBeginningDate = undefined

  /**
   * Retrieves all agreements grouped by producerId
   * */
  const agreementsGroupedByProducers = await readModel.agreements
    .aggregate([
      {
        $match: {
          'data.state': {
            $in: ['Active', 'Suspended'] satisfies Array<AgreementState>,
          },
        },
      },
      {
        $group: {
          _id: '$data.producerId',
          agreements: {
            $push: {
              consumerId: '$data.consumerId',
              createdAt: '$data.createdAt',
            },
          },
        },
      },
      {
        $lookup: {
          from: TENANTS_COLLECTION_NAME,
          localField: '_id',
          foreignField: 'data.id',
          as: 'producer',
        },
      },
      {
        $project: {
          _id: 0,
          name: { $arrayElemAt: ['$producer.data.name', 0] },
          agreements: 1,
        },
      },
    ])
    .map((data) => ProducerAgreements.parse(data))
    .toArray()

  const produceMetricByDate = (
    date: Date | undefined
  ): TopProducersBySubscribersMetric['fromTheBeginning' | 'lastSixMonths' | 'lastTwelveMonths'] => {
    return (
      agreementsGroupedByProducers
        .map((producer) => {
          return {
            producerName: producer.name,
            macroCategories: globalStore.macroCategories
              .map((macroCategory) => {
                /**
                 * Filter out agreements that not belong to the macro category or that are not
                 * created after the given date
                 */
                const macroCategoryAgreements = producer.agreements.filter((agreement) => {
                  const isInMacroCategory = macroCategory.tenantsIds.includes(agreement.consumerId)
                  const isCreatedAfterDate = date ? agreement.createdAt >= date : true

                  return isInMacroCategory && isCreatedAfterDate
                })

                /**
                 * Count the number of subscribers
                 * */
                const subscribersCount = new Set(macroCategoryAgreements.map((a) => a.consumerId)).size

                return { id: macroCategory.id, name: macroCategory.name, subscribersCount }
              })
              .filter((macroCategory) => macroCategory.subscribersCount > 0),
          }
        })
        /**
         * Sort the producers by the total number of subscribers
         */
        .sort(
          (a, b) =>
            b.macroCategories.reduce((curr, prev) => curr + prev.subscribersCount, 0) -
            a.macroCategories.reduce((curr, prev) => curr + prev.subscribersCount, 0)
        )
        .slice(0, 10)
    )
  }

  return TopProducersBySubscribersMetric.parse({
    lastSixMonths: produceMetricByDate(sixMonthsAgoDate),
    lastTwelveMonths: produceMetricByDate(twelveMonthsAgoDate),
    fromTheBeginning: produceMetricByDate(fromTheBeginningDate),
  })
}
