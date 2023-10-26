import { AgreementState, ReadModelClient, TENANTS_COLLECTION_NAME } from '@interop-be-reports/commons'
import { Top10ProviderWithMostSubscriberMetric } from '../models/metrics.model.js'
import { getMonthsAgoDate, getMacroCategoriesWithAttributes } from '../utils/helpers.utils.js'

/**
 * @see https://pagopa.atlassian.net/browse/PIN-3747
 */
export async function getTop10ProviderWithMostSubscriberMetric(
  readModel: ReadModelClient
): Promise<Top10ProviderWithMostSubscriberMetric> {
  const macroCategoriesWithAttributes = await getMacroCategoriesWithAttributes(readModel)

  const allMacroCategoriesAttributeIds = macroCategoriesWithAttributes
    .map((macro) => macro.attributes.map((a) => a.id))
    .flat()

  const sixMonthsAgoDate = getMonthsAgoDate(6)
  const twelveMonthsAgoDate = getMonthsAgoDate(12)
  const fromTheBeginningDate = undefined

  const [lastSixMonths, lastTwelveMonths, fromTheBeginning] = await Promise.all(
    [sixMonthsAgoDate, twelveMonthsAgoDate, fromTheBeginningDate].map((date) =>
      readModel.agreements
        .aggregate([
          {
            $match: {
              'data.state': {
                $in: ['Active', 'Suspended'] satisfies Array<AgreementState>,
              },
              'data.certifiedAttributes': {
                $elemMatch: { id: { $in: allMacroCategoriesAttributeIds } },
              },
              ...(date ? { 'data.createdAt': { $gte: date.toISOString() } } : {}),
            },
          },
          {
            $group: {
              _id: '$data.producerId',
              agreements: {
                $push: '$data.certifiedAttributes.id',
              },
              agreementsCount: { $sum: 1 },
            },
          },
          { $sort: { agreementsCount: -1 } },
          { $limit: 10 },
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
          {
            $project: {
              name: 1,
              topSubscribers: macroCategoriesWithAttributes.map((macroCategory) => ({
                id: macroCategory.id,
                name: macroCategory.name,
                agreementsCount: {
                  $map: {
                    input: '$agreements',
                    as: 'agreement',
                    in: {
                      $filter: {
                        input: '$$agreement',
                        as: 'attributeId',
                        cond: {
                          $in: ['$$attributeId', macroCategory.attributes.map((a) => a.id)],
                        },
                      },
                    },
                  },
                },
              })),
            },
          },
          {
            $project: {
              name: 1,
              topSubscribers: {
                $map: {
                  input: '$topSubscribers',
                  as: 'topSubscriber',
                  in: {
                    id: '$$topSubscriber.id',
                    name: '$$topSubscriber.name',
                    agreementsCount: {
                      $size: {
                        $filter: {
                          input: '$$topSubscriber.agreementsCount',
                          as: 'agreement',
                          cond: {
                            $gt: [{ $size: '$$agreement' }, 0],
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ])
        .toArray()
    )
  )

  return Top10ProviderWithMostSubscriberMetric.parse({ lastSixMonths, lastTwelveMonths, fromTheBeginning })
}
