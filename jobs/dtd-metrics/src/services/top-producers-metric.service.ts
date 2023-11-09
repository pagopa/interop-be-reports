import { EServiceDescriptor, ReadModelClient, TENANTS_COLLECTION_NAME } from '@interop-be-reports/commons'
import { TopProducersMetricItem, TopProducersMetric } from '../models/metrics.model.js'
import { getMonthsAgoDate } from '../utils/helpers.utils.js'

/**
 * @see https://pagopa.atlassian.net/browse/PIN-4215
 */
export async function getTopProducersMetric(readModel: ReadModelClient): Promise<TopProducersMetric> {
  const sixMonthsAgoDate = getMonthsAgoDate(6)
  const twelveMonthsAgoDate = getMonthsAgoDate(12)
  const fromTheBeginningDate = undefined

  const [lastSixMonths, lastTwelveMonths, fromTheBeginning] = await Promise.all(
    [sixMonthsAgoDate, twelveMonthsAgoDate, fromTheBeginningDate].map((date) =>
      getTopProducersMetricFromDate(readModel, date)
    )
  )

  return TopProducersMetric.parse({ lastSixMonths, lastTwelveMonths, fromTheBeginning })
}

export async function getTopProducersMetricFromDate(
  readModel: ReadModelClient,
  date: Date | undefined
): Promise<Array<TopProducersMetricItem>> {
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
    .map((data) => TopProducersMetricItem.parse(data))
    .toArray()
}
