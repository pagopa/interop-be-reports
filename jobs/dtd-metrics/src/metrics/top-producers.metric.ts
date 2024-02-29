import { EServiceDescriptor, ReadModelClient, TENANTS_COLLECTION_NAME } from '@interop-be-reports/commons'
import { TopProducersMetric, TopProducersMetricItem } from '../models/metrics.model.js'
import { getMonthsAgoDate } from '../utils/helpers.utils.js'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { Document } from 'mongodb'

/**
 * @see https://pagopa.atlassian.net/browse/PIN-4215
 */
export const getTopProducersMetric: MetricFactoryFn<'entiChePubblicanoPiuEService'> = async (
  readModel,
  globalStore
) => {
  const sixMonthsAgoDate = getMonthsAgoDate(6)
  const twelveMonthsAgoDate = getMonthsAgoDate(12)
  const fromTheBeginningDate = undefined

  const allTenantsIds = globalStore.tenants.map((tenant) => tenant.id)
  const macroCategoriesData = [
    { id: '0', name: 'Totale', tenantsIds: allTenantsIds },
    ...globalStore.macroCategories.map((category) => ({
      id: category.id,
      name: category.name,
      tenantsIds: category.tenantsIds,
    })),
  ]

  const getTimedMetricData = async (date?: Date): Promise<TopProducersMetric[keyof TopProducersMetric]> => {
    return await Promise.all(
      // For each macro category, get the top producers
      macroCategoriesData.map(async ({ id, name, tenantsIds }) => ({
        id,
        name,
        data: await getTopProducersMetricItems(readModel, tenantsIds, date),
      }))
    )
  }

  return {
    lastSixMonths: await getTimedMetricData(sixMonthsAgoDate),
    lastTwelveMonths: await getTimedMetricData(twelveMonthsAgoDate),
    fromTheBeginning: await getTimedMetricData(fromTheBeginningDate),
  }
}

export async function getTopProducersMetricItems(
  readModel: ReadModelClient,
  tenantsIds: Array<string>,
  date?: Date
): Promise<Array<TopProducersMetricItem>> {
  // If date is not provided, the filter will be ignored
  // If date is provided, the filter will return only the e-services published after that date
  const publishedDateFilter: Document = date
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
          // Takes into account only the e-services with at least one published or suspended descriptor
          'data.descriptors.state': {
            $in: ['Published', 'Suspended'] satisfies Array<EServiceDescriptor['state']>,
          },
          'data.producerId': { $in: tenantsIds },
          ...publishedDateFilter,
        },
      },
      // Group by producerId and count the e-services
      {
        $group: {
          _id: '$data.producerId',
          count: { $sum: 1 },
        },
      },
      // Sort by the e-service count and take the top 10
      { $sort: { count: -1 } },
      { $limit: 10 },
      // Join with the tenants collection to get the producer name
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
