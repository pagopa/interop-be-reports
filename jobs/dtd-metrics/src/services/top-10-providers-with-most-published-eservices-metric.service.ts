import { EServiceDescriptor, ReadModelClient, TENANTS_COLLECTION_NAME } from '@interop-be-reports/commons'
import { Top10ProvidersWithMostPublishedEServicesMetric } from '../models/metrics.model.js'
import { getMonthsAgoDate } from '../utils/helpers.utils.js'

/**
 * @see https://pagopa.atlassian.net/browse/PIN-4215
 */
export async function getTop10ProvidersWithMostPublishedEServicesMetric(
  readModel: ReadModelClient
): Promise<Top10ProvidersWithMostPublishedEServicesMetric> {
  const sixMonthsAgoDate = getMonthsAgoDate(6)
  const twelveMonthsAgoDate = getMonthsAgoDate(12)
  const fromTheBeginningDate = undefined

  const [lastSixMonths, lastTwelveMonths, fromTheBeginning] = await Promise.all(
    [sixMonthsAgoDate, twelveMonthsAgoDate, fromTheBeginningDate].map((date) =>
      getTop10ProvidersWithMostPublishedEServicesFromDate(readModel, date)
    )
  )

  return Top10ProvidersWithMostPublishedEServicesMetric.parse({ lastSixMonths, lastTwelveMonths, fromTheBeginning })
}

export async function getTop10ProvidersWithMostPublishedEServicesFromDate(
  readModel: ReadModelClient,
  date: Date | undefined
): Promise<unknown> {
  const publishedDateFilter = date
    ? {
        'data.descriptors': {
          $elemMatch: {
            version: '1',
            publishedAt: {
              $gte: date.toISOString(),
            },
          },
        },
      }
    : {}

  return await readModel.eservices
    .aggregate([
      {
        $match: {
          'data.descriptors.state': {
            $in: ['Published', 'Suspended'] satisfies Array<EServiceDescriptor['state']>,
          },
          ...publishedDateFilter,
        },
      },
      {
        $group: {
          _id: '$data.producerId',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
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
          count: 1,
          producerName: { $arrayElemAt: ['$producer.data.name', 0] },
        },
      },
    ])
    .toArray()
}
