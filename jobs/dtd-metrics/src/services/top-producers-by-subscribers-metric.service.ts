import { AgreementState, ReadModelClient, TENANTS_COLLECTION_NAME } from '@interop-be-reports/commons'
import { TopProducersBySubscribersMetric } from '../models/metrics.model.js'
import { getMacroCategoriesWithAttributes, getMonthsAgoDate } from '../utils/helpers.utils.js'
import { z } from 'zod'

const ProducerAgreement = z.object({
  consumerId: z.string(),
  certifiedAttributes: z.array(z.string()),
  createdAt: z.coerce.date(),
})

const ProducerAgreements = z.object({
  name: z.string(),
  agreements: z.array(ProducerAgreement),
})

/**
 * @see https://pagopa.atlassian.net/browse/PIN-3747
 */
export async function getTopProducersBySubscribersMetric(
  readModel: ReadModelClient
): Promise<TopProducersBySubscribersMetric> {
  const macroCategoriesWithAttributes = await getMacroCategoriesWithAttributes(readModel)

  const allMacroCategoriesAttributeIds = macroCategoriesWithAttributes
    .map((macro) => macro.attributes.map((a) => a.id))
    .flat()

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
          'data.certifiedAttributes': {
            $elemMatch: { id: { $in: allMacroCategoriesAttributeIds } },
          },
        },
      },
      {
        $group: {
          _id: '$data.producerId',
          agreements: {
            $push: {
              consumerId: '$data.consumerId',
              certifiedAttributes: '$data.certifiedAttributes.id',
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
            macroCategories: macroCategoriesWithAttributes.map((macroCategory) => {
              /**
               * Filter out agreements that not belong to the macro category or that are not
               * created after the given date
               */
              const macroCategoryAgreements = producer.agreements.filter((agreement) => {
                const macroCategoryAttributesIds = macroCategory.attributes.map((a) => a.id)

                const doesBelongToMacroCategory = agreement.certifiedAttributes.some((a) =>
                  macroCategoryAttributesIds.includes(a)
                )

                const isCreatedAfterDate = date ? agreement.createdAt > date : true

                return doesBelongToMacroCategory && isCreatedAfterDate
              })

              /**
               * Count the number of unique consumerIds, meaning that if a consumer has more
               * than one agreement for the same producer, it will be counted only once
               * */
              const agreementsCount = Array.from(new Set(macroCategoryAgreements.map((a) => a.consumerId))).length

              return { id: macroCategory.id, name: macroCategory.name, agreementsCount }
            }),
          }
        })
        /**
         * Sort the producers by the total number of subscribers
         */
        .sort(
          (a, b) =>
            b.macroCategories.reduce((curr, prev) => curr + prev.agreementsCount, 0) -
            a.macroCategories.reduce((curr, prev) => curr + prev.agreementsCount, 0)
        )
    )
  }

  return TopProducersBySubscribersMetric.parse({
    lastSixMonths: produceMetricByDate(sixMonthsAgoDate),
    lastTwelveMonths: produceMetricByDate(twelveMonthsAgoDate),
    fromTheBeginning: produceMetricByDate(fromTheBeginningDate),
  })
}
